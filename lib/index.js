var fs = require("fs")
  , esprima = require("esprima");

var Element = require("./Element");

exports.createElement = function (content, opts) {
  if (typeof content === "object" && !(content instanceof Buffer)) {
    return new Element(null, null, content);
  }

  var ast = esprima.parse(content, opts);
  return new Element(null, null, ast);
};

exports.createLiteral = function (value) {
  return new Element(null, null, {
    type: "Literal"
    , value: value
  });
};

exports.createIdentifier = function (ident) {
  return new Element(null, null, {
    type: "Identifier"
    , name: ident
  });
};

exports.runScript = function (content, fn, write) {
  if (typeof write === "undefined") { write = true; }
  if (content === "") { return ""; }

  var program = exports.createElement(content)
    , output = fn(program);

  /* istanbul ignore else */
  if (output) {
    var newContent = output.outerCode();
    if (write) { process.stdout.write(newContent); }
    return newContent;
  }
};

/* istanbul ignore next */
exports.makeScript = function (fn) {
  var filename = process.argv[2];

  if (filename) {
    return exports.runScript(fs.readFileSync(filename), fn);
  }

  process.stdin.setEncoding("utf8");

  var content = "";
  process.stdin.on("readable", function () {
    var chunk = process.stdin.read();
    if (chunk) {
      content += chunk;
    }
  });

  process.stdin.on("end", function () {
    exports.runScript(content, fn);
  });
};
