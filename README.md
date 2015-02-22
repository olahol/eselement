# eselement

[![npm version](https://badge.fury.io/js/eselement.svg)](http://badge.fury.io/js/eselement)
[![Build Status](https://travis-ci.org/olahol/eselement.svg)](https://travis-ci.org/olahol/eselement)
[![Coverage Status](https://img.shields.io/coveralls/olahol/eselement.svg?style=flat)](https://coveralls.io/r/olahol/eselement)
[![Dependency Status](https://david-dm.org/olahol/eselement.svg)](https://david-dm.org/olahol/eselement)
[![Download Count](https://img.shields.io/npm/dm/eselement.svg?style=flat)](https://www.npmjs.com/package/eselement)

> Manipulate Javascript as easily as you do the DOM.

## Install

```bash
$ npm install eselement --save
```

## Example

```javascript
// script.js
// Convert CommonJS modules to AMD.
var eselement = require("../lib");

var createElement = eselement.createElement
  , createLiteral = eselement.createLiteral
  , createIdentifier = eselement.createIdentifier;

eselement.makeScript(function (program) {
  var reqs = program.querySelectorAll("VariableDeclarator! [callee.name='require']");

  if (reqs.length === 0) {
    return program;
  }

  var libs = reqs.map(function (req) {
    req.remove();
    return [req.init.arguments[0].value, req.id.name];
  });

  var newRoot = createElement("define([], function () { })")
    , args = newRoot.querySelector("[callee.name='define']").arguments
    , arr = args[0]
    , fn = args[1];

  libs.forEach(function (lib) {
    arr.appendElements(createLiteral(lib[0]));
    fn.appendParams(createIdentifier(lib[1]));
  });

  fn.appendBody(program.body);

  return newRoot;
});
```

```bash
$ cat common_js_file.js
var crypto = require("crypto");
var ciphers = crypto.getCiphers();
console.log(ciphers);

$ node script.js common_js_file.js
define(['crypto'], function (crypto) {
    var ciphers = crypto.getCiphers();
    console.log(ciphers);
});
```
