import { id, prefix, Language } from './lib';
import CodeBox from './codebox';
import './regexp';
import PrismStatic from './prism';
import * as Rx from 'rx';
import * as jQuery from 'jquery';

declare var $: JQueryStatic;

var languages: Language[] = [
  new Language("Javascript", "js"   , "js"),
  new Language("Elm"       , null   , "hs"),
  new Language("Meteor"    , "meteor.js", "js"),
  new Language("RxJS"      , "rx.js", "js"),
  new Language("Scala.React", "scala", "scala"),
];

var snippet = /(.)\1{3} ([^\/\n]+) \1{4}((.*[.\n]*?)*?)\n *\1{8,}/gm

var O = Rx.Observable;

var a = O.from(languages)
  .flatMap((lang: Language) => {
    if(!lang.load())
      return O.never();
    var p = $.ajax({
      url: 'samples/samples.'+lang.file,
      dataType: 'text',
    }).promise();
    return O.fromPromise(p)
      .flatMap(snippet.matchAll.bind(snippet))
      .map(prefix(lang));
  })
  .groupBy(
    (match: [Language,any[]]) => match[1][2].trim(), 
    (match: [Language,any[]]) => [match[0],match[1][3].trim()]
  )
	.subscribe(group => {
    var box = new CodeBox($("[data-code="+group.key+"]"));
    group.subscribe(box.add.bind(box));
  });
	
O.fromEvent(window, "load", () => document.body.innerText).subscribe(text => 
	$("<div id='wc'></div>").appendTo($("body")).text(text.match(/\S+/g).length + " " + "words")
);

// O.timer(2000, 2000).map((_:any) => {
//   var p = $.ajax({
//       url: window.location.toString(),
//     }).promise();
//   return O.fromPromise(p);
// })
// .switch()
// .subscribe((html: string) => {
// 	var content = $("<div>").append($.parseHTML(html)).filter(":not(link,style,script)");//.find("body");
// 	$("body").html(content.html());
// });