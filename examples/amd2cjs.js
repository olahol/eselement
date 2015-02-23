var fs = require("fs");

var eselement = require("../lib");

var content = fs.readFileSync(process.argv[2])
  , program = eselement.createElement(content);

var define = program.querySelector("CallExpression[callee.name='define']");

if (define) {
  var parent = define.parentElement;

  var arr = define.arguments[0]
      , fn = define.arguments[1];

  define.isType("CallExpression");
  arr.isType("ArrayExpression");
  fn.isType("FunctionExpression");

  var libs = arr.elements.map(function (e) { return e.value })
    , names = fn.params.map(function (p) { return p.name; })
    , body = fn.body.body;

  define.parentElement.removeChild(define);

  libs.forEach(function (lib, i) {
    var el = names[i] ? eselement.createElement("var " + names[i] + " = require('" + lib + "')")
                        : eselement.createElement("require('" + lib + "')");
    program.appendChild("body", el);
  });

  program.appendChild("body", body);

  console.log(program.outerCode());
}
