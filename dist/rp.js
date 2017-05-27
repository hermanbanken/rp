"use strict";
const lib_1 = require('./lib');
const codebox_1 = require('./codebox');
require('./regexp');
const Rx = require('rx');
var languages = [
    new lib_1.Language("Javascript", "js", "js"),
    new lib_1.Language("Elm", null, "hs"),
    new lib_1.Language("Meteor", "meteor.js", "js"),
    new lib_1.Language("RxJS", "rx.js", "js"),
    new lib_1.Language("Scala.React", "scala", "scala"),
];
var snippet = /(.)\1{3} ([^\/\n]+) \1{4}((.*[.\n]*?)*?)\n *\1{8,}/gm;
var O = Rx.Observable;
var a = O.from(languages)
    .flatMap((lang) => {
    if (!lang.load())
        return O.never();
    var p = $.ajax({
        url: 'samples/samples.' + lang.file,
        dataType: 'text',
    }).promise();
    return O.fromPromise(p)
        .flatMap(snippet.matchAll.bind(snippet))
        .map(lib_1.prefix(lang));
})
    .groupBy((match) => match[1][2].trim(), (match) => [match[0], match[1][3].trim()])
    .subscribe(group => {
    var box = new codebox_1.default($("[data-code=" + group.key + "]"));
    group.subscribe(box.add.bind(box));
});
O.fromEvent(window, "load", () => document.body.innerText).subscribe(text => $("<div id='wc'></div>").appendTo($("body")).text(text.match(/\S+/g).length + " " + "words"));

//# sourceMappingURL=rp.js.map
