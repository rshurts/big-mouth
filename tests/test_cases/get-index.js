const co = require("co");
const { expect } = require("chai");
const { init } = require("../steps/init");
const when = require("../steps/when");
const cheerio = require("cheerio");

describe(`When we invoke the GET / endpoint`, () => {
  before(() => {
    init();
  });

  it(
    `Should return the index page with 8 restaurants`,
    co.wrap(function* it() {
      const res = yield when.weInvokeGetIndex();

      expect(res.statusCode).to.equal(200);
      expect(res.headers["content-type"]).to.equal("text/html; charset=UTF-8");
      expect(res.body).to.have.string("<!DOCTYPE html>");

      const $ = cheerio.load(res.body);
      const restaurants = $(".restaurant", "#restaurantsUl");
      expect(restaurants.length).to.equal(8);
    })
  );
});
