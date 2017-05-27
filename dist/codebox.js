"use strict";
const Rx = require('rx');
var Prism = window["Prism"];
function CodeBox(root) {
    this.root = root;
    var pre = this.pre = $("<pre />").appendTo(root);
    var title = $("<div>").addClass("code flex").appendTo(pre);
    var codebox = $("<div>").addClass("flex").appendTo(pre);
    var box = this;
    var langs = Rx.Observable.create(observer => {
        box.add = (code) => observer.onNext(code);
    }).share();
    langs
        .scan((acc, code) => {
        var $button = $("<span>").text(code[0].title);
        var $block = box._block(code);
        $button.on("click", () => $block.removeClass("hidden").siblings("code").addClass("hidden"));
        acc.titles.push($button);
        acc.blocks.push($block);
        return acc;
    }, { titles: [], blocks: [] })
        .subscribe(parts => {
        parts.titles.forEach(t => t.detach());
        title.append(parts.titles);
        parts.blocks.forEach(b => b.detach());
        codebox.append(parts.blocks);
        if (Prism)
            Prism.highlightAll();
        else
            console.log("Prism not defined...", Prism, window["Prism"]);
    });
}
CodeBox.prototype._block = function (code) {
    var block = $("<code></code>")
        .text(code[1])
        .addClass("language-" + code[0].highlight);
    return block;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CodeBox;

//# sourceMappingURL=codebox.js.map
