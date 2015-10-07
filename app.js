'use strict';

var languages = [
  ["Javascript", "js"   , "js"],
  ["Elm"       , null   ,     ],
  ["Meteor"    , null   ,     ],
  ["RxJS"      , "rx.js", "js"],
];

var snippet = /(.)\1{3} ([^\/\n]+) \1{4}((.*[.\n]*?)*?)\n *\1{8,}/gm

RegExp.prototype.matchAll = function(input){
  var m, ar = [];
  while((m = this.exec(input)) != null)
    ar.push(m);
  return ar;
}

function id(a) { return a; }

function prefix(pre) { return function(arg){ return [pre, arg] }; }

var O = Rx.Observable;

O.from(languages)
  .flatMap(function(lang){
    if(!lang[1])
      return O.never();
    var p = $.ajax({
      url: 'samples.'+lang[1],
      dataType: 'text',
    }).promise();
    return O.fromPromise(p)
      .flatMap(snippet.matchAll.bind(snippet))
      .map(prefix(lang));
  })
  .groupBy(
    function (match) { return match[1][2].trim() }, 
    function (match) { return [match[0],match[1][3].trim()] }
  )
  .subscribe(function (group) {
    var root = $("<pre />").appendTo($("[data-code="+group.key+"]"));
    var title = $("<div />").addClass("code").appendTo(root);
    
    $("<span />")
        .html("<u>Traditional style</u> | Rx | Elm | Meteor")
        .appendTo(title);

    group.subscribe(function(code){
      $("<code></code>")
        .appendTo(root)
        .text(code[1])
        .addClass("language-"+code[0][2]); 
      Prism.highlightAll();
    });
  });

  function CodeBox(root){
    this.root = root;
  }

  

  // .subscribe(function (group) {
  //   $("[data-code="+group.key+"]").each(function(){
  //     $(this).
  //   });

  //   // class="language-css"
  //   group.subscribe(function (c) { console.log(group.key, c) });
  // })