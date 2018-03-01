const co = require("co");
const { expect } = require("chai");
const { init } = require("../steps/init");
const when = require("../steps/when");
const given = require("../steps/given");
const tearDown = require("../steps/tearDown");

describe(`Given an authenticated user`, () => {
  let user;
  before(
    co.wrap(function* before() {
      yield init();
      user = yield given.anAuthenticatedUser();
    })
  );

  after(
    co.wrap(function* after() {
      yield tearDown.anAuthenticatedUser(user);
    })
  );

  describe(`When we invoke the POST /restaurants/search endpoint with theme 'cartoon'`, () => {
    it(
      `Should return an array of 4 restaurants`,
      co.wrap(function* it() {
        const res = yield when.weInvokeSearchRestaurants(user, "cartoon");

        expect(res.statusCode).to.equal(200);
        expect(res.body).to.have.lengthOf(4);

        res.body.forEach(restaurant => {
          expect(restaurant).to.have.property("name");
          expect(restaurant).to.have.property("image");
        });
      })
    );
  });
});
