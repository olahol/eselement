var fs = require("fs")
  , assert = require("assert");

var eselement = require("../lib");

var createElement = eselement.createElement
  , createLiteral = eselement.createLiteral
  , createIdentifier = eselement.createIdentifier
  , runScript = eselement.runScript
  , makeScript = eselement.makeScript;

var content = fs.readFileSync(__dirname + "/data/backbone.js");

describe("index", function () {
  describe("#createElement", function () {
    var program = createElement(content);

    it("should create an element of type Program", function () {
      assert.equal(program.type, "Program");
    });
  });

  describe("#createLiteral", function () {
    var literal = createLiteral("test");

    it("should create a literal", function () {
      assert.equal(literal.value, "test");
    });
  });

  describe("#createIdentifier", function () {
    var identifier = createIdentifier("test");

    it("should create an identifier", function () {
      assert.equal(identifier.name, "test");
    });
  });

  describe("#runScript", function () {
    it("should run an emptying script", function () {
      var newContent = runScript(content, function (program) {
        program.remove();
        return program;
      });
      assert.equal(newContent, "");
    });

    it("should not print content", function () {
      runScript(content, function (program) { return program; }, false);
    });

    it("should not print anything", function () {
      runScript("");
    });
  });
});
