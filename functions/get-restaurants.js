const co = require("co");
const AWS = require("aws-sdk");

const dynamodb = new AWS.DynamoDB.DocumentClient();

const defaultResults = process.env.defaultResults || 8;
const tableName = process.env.restaurants_table;

function* getRestaurants(count) {
  const req = {
    TableName: tableName,
    Limit: count
  };

  const res = yield dynamodb.scan(req).promise();
  return res.Items;
}

module.exports.handler = co.wrap(function* handler(event, context, callback) {
  const restaurants = yield getRestaurants(defaultResults);
  const response = {
    statusCode: 200,
    body: JSON.stringify(restaurants)
  };

  callback(null, response);
});
