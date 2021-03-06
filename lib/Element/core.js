var esquery = require("esquery")
  , recast = require("recast");

// AST data
var ATTR = require("./data/attr.json")
  , INHERIT = require("./data/inherit.json");

// helpers
var arrayInstanceOf = function (arr, Class) {
  return arr instanceof Array && (arr.length === 0 || arr[0] instanceof Class);
};

// validate
var validateType = function (type, validTypes) {
  var elTypes = INHERIT[type];

  for (var i = 0; i < elTypes.length; i += 1) {
    if (validTypes.indexOf(elTypes[i]) !== -1) {
      return true;
    }
  }

  return false;
};

// conversions
var conversionTable = {
  "Program => Statement": function (el) {
    return el.body;
  }

  , "Program => Expression": function (el) {
    var first = el.body[0];

    if (first && first.type === "ExpressionStatement") {
      return first.expression;
    }

    return el;
  }

  , "Expression => Statement": function (el) {
    return new Element(null, null, {
      type: "ExpressionStatement"
      , expression: el
    });
  }

  , "ExpressionStatement => Expression": function (el) {
    return el.expression;
  }
};

var convert = function (el, validTypes) {
  var elTypes = INHERIT[el.type];

  var comb = "";
  for (var i = 0; i < elTypes.length; i += 1) {
    for (var j = 0; j < validTypes.length; j += 1) {
      comb = elTypes[i] + " => " + validTypes[j];
      if (conversionTable[comb]) {
        return conversionTable[comb](el);
      }
    }
  }

  return el;
};


// Element
var Element = module.exports = function (parentElement, parentAttribute, ast) {
  this.parentElement = parentElement;
  this.parentAttribute = parentAttribute;
  this.recastPrelude = null;

  if (ast.type === "File") {
    ast = ast.program;
    this.recastPrelude = {
      type: "File"
      , loc: ast.loc
      , comments: ast.comments
    };
  }

  // copy ast information onto object
  Object.keys(ast).forEach(function (attr) {
    var value = ast[attr];

    if (typeof value === "object") {
      if (value instanceof Array) {
        if (value.length === 0) {
          this[attr] = [];
          return;
        }

        this[attr] = value.map(function (v) {
          if (v instanceof Element) {
            v.parentElement = this;
            v.parentAttribute = attr;
            return v;
          }
          return new Element(this, attr, v);
        }.bind(this));
        return;
      }

      if (value instanceof Element) {
        value.parentElement = this;
        value.parentAttribute = attr;
        this[attr] = value;
        return;
      }

      if (value && value.type) {
        this[attr] = new Element(this, attr, value);
        return;
      }

      this[attr] = value;
      return;
    }

    this[attr] = value;
  }.bind(this));
};

// children
Element.prototype.childElements = function () {
  var children = [];

  Object.keys(ATTR[this.type]).forEach(function (attr) {
    var value = this[attr];
    if (arrayInstanceOf(value, Element)) {
      children = children.concat(value);
    }

    if (value instanceof Element) {
      children.push(value);
    }
  }.bind(this));

  return children;
};

Element.prototype.firstChild = function () {
  return this.childElements()[0];
};

Element.prototype.lastChild = function () {
  var children = this.childElements();
  return children[children.length - 1];
};

Element.prototype.querySelectorAll = function (selector) {
  return esquery(this, selector);
};

Element.prototype.querySelector = function (selector) {
  return this.querySelectorAll(selector)[0];
};

// manipulation
Element.prototype.setAttribute = function (attr, value) {
  var validTypes = ATTR[this.type][attr];

  if (!validTypes) {
    throw new Error(attr + " is not a valid attribute of " + this.type);
  }

  if (value instanceof Element) {
    if (!validateType(value.type, validTypes)) {
      value = convert(value, validTypes);
    }

    if (!validateType(value.type, validTypes)) {
      throw new Error(value.type + " is not a valid type for " + this.type + "." + attr);
    }

    value.parentElement = this;
    value.parentAttribute = attr;

    this[attr] = value;

    return ;
  }

  if (validTypes.indexOf(value) === -1 && validTypes.indexOf(typeof value) === -1) {
    throw new Error(value + " is not a valid value of attribute " + attr);
  }

  this[attr] = value;
};

Element.prototype.appendChild = function (attr, child) {
  if (arrayInstanceOf(child, Element)) {
    return child.map(this.appendChild.bind(this, attr));
  }

  var type = child.type;

  var validTypes = ATTR[this.type][attr];

  if (!validTypes) {
    throw new Error(attr + " is not a valid attribute of " + this.type);
  }

  if (validTypes[0] instanceof Array) {
    validTypes = validTypes[0];
  }

  if (!validateType(type, validTypes)) {
    child = convert(child, validTypes);

    if (child instanceof Array) {
      return child.map(this.appendChild.bind(this, attr));
    }
  }

  child.parentElement = this;
  child.parentAttribute = attr;

  var tree = this[attr];

  if (tree && tree.type === "BlockStatement") {
    tree.appendChild("body", child);
    return child;
  }

  if (tree && !(tree instanceof Array) && validateType("BlockStatement", validTypes)) {
    this[attr] = new Element(this, attr, { type: "BlockStatement", body: [tree, child] });
    return child;
  }

  if (!validateType(child.type, validTypes)) {
    throw new Error(child.type + " is not a valid type for " + this.type + "." + attr);
  }

  if (arrayInstanceOf(tree, Element)) {
    tree.push(child);
    return child;
  }

  if (tree === null) {
    this[attr] = child;
    return child;
  }

  throw new Error("could not append child of type " + type + " to " + this.type + "." + attr + " " + tree.type );
};

Element.prototype.removeChild = function (child) {
  var attr = child.parentAttribute
    , tree = this[attr];

  if (child.parentElement !== this) {
    throw new Error("parent of child is not this element");
  }

  var validTypes = ATTR[this.type][attr];

  if (arrayInstanceOf(tree, Element)) {
    for (var i = 0; i < tree.length; i += 1) {
      if (tree[i] === child) {
        tree.splice(i, 1);

        if (tree.length === 0 && validTypes[0].indexOf("null") === -1) {
          this.parentElement.removeChild(this);
        }

        return child;
      }
    }
  }

  if (tree instanceof Element && tree === child) {
    if (validTypes.indexOf("null") !== -1) {
      this[attr] = null;
      return child;
    }

    if (validTypes.indexOf("Statement") !== -1) {
      this[attr] = new Element(this, attr, { type: "EmptyStatement" });
      return child;
    }

    this.parentElement.removeChild(this);
    return child;
  }

  throw new Error("child was not found in children of this element");
};

Element.prototype.replaceChild = function (newChild, oldChild) {
  var parent = oldChild.parentElement
    , attr = oldChild.parentAttribute
    , tree = this[attr];

  var type = newChild.type;

  if (parent !== this) {
    throw new Error("parent of child is not this element");
  }

  var validTypes = ATTR[this.type][attr];

  if (!validTypes) {
    throw new Error(attr + " is not a valid attribute of " + this.type);
  }

  if (validTypes[0] instanceof Array) {
    validTypes = validTypes[0];
  }

  if (!validateType(type, validTypes)) {
    newChild = convert(newChild, validTypes);

    if (newChild instanceof Array) {
      newChild = newChild[0];
    }
  }

  if (!validateType(newChild.type, validTypes)) {
    throw new Error(newChild.type + " is not a valid type for " + this.type + "." + attr);
  }

  newChild.parentElement = this;
  newChild.parentAttribute = attr;

  if (arrayInstanceOf(tree, Element)) {
    for (var i = 0; i < tree.length; i += 1) {
      if (tree[i] === oldChild) {
        tree[i] = newChild;
        return oldChild;
      }
    }
  }

  if (tree instanceof Element && tree === oldChild) {
    this[oldChild.parentAttribute] = newChild;
    return oldChild;
  }

  throw new Error("old child was not found in children of element");
};

Element.prototype.cloneElement = function () {
  return new Element(null, null, this.outerAST());
};

// transformation
Element.prototype.outerAST = function () {
  var element = {};

  element.type = this.type;
  element.loc = this.loc;
  element.comments = this.comments;

  Object.keys(ATTR[this.type]).forEach(function (attr) {
    var value = this[attr];

    if (arrayInstanceOf(value, Element)) {
      element[attr] = value.map(function (v) {
        return v.outerAST();
      });
      return;
    }

    if (value instanceof Element) {
      element[attr] = value.outerAST();
      return;
    }

    element[attr] = value;
  }.bind(this));

  if (this.recastPrelude !== null && this.parentElement === null) {
    this.recastPrelude.program = element;
    return this.recastPrelude.program;
  }

  return element;
};

Element.prototype.outerCode = function (opts) {
  return recast.print(this.outerAST(), opts).code;
};
