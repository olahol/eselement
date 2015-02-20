var fs = require("fs")
  , assert = require("assert");

var eselement = require("../lib");

var createElement = eselement.createElement
  , createLiteral = eselement.createLiteral
  , createIdentifier = eselement.createIdentifier
  , runScript = eselement.runScript
  , makeScript = eselement.makeScript;

var content = fs.readFileSync(__dirname + "/../lib/Element/core.js")
  , program = createElement(content);

describe("Element.extra", function () {
  describe("#querySelector", function () {
    it("should select an element of type VariableDecleration", function () {
      var decl = program.querySelector("VariableDeclaration");
      assert.equal(decl.type, "VariableDeclaration");
    });
  });

  describe("#firstChild", function () {
    it("should select the first child of program", function () {
      var el = program.firstChild();
      assert.equal(el, program.body[0]);
    });
  });

  describe("#lastChild", function () {
    it("should select the last child of program", function () {
      var el = program.lastChild();
      var last = program.body[program.body.length - 1];
      assert.equal(el, last);
    });
  });

  describe("#remove", function () {
    it("should remove the last element of program", function () {
      var el = program.lastChild();
      var len = program.body.length;
      el.remove();
      assert.equal(program.body.length, len - 1);
    });

    it("should remove everything from program", function () {
      program.remove();
      assert.equal(program.body.length, 0);
    });
  });
});
