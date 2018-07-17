const co = require("co");
const { getRecords } = require("../lib/kinesis");
const notify = require("../lib/notify");
const retry = require("../lib/retry");

module.exports.handler = co.wrap(function* handler(event, context, callback) {
  const records = getRecords(event);
  const orderPlaced = records.filter(r => r.eventType === "order_placed");

  // eslint-disable-next-line no-restricted-syntax
  for (const order of orderPlaced) {
    try {
      yield notify.restaurantOfOrder(order);
    } catch (err) {
      yield retry.restaurantNotification(order);
    }
  }

  callback(null, "all done");
});
