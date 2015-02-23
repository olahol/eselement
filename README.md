# eselement

[![npm version](https://badge.fury.io/js/eselement.svg)](http://badge.fury.io/js/eselement)
[![Build Status](https://travis-ci.org/olahol/eselement.svg)](https://travis-ci.org/olahol/eselement)
[![Coverage Status](https://img.shields.io/coveralls/olahol/eselement.svg?style=flat)](https://coveralls.io/r/olahol/eselement)
[![Dependency Status](https://david-dm.org/olahol/eselement.svg)](https://david-dm.org/olahol/eselement)

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

var eselement = require("../lib");

var content = fs.readFileSync(process.argv[2])
  , program = eselement.createElement(content);

var define = program.querySelector("CallExpression[callee.name='define']");

if (define) {
  var parent = define.parentElement;

  var arr = define.arguments[0]
      , fn = define.arguments[1];

  define.isType("CallExpression");
  arr.isType("ArrayExpression");
  fn.isType("FunctionExpression");

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
