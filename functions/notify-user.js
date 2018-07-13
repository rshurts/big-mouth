const _ = require("lodash");
const co = require("co");
const AWS = require("aws-sdk");
const { getRecords } = require("../lib/kinesis");

const kinesis = new AWS.Kinesis();
const sns = new AWS.SNS();
const streamName = process.env.order_events_stream;
const topicArn = process.env.user_notification_topic;

module.exports.handler = co.wrap(function* handler(event, context, cb) {
  const records = getRecords(event);
  const orderAccepted = records.filter(r => r.eventType === "order_accepted");

  // eslint-disable-next-line no-restricted-syntax
  for (const order of orderAccepted) {
    const snsReq = {
      Message: JSON.stringify(order),
      TopicArn: topicArn
    };
    yield sns.publish(snsReq).promise();
    console.log(
      `notified user [${order.userEmail}] of order [${
        order.orderId
      }] being accepted`
    );

    const data = _.clone(order);
    data.eventType = "user_notified";

    const kinesisReq = {
      Data: JSON.stringify(data), // the SDK would base64 encode this for us
      PartitionKey: order.orderId,
      StreamName: streamName
    };
    yield kinesis.putRecord(kinesisReq).promise();
    console.log(`published 'user_notified' event to Kinesis`);
  }

  cb(null, "all done");
});
