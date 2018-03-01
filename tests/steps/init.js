const co = require("co");
const Promise = require("bluebird");
const awscred = Promise.promisifyAll(require("../../lib/awscred"));

let initialized = false;

const init = co.wrap(function* init() {
  if (initialized) {
    return;
  }

  process.env.restaurants_api =
    "https://rz4fkgnyef.execute-api.us-east-1.amazonaws.com/dev/restaurants";
  process.env.restaurants_table = "restaurants";
  process.env.AWS_REGION = "us-east-1";
  process.env.cognito_client_id = "63c6bhcqs7m3qbu2t96ld0s012";
  process.env.cognito_user_pool_id = "us-east-1_XDkAXwUp5";
  process.env.cognito_server_client_id = "74s15ng74ra6rrv4fgd84b7nv8";

  if (!process.env.AWS_ACCESS_KEY_ID) {
    const cred = (yield awscred.loadAsync()).credentials;
    process.env.AWS_ACCESS_KEY_ID = cred.accessKeyId;
    process.env.AWS_SECRET_ACCESS_KEY = cred.secretAccessKey;

    if (cred.sessionToken) {
      process.env.AWS_SESSION_TOKEN = cred.sessionToken;
    }
  }

  initialized = true;
});

module.exports.init = init;
