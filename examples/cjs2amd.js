var fs = require("fs");

var eselement = require("../lib");

var createLiteral = function (value) {
  return eselement.createElement({
    type: "Literal"
    , value: value
  });
};

var createIdentifier = function (name) {
  return eselement.createElement({
    type: "Identifier"
    , name: name
  });
};

var content = fs.readFileSync(process.argv[2])
  , program = eselement.createElement(content);

var reqs = program.querySelectorAll("!VariableDeclarator [callee.name='require']");

if (reqs.length > 0) {
  var libs = reqs.map(function (req) {
    req.parentElement.removeChild(req);
    return [req.init.arguments[0].value, req.id.name];
  });

  var newRoot = eselement.createElement("define([], function () { })")
    , args = newRoot.querySelector("[callee.name='define']").arguments
    , arr = args[0]
    , fn = args[1];

  libs.forEach(function (lib) {
    arr.appendChild("elements", createLiteral(lib[0]));
    fn.appendChild("params", createIdentifier(lib[1]));
  });

  fn.appendChild("body", program.body);

  console.log(newRoot.outerCode());
}
