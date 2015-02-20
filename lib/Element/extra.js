var Element = require("./core");

Element.prototype.querySelector = function (selector) {
  return this.querySelectorAll(selector)[0];
};

Element.prototype.firstChild = function () {
  return this.childElements()[0];
};

Element.prototype.lastChild = function () {
  return this.childElements().pop();
};

Element.prototype.remove = function () {
  if (this.type === "Program") {
    this.body = [];
    return this;
  }

  return this.parentElement.removeChild(this);
};
