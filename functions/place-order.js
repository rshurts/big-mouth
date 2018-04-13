const co = require("co");
const AWS = require("aws-sdk");
const chance = require("chance").Chance();

const kinesis = new AWS.Kinesis();
const streamName = process.env.order_events_stream;

module.exports.handler = co.wrap(function* handler(event, context, callback) {
  const { restaurantName } = JSON.parse(event.body);
  const userEmail = event.requestContext.authorizer.claims.email;
  const orderId = chance.guid();
  console.log(
    `Placing order id [${orderId}] to [${restaurantName}] from user[${userEmail}].`
  );

  const data = {
    orderId,
    userEmail,
    restaurantName,
    eventType: "order_placed"
  };

  const putReq = {
    Data: JSON.stringify(data),
    PartitionKey: orderId,
    StreamName: streamName
  };

  yield kinesis.putRecord(putReq).promise();

  console.log(`Published 'order_placed' event to Kinesis.`);

  const response = {
    statusCode: 200,
    body: JSON.stringify({ orderId })
  };

  callback(null, response);
});
