var eselement = require("../lib");

var createElement = eselement.createElement;

eselement.makeScript(function (program) {
  var define = program.querySelector("[expression.callee.name='define']");

  if (define) {
    var parent = define.parentElement;

    var arr = define.expression.arguments[0]
        , fn = define.expression.arguments[1];

    define.isType("ExpressionStatement");
    arr.isType("ArrayExpression");
    fn.isType("FunctionExpression");

    var libs = arr.elements.map(function (e) { return e.value })
      , names = fn.params.map(function (p) { return p.name; })
      , body = fn.body.body;

    parent.removeChild(define);

    libs.forEach(function (lib, i) {
      var el = names[i] ? createElement("var " + names[i] + " = require('" + lib + "')")
                          : createElement("require('" + lib + "')");
      parent.appendBody(el);
    });

    parent.appendBody(body);

    return program;
  }
});
