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
