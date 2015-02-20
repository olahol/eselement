var fs = require("fs")
  , assert = require("assert");

var eselement = require("../lib");

var createElement = eselement.createElement
  , createLiteral = eselement.createLiteral
  , createIdentifier = eselement.createIdentifier
  , runScript = eselement.runScript
  , makeScript = eselement.makeScript;

var content = fs.readFileSync(__dirname + "/data/backbone.js")
  , program = createElement(content);

describe("Element.special", function () {
  describe("#appendParams", function () {
    it("should append a param to a function", function () {
      var fn = program.querySelector("FunctionExpression");
      var len = fn.params.length;
      fn.appendParams(createIdentifier("test"));
      assert.equal(fn.params.length, len + 1);
    });
  });

  describe("#appendElements", function () {
    it("should append an element to an array", function () {
      var arr = program.querySelector("ArrayExpression");
      var len = arr.elements.length;
      arr.appendElements(createLiteral("test"));
      assert.equal(arr.elements.length, len + 1);
    });
  });

  describe("#appendBody", function () {
    it("should append a literal program body", function () {
      var len = program.body.length;
      program.appendBody(createLiteral("test"));
      assert.equal(program.body.length, len + 1);
    });
  });
});
