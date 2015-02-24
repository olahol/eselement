var fs = require("fs")
  , recast = require("recast");

var Element = require("./Element");

exports.createElement = function (content, opts) {
  if (typeof content === "object" && !(content instanceof Buffer)) {
    return new Element(null, null, content);
  }

  var ast = recast.parse(content, opts);
  return new Element(null, null, ast);
};
