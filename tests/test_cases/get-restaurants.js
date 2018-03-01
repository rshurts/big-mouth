const co = require("co");
const { expect } = require("chai");
const { init } = require("../steps/init");
const when = require("../steps/when");

describe(`When we invoke the GET /restaurants endpoint`, () => {
  before(() => {
    init();
  });

  it(
    `Should return an array of 8 restaurants`,
    co.wrap(function* it() {
      const res = yield when.weInvokeGetRestaurants();

      expect(res.statusCode).to.equal(200);
      expect(res.body).to.have.lengthOf(8);

      res.body.forEach(restaurant => {
        expect(restaurant).to.have.property("name");
        expect(restaurant).to.have.property("image");
      });
    })
  );
});
