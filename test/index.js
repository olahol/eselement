var fs = require("fs")
  , assert = require("assert");

var eselement = require("../lib");

var createElement = eselement.createElement;

var content = fs.readFileSync(__dirname + "/data/backbone.js");

describe("index", function () {
  describe("#createElement", function () {
    var program = createElement(content);

    it("should create an element of type Program", function () {
      assert.equal(program.type, "Program");
    });
  });
});
