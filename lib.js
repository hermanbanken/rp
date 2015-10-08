'use strict';

function id(a) { return a; }

function prefix(pre) { return function(arg){ return [pre, arg] }; }

RegExp.prototype.matchAll = function(input){
  var m, ar = [];
  while((m = this.exec(input)) != null)
    ar.push(m);
  return ar;
}

function Language(title, file, highlight) {
  this.title = title;
  this.file = file;
  this.highlight = highlight;
}

Language.prototype.load = function () { 
  return this.file && true;
}