var inputs = ["intro.md"]
var h = snabbdom.h;
var patch = snabbdom.init([
  snabbdom_class, snabbdom_props, snabbdom_style, snabbdom_eventlisteners
]);

function matchAll(re, text) {
  re.global = true;
  var m, matches = [];
  do {
      m = re.exec(text);
      if (m) {
        matches.push(m)
      }
  } while (m);
  return matches
}

showdown.extension('rx_graphs', {
  type: "lang",
  filter: function(text, converter, options){
    matchAll(/\[graph #([^\]]+)\]/g, text).reverse().forEach(match => {
      text = text.substring(0, match.index) + "<svg id='" + match[1] + "' style='width: 100%' width=400></svg>" + text.substring(match.index + match[0].length)
    })
    return text
  }
});

Rx.Observable.from(inputs)
  .flatMap(file => ajax(file)
    .map(mdc)
    .map(data => ({ file: file, data: data }))
  )
  .map(o => o.data)
  .toArray()
  .subscribe(dom => {
    document.querySelector("#app").innerHTML = dom.join()
    hljs.initHighlighting();
    $(window).trigger("resize");
  });

var mdcOptions = {
    'omitExtraWLInCodeBlocks': true,
    'noHeaderId': false,
    'parseImgDimensions': true,
    'simplifiedAutoLink': true,
    'literalMidWordUnderscores': true,
    'strikethrough': true,
    'tables': true,
    'tablesHeaderId': false,
    'ghCodeBlocks': true,
    'tasklists': true,
    'smoothLivePreview': true,
    'prefixHeaderId': false,
    'disableForced4SpacesIndentedSublists': false,
    'ghCompatibleHeaderId': true,
    'smartIndentationFix': false,
    'headerLevelStart': 3,
    'extensions': ['rx_graphs']
  };

function f(vn, path) {
  if(typeof vn === 'object' && !vn.sel) { console.log(path, vn); };
  vn.children && vn.children.map((c, i) => f(c, path.concat([vn.sel, i])))
}

function fix(vn) {
  if(typeof vn === "object" && typeof vn.sel === "undefined" && vn.text) {
    return Object.assign(vn, { sel: "span", data: {} })
  } else {
    return Object.assign(vn, { children: vn.children && vn.children.map(fix) })
  }
}

function mdc(md) {
  var converter = new showdown.Converter(mdcOptions);
  return converter.makeHtml(md);
}

function ajax(url) {
  return Rx.Observable.create(observer => {
    var xhr = new XMLHttpRequest();
    xhr.open('get', url, true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4) {
        if (xhr.status == 200) {
          observer.onNext(xhr.responseText);
          observer.onCompleted();
        } else {
          observer.onError(xhr.status);
        }
      }
    };
    xhr.send();
  })
}
