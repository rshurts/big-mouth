const co = require("co");
const notify = require("../lib/notify");

module.exports.handler = co.wrap(function* handler(event, context, callback) {
  const order = JSON.parse(event.Records[0].Sns.Message);
  order.retried = true;

  try {
    yield notify.restaurantOfOrder(order);
    callback(null, "all done");
  } catch (err) {
    callback(err);
  }
});
