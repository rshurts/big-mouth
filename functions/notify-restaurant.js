const _ = require("lodash");
const co = require("co");
const AWS = require("aws-sdk");
const { getRecords } = require("../lib/kinesis");

const kinesis = new AWS.Kinesis();
const sns = new AWS.SNS();
const streamName = process.env.order_events_stream;
const topicArn = process.env.restaurant_notification_topic;

module.exports.handler = co.wrap(function* handler(event, context, callback) {
  const records = getRecords(event);
  const orderPlaced = records.filter(r => r.eventType === "order_placed");

  // eslint-disable-next-line no-restricted-syntax
  for (const order of orderPlaced) {
    const putReq = {
      Message: JSON.stringify(order),
      TopicArn: topicArn
    };
    yield sns.publish(putReq).promise();
    console.log(
      `notified restaurant [${order.restaurantName}] of order [${
        order.orderId
      }]`
    );

    const data = _.clone(order);
    data.eventType = "restaurant_notified";

    const putRecordReq = {
      Data: JSON.stringify(data),
      PartitionKey: order.orderId,
      StreamName: streamName
    };
    yield kinesis.putRecord(putRecordReq).promise();
  }

  callback(null, "all done");
});
