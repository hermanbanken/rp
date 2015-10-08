'use strict';

function CodeBox(root){
  this.root = root;
  
  var pre = this.pre = $("<pre />").appendTo(root);
  var title = $("<div>").addClass("code flex").appendTo(pre);
  var codebox = $("<div>").addClass("flex").appendTo(pre);

  var box = this;
  var langs = Rx.Observable.create(observer => {
    box.add = (code) => observer.onNext(code)
  }).share();

  langs
    .scan((acc, code) => {
      var $button = $("<span>").text(code[0].title);
      var $block = box._block(code);

      $button.on("click", () => 
        $block.removeClass("hidden").siblings("code").addClass("hidden")
      );

      acc.titles.push($button);
      acc.blocks.push($block);
      return acc;
    }, { titles: [], blocks: [] })
    .subscribe(parts => {
      parts.titles.forEach(t => t.detach());
      title.append(parts.titles);
      
      parts.blocks.forEach(b => b.detach());
      codebox.append(parts.blocks);

      Prism.highlightAll();
    });
}

CodeBox.prototype._block = function (code) {
  var block = $("<code></code>")
    .text(code[1])
    .addClass("language-"+code[0].highlight);
  return block;
}

var languages = [
  new Language("Javascript", "js"   , "js"),
  new Language("Elm"       , null   , "hs"),
  new Language("Meteor"    , null   , "js"),
  new Language("RxJS"      , "rx.js", "js")
];

var snippet = /(.)\1{3} ([^\/\n]+) \1{4}((.*[.\n]*?)*?)\n *\1{8,}/gm

var O = Rx.Observable;

O.from(languages)
  .flatMap(function(lang){
    if(!lang.load())
      return O.never();
    var p = $.ajax({
      url: 'samples.'+lang.file,
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
    var box = new CodeBox($("[data-code="+group.key+"]"));
    group.subscribe(box.add.bind(box));
  });