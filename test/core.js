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

describe("Element.core", function () {
  describe("#childElements", function () {
    it("should get all children of program", function () {
      var programChildren = program.childElements();
      var ifChildren = program.querySelector("IfStatement").childElements();

      assert.equal(program.body.length, programChildren.length);
      assert.ok(ifChildren.length < 4);
    });
  });

  describe("#querySelectorAll", function () {
    it("should select all elements of type VariableDecleration", function () {
      var decls = program.querySelectorAll("VariableDeclaration");

      decls.forEach(function (decl) {
        assert.equal(decl.type, "VariableDeclaration");
      });
    });
  });

  describe("#isType", function () {
    it("should throw errors", function () {
      var decl = program.querySelector("VariableDeclaration");

      assert.throws(function () {
        decl.isType();
      }, Error);

      assert.throws(function () {
        decl.isType("FunctionExpression");
      }, /FunctionExpression/);

      assert.throws(function () {
        decl.isType("FunctionExpression", "ArrayExpression");
      }, /ArrayExpression/);

      assert.doesNotThrow(function () {
        decl.isType("VariableDeclaration");
      });
    });
  });

  describe("#appendChild", function () {
    it("should append a literal to the end of program", function () {
      var test = createLiteral("test_append1");
      program.appendChild("body", test);
      assert.ok(program.lastChild().expression.value === "test_append1");
    });

    it("should append literals to the end of program", function () {
      var tests = [createLiteral("test1_append"), createLiteral("test_append2")];
      program.appendChild("body", tests);
      assert.ok(program.lastChild().expression.value === "test_append2");
    });

    it("should change an if statements consequent to a console.log", function () {
      var test = createElement("console.log('foo bar');");
      var statement = program.querySelector("IfStatement");
      statement.appendChild("consequent", test);
      assert.ok(statement.consequent.lastChild().expression.arguments[0].value === "foo bar");
    });

    it("should change an if statements consequent to a console.log", function () {
      var statement = program.querySelector("IfStatement! > ExpressionStatement");
      var test = createElement("console.log('foo bar');");
      statement.appendChild("consequent", test);
      assert.ok(statement.consequent.lastChild().expression.arguments[0].value === "foo bar");
    });

    it("should append a literal to an empty return", function () {
      var statements = program.querySelectorAll("ReturnStatement");
      var empty = statements.filter(function (s) { return s.argument === null; });
      assert.ok(empty.length > 0);
      var test = createLiteral("test_append3");
      empty[0].appendChild("argument", test);
      assert.equal(empty[0].argument, test);
    });

    it("should throw an error about appending", function () {
      var statement = program.querySelector("ReturnStatement! > ThisExpression");
      var test = createLiteral("test_append4");
      assert.throws(function () {
        statement.appendChild("argument", test);
      }, /could not append/);
    });

    it("should throw an error about valid attribute", function () {
      var test = createLiteral("test_replace3");
      assert.throws(function () {
        program.appendChild("test", test);
      }, /valid attribute/);
    });

    it("should throw an error about invalid type", function () {
      var test = createElement({
        type: "SwitchCase"
        , test: null
        , consequent: []
      });
      assert.throws(function () {
        program.appendChild("body", test);
      }, /SwitchCase/);
    });
  });

  describe("#removeChild", function () {
    it("should remove the last child of program", function () {
      var last = program.removeChild(program.lastChild());
      program.childElements().forEach(function (child) {
        assert.notEqual(child, last);
      });
    });

    it("should remove if statements consequent", function () {
      var statement = program.querySelector("IfStatement");
      statement.removeChild(statement.consequent);
    });

    it("should remove all requires", function () {
      var reqs = program.querySelectorAll("[init.callee.name='require']");
      assert.ok(reqs.length > 0);

      reqs.forEach(function (req) {
        req.parentElement.removeChild(req);
      });

      var newReqs = program.querySelectorAll("[callee.name='require']");
      assert.equal(newReqs.length, 0);
    });

    it("should remove a for statements init", function () {
      var forStatement = program.querySelector("ForStatement")
        , init = forStatement.init;
      assert.ok(init);
      forStatement.removeChild(init);
      assert.equal(forStatement.init, null);
    });

    it("should remove an assignment expression's right-hand side", function () {
      var assign = program.querySelector("AssignmentExpression");
      assert.ok(assign.right);
      assign.removeChild(assign.right);
    });

    it("should throw an error", function () {
      var test = createLiteral("test");
      assert.throws(function () {
        program.removeChild(test);
      }, Error);
    });

    it("should throw an error", function () {
      var test = createLiteral("test");
      test.parentElement = program;
      assert.throws(function () {
        program.removeChild(test);
      }, Error);
    });
  });

  describe("#replaceChild", function () {
    it("should replace an if statements consequent with a console.log", function () {
      var test = createElement("console.log('foo bar');");
      var statement = program.querySelector("IfStatement");
      statement.replaceChild(test, statement.consequent);
      assert.equal(statement.consequent, test.body[0]);
    });

    it("should replace an if statements consequent with a console.log expression statement", function () {
      var test = createElement("console.log('foo bar');").body[0];
      var statement = program.querySelector("IfStatement");
      statement.replaceChild(test, statement.consequent);
      assert.equal(statement.consequent, test);
    });

    it("should replace the last child of program with a literal", function () {
      var test = createLiteral("test_replace1");
      program.replaceChild(test, program.lastChild());
      assert.equal(program.lastChild().expression.value, "test_replace1");
    });

    it("should throw an error about parent", function () {
      var test = createLiteral("test_replace2");
      assert.throws(function () {
        program.replaceChild(test, test);
      }, /parent/);
    });

    it("should throw an error about valid attribute", function () {
      var test = createLiteral("test_replace3");
      test.parentElement = program;
      assert.throws(function () {
        program.replaceChild(test, test);
      }, /valid attribute/);
    });

    it("should throw an error about old child", function () {
      var test = createLiteral("test_replace4");
      test.parentElement = program;
      test.parentAttribute = "body";
      assert.throws(function () {
        program.replaceChild(test, test);
      }, /old child was not found/);
    });

    it("should throw an error about invalid type", function () {
      var test = createElement({
        type: "SwitchCase"
        , test: null
        , consequent: []
      });
      test.parentElement = program;
      test.parentAttribute = "body";
      assert.throws(function () {
        program.replaceChild(test, test);
      }, /SwitchCase/);
    });
  });

  describe("#outerAST", function () {
    it("should return a valid AST", function () {
      var ast = program.outerAST();
      assert.equal(ast.type, "Program");
    });
  });

  describe("#outerCode", function () {
    it("should return code", function () {
      var code = program.outerCode();
      assert.equal(typeof code, "string");
    });
  });
});
