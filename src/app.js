import { id, prefix, Language } from 'lib';
import CodeBox from 'codebox';
import Rx from 'rxjs';

var languages = [
  new Language("Javascript", "js"   , "js"),
  new Language("Elm"       , null   , "hs"),
  new Language("Meteor"    , "meteor.js", "js"),
  new Language("RxJS"      , "rx.js", "js"),
  new Language("Scala.React", "scala", "scala"),
];

var snippet = /(.)\1{3} ([^\/\n]+) \1{4}((.*[.\n]*?)*?)\n *\1{8,}/gm

var O = Rx.Observable;

O.from(languages)
  .flatMap(lang => {
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
    match => match[1][2].trim(), 
    match => [match[0],match[1][3].trim()]
  )
  .subscribe(group => {
    var box = new CodeBox($("[data-code="+group.key+"]"));
    group.subscribe(box.add.bind(box));
  });

O.timer(1000).map(_ => {
  var p = $.ajax({
      url: window.location,
    }).promise();
  return O.fromPromise(p);
})
.switch()
.subscribe(html => $("body").replaceWith($(html).find("body")));