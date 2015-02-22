var eselement = require("../lib");

var createElement = eselement.createElement;

eselement.makeScript(function (program) {
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

    define.remove();

    libs.forEach(function (lib, i) {
      var el = names[i] ? createElement("var " + names[i] + " = require('" + lib + "')")
                          : createElement("require('" + lib + "')");
      program.appendBody(el);
    });

    program.appendBody(body);

    return program;
  }
});
