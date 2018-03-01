const APP_ROOT = "../../";
const _ = require("lodash");
const co = require("co");
const Promise = require("bluebird");
const http = require("superagent-promise")(require("superagent"), Promise);
const aws4 = require("../../lib/aws4");
const URL = require("url");

const mode = process.env.TEST_MODE;

const respondFrom = httpRes => {
  const contentType = _.get(httpRes, "header.content-type", "application/json");
  const body = contentType === "application/json" ? httpRes.body : httpRes.text;
  return {
    statusCode: httpRes.status,
    body,
    headers: httpRes.headers
  };
};

const signHttpRequest = (url, httpReq) => {
  const urlData = URL.parse(url);
  const opts = {
    host: urlData.hostname,
    path: urlData.pathname
  };
  aws4.sign(opts);
  httpReq
    .set("Host", opts.headers.Host)
    .set("X-Amz-Date", opts.headers["X-Amz-Date"])
    .set("Authorization", opts.headers.Authorization);
  if (opts.headers["X-Amz-Security-Token"]) {
    httpReq.set("X-Amz-Security-Token", opts.headers["X-Amz-Security-Token"]);
  }
};

const viaHttp = co.wrap(function* viaHttp(relPath, method, opts) {
  const root = process.env.TEST_ROOT;
  const url = `${root}/${relPath}`;
  try {
    const httpReq = http(method, url);
    const body = _.get(opts, "body");
    if (body) {
      httpReq.send(body);
    }
    if (_.get(opts, "iam_auth", false) === true) {
      signHttpRequest(url, httpReq);
    }
    const authHeader = _.get(opts, "auth");
    if (authHeader) {
      httpReq.set("Authorization", authHeader);
    }
    const res = yield httpReq;
    return respondFrom(res);
  } catch (err) {
    if (err.status) {
      return {
        statusCode: err.status,
        headers: err.response.headers
      };
    }
    throw err;
  }
});

const viaHandler = (event, functionName) => {
  // eslint-disable-next-line global-require, import/no-dynamic-require
  const { handler } = require(`${APP_ROOT}/functions/${functionName}`);

  return new Promise((resolve, reject) => {
    const context = {};
    const callback = function cb(err, response) {
      if (err) {
        reject(err);
      } else {
        const contentType = _.get(
          response,
          "headers.content-type",
          "application/json"
        );
        if (response.body && contentType === "application/json") {
          response.body = JSON.parse(response.body);
        }
        resolve(response);
      }
    };

    handler(event, context, callback);
  });
};

const weInvokeGetIndex = co.wrap(function* weInvokeGetIndex() {
  return mode === "handler"
    ? yield viaHandler({}, "get-index")
    : yield viaHttp("", "GET");
});

const weInvokeGetRestaurants = co.wrap(function* weInvokeGetRestaurants() {
  return mode === "handler"
    ? yield viaHandler({}, "get-restaurants")
    : yield viaHttp("restaurants", "GET", { iam_auth: true });
});

const weInvokeSearchRestaurants = co.wrap(function* weInvokeSearchRestaurants(
  user,
  theme
) {
  const body = JSON.stringify({ theme });
  const auth = user.idToken;
  return mode === "handler"
    ? yield viaHandler({ body }, "search-restaurants")
    : yield viaHttp("restaurants/search", "POST", { body, auth });
});

module.exports = {
  weInvokeGetIndex,
  weInvokeGetRestaurants,
  weInvokeSearchRestaurants
};
