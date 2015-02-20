var eselement = require("../lib");

var createElement = eselement.createElement
  , createLiteral = eselement.createLiteral
  , createIdentifier = eselement.createIdentifier;

eselement.makeScript(function (program) {
  var reqs = program.querySelectorAll("[callee.name='require']");

  if (reqs.length > 0) {
    var libs = reqs.map(function (req) {
      req.parentElement.removeChild(req);
      return [req.arguments[0].value, req.parentElement.id.name];
    });

    var newRoot = createElement("define([], function () { })")
      , define = newRoot.firstChild().expression.arguments
      , arr = define[0]
      , fn = define[1];

    libs.forEach(function (lib) {
      arr.appendElements(createLiteral(lib[0]));
      fn.appendParams(createIdentifier(lib[1]));
    });

    fn.appendBody(program.body);

    return newRoot;
  }
});
