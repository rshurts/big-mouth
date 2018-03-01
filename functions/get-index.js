const co = require("co");
const Promise = require("bluebird");
const fs = Promise.promisifyAll(require("fs"));
const Mustache = require("mustache");
const http = require("superagent-promise")(require("superagent"), Promise);
const aws4 = require("../lib/aws4");
const URL = require("url");

const awsRegion = process.env.AWS_REGION;
const cognitoUserPoolId = process.env.cognito_user_pool_id;
const cognitoClientId = process.env.cognito_client_id;
const restaurantsApiRoot = process.env.restaurants_api;

const days = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];

let html;

function* loadHtml() {
  if (!html) {
    html = yield fs.readFileAsync("static/index.html", "utf-8");
  }
  return html;
}

function* getRestaurants() {
  const url = URL.parse(restaurantsApiRoot);
  const opts = {
    host: url.hostname,
    path: url.pathname
  };

  aws4.sign(opts);
  const httpReq = http
    .get(restaurantsApiRoot)
    .set("Host", opts.headers.Host)
    .set("X-Amz-Date", opts.headers["X-Amz-Date"])
    .set("Authorization", opts.headers.Authorization);
  if (opts.headers["X-Amz-Security-Token"]) {
    httpReq.set("X-Amz-Security-Token", opts.headers["X-Amz-Security-Token"]);
  }
  return (yield httpReq).body;
}

module.exports.handler = co.wrap(function* handler(event, context, callback) {
  yield aws4.init();

  const template = yield loadHtml();
  const restaurants = yield getRestaurants();
  const dayOfWeek = days[new Date().getDay()];
  const view = {
    dayOfWeek,
    restaurants,
    awsRegion,
    cognitoUserPoolId,
    cognitoClientId,
    searchUrl: `${restaurantsApiRoot}/search`
  };
  const renderedHtml = Mustache.render(template, view);

  const response = {
    statusCode: 200,
    body: renderedHtml,
    headers: {
      "content-type": "text/html; charset=UTF-8"
    }
  };

  callback(null, response);
});
