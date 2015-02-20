var Element = require("./core");

Element.prototype.appendParams = function (el) {
  this.isType("FunctionExpression");

  return this.appendChild("params", el);
};

Element.prototype.appendElements = function (el) {
  this.isType("ArrayExpression");

  return this.appendChild("elements", el);
};

Element.prototype.appendBody = function (el) {
  this.isType("Program", "FunctionExpression", "BlockStatement");

  return this.appendChild("body", el);
};
