# eselement

[![npm version](https://badge.fury.io/js/eselement.svg)](http://badge.fury.io/js/eselement)
[![Build Status](https://travis-ci.org/olahol/eselement.svg)](https://travis-ci.org/olahol/eselement)
[![Coverage Status](https://img.shields.io/coveralls/olahol/eselement.svg?style=flat)](https://coveralls.io/r/olahol/eselement)
[![Dependency Status](https://david-dm.org/olahol/eselement.svg)](https://david-dm.org/olahol/eselement)
[![License](http://img.shields.io/badge/license-MIT-brightgreen.svg)]()

> DOM-like wrapper around the Javascript AST

## Install

```bash
$ npm install eselement --save
```

## Example

```javascript
// amd2cjs.js
// convert AMD modules to CommonJS.
var fs = require("fs");

var eselement = require("eselement");

var content = fs.readFileSync(process.argv[2])
  , program = eselement.createElement(content);

var define = program.querySelector("CallExpression[callee.name='define']");

if (define) {
  var arr = define.arguments[0]
      , fn = define.arguments[1];

  var libs = arr.elements.map(function (e) { return e.value })
    , names = fn.params.map(function (p) { return p.name; })
    , body = fn.body.body;

  define.parentElement.removeChild(define);

  libs.forEach(function (lib, i) {
    var el = names[i] ? eselement.createElement("var " + names[i] + " = require('" + lib + "')")
                        : eselement.createElement("require('" + lib + "')");
    program.appendChild("body", el);
  });

  program.appendChild("body", body);

  console.log(program.outerCode());
}
```

```bash
$ cat amd_module.js
define(["crypto"], function (crypto) {
  var ciphers = crypto.getCiphers();
  console.log(ciphers);
});

$ node amd2cjs.js amd_module.js
var crypto = require('crypto');
var ciphers = crypto.getCiphers();
console.log(ciphers);
```

## API

### createElement(string || object)

Creates and element from either Javascript code or Mozilla Parser AST.

## Element

### Attributes

All attributes from the AST are copied onto the Element, for example
an element of type `Program` will have an attribute `body`.

#### Element.parentElement

A reference to the Elements parent, if it has no parent it's `null`.

#### Element.parentAttribute

A string denoting the attribute on the parent in which this element is in.

### Methods

#### Element.childElements()

Get all children of an element.

#### Element.firstChild()

Get the first child of an element.

#### Element.lastChild()

Get the last child of an element.

#### Element.querySelectorAll(selector)

Select elements using esquery.

#### Element.querySelector(selector)

Select the first matching element using esquery.

#### Element.appendChild(attribute, child)

Append `child` to element attribute `attribute`.

#### Element.removeChild(child)

Remove `child` from element.

#### Element.replaceChild(newChild, oldChild)

Replace `oldChild` with `newChild` in element.

#### Element.outerAST()

Return the AST for element.

#### Element.outerCode()

Return the javascript code for element.
