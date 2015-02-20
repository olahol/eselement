var esquery = require("esquery")
  , escodegen = require("escodegen");

// AST data
var ATTR = require("./data/attr.json")
  , INHERIT = require("./data/inherit.json");

// helpers
var arrayInstanceOf = function (arr, Class) {
  return arr instanceof Array && (arr.length === 0 || arr[0] instanceof Class);
};

var forEachObject = function (obj, fn) {
  for (var key in obj) {
    if (!obj.hasOwnProperty(key)) { continue; }
    fn(key, obj[key]);
  }
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

  , "Expression => Statement": function (el) {
    return new Element(null, null, {
      type: "ExpressionStatement"
      , expression: el
    });
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

  return null;
};


// Element
var Element = module.exports = function (parentElement, parentAttribute, ast) {
  this.parentElement = parentElement;
  this.parentAttribute = parentAttribute;

  // copy ast information onto object
  forEachObject(ast, function (attr, value) {
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

// private
Element.prototype._forEachAttribute = function (fn) {
  var exclude = ["parentElement", "parentAttribute"];

  forEachObject(this, function (attr, value) {
    if (exclude.indexOf(attr) === -1) { fn(attr, value); }
  });
};

// children
Element.prototype.childElements = function () {
  var children = [];

  this._forEachAttribute(function (attr, value) {
    if (arrayInstanceOf(value, Element)) {
      children = children.concat(value);
    }

    if (value instanceof Element) {
      children.push(value);
    }
  });

  return children;
};

Element.prototype.querySelectorAll = function (selector) {
  return esquery(this, selector);
};

// validation
Element.prototype.isType = function () {
  var args = Array.prototype.slice.call(arguments, 0);

  if (args.length === 0) {
    throw Error("isType requires at least one argument");
  }

  if (args.length === 1 && args[0] !== this.type) {
    throw Error(this.type + " is not type " + args[0]);
  }

  if (args.indexOf(this.type) === -1) {
    throw Error(this.type + " is not one of type " + args.join(","));
  }
};

// manipulation
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

    if (child === null) {
      throw new Error(type + " is not a valid type for " + this.type + "." + attr);
    }
  }

  child.parentElement = this;
  child.parentAttribute = attr;

  var tree = this[attr];

  if (tree === null) {
    this[attr] = child;
    return child;
  }

  if (arrayInstanceOf(tree, Element)) {
    tree.push(child);
    return child;
  }

  if (tree.type === "BlockStatement") {
    tree.body.push(child);
    return child;
  }

  if (validateType("BlockStatement", validTypes) && tree !== null) {
    this[attr] = new Element(this, attr, { type: "BlockStatement", body: [tree, child] });
    return child;
  }

  throw new Error("could not append child of type " + type + " to " + this.type + "." + attr);
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

    if (newChild === null) {
      throw new Error(type + " is not a valid type for " + this.type + "." + attr);
    }
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

// transformation
Element.prototype.outerAST = function () {
  var element = {};

  this._forEachAttribute(function (attr, value) {
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
  });

  return element;
};

Element.prototype.outerCode = function (opts) {
  return escodegen.generate(this.outerAST(), opts);
};