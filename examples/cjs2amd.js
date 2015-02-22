var eselement = require("../lib");

var createElement = eselement.createElement
  , createLiteral = eselement.createLiteral
  , createIdentifier = eselement.createIdentifier;

eselement.makeScript(function (program) {
  var reqs = program.querySelectorAll("VariableDeclarator! [callee.name='require']");

  if (reqs.length === 0) {
    return program;
  }

  var libs = reqs.map(function (req) {
    req.remove();
    return [req.init.arguments[0].value, req.id.name];
  });

  var newRoot = createElement("define([], function () { })")
    , args = newRoot.querySelector("[callee.name='define']").arguments
    , arr = args[0]
    , fn = args[1];

  libs.forEach(function (lib) {
    arr.appendElements(createLiteral(lib[0]));
    fn.appendParams(createIdentifier(lib[1]));
  });

  fn.appendBody(program.body);

  return newRoot;
});
