const co = require("co");
const AWS = require("aws-sdk");

const kinesis = new AWS.Kinesis();
const streamName = process.env.order_events_stream;

module.exports.handler = co.wrap(function* handler(event, context, callback) {
  const body = JSON.parse(event.body);
  const { restaurantName, orderId, userEmail } = body;

  console.log(
    `restaurant [${restaurantName}] has fulfilled order ID [${orderId}] from user [${userEmail}]`
  );

  const data = {
    orderId,
    userEmail,
    restaurantName,
    eventType: "order_fulfilled"
  };

  const req = {
    Data: JSON.stringify(data), // the SDK would base64 encode this for us
    PartitionKey: orderId,
    StreamName: streamName
  };

  yield kinesis.putRecord(req).promise();

  console.log(`published 'order_fulfilled' event into Kinesis`);

  const response = {
    statusCode: 200,
    body: JSON.stringify({ orderId })
  };

  callback(null, response);
});
