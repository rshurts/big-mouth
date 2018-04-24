const co = require("co");
const AWS = require("aws-sdk");

const kinesis = new AWS.Kinesis();
const streamName = process.env.order_events_stream;

module.exports.handler = co.wrap(function* handler(event, context, callback) {
  const body = JSON.parse(event.body);
  const { restaurantName } = body;
  const { orderId } = body;
  const { userEmail } = body;

  console.log(
    `Restaurant [${restaurantName}] accepted order id [${orderId}] from user[${userEmail}].`
  );

  const data = {
    orderId,
    userEmail,
    restaurantName,
    eventType: "order_accepted"
  };

  const putReq = {
    Data: JSON.stringify(data),
    PartitionKey: orderId,
    StreamName: streamName
  };

  yield kinesis.putRecord(putReq).promise();

  console.log(`Published 'order_accepted' event to Kinesis.`);

  const response = {
    statusCode: 200,
    body: JSON.stringify({ orderId })
  };

  callback(null, response);
});
