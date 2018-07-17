const _ = require("lodash");
const co = require("co");
const AWS = require("aws-sdk");

const kinesis = new AWS.Kinesis();
const sns = new AWS.SNS();
const streamName = process.env.order_events_stream;
const restaurantTopicArn = process.env.restaurant_notification_topic;

const notifyRestaurantOfOrder = co.wrap(function* notifyRestaurantOfOrder(
  order
) {
  const putReq = {
    Message: JSON.stringify(order),
    TopicArn: restaurantTopicArn
  };
  yield sns.publish(putReq).promise();
  console.log(
    `Notified restaurant [${order.restaurantName}] of order [${order.orderId}]`
  );

  const data = _.clone(order);
  data.eventType = "restaurant_notified";

  const putRecordReq = {
    Data: JSON.stringify(data),
    PartitionKey: order.orderId,
    StreamName: streamName
  };
  yield kinesis.putRecord(putRecordReq).promise();
});

module.exports = { restaurantOfOrder: notifyRestaurantOfOrder };
