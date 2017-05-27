"use strict";
function id(a) { return a; }
exports.id = id;
function prefix(pre) { return function (arg) { return [pre, arg]; }; }
exports.prefix = prefix;
class Language {
    constructor(title, file, highlight) {
        this.title = title;
        this.file = file;
        this.highlight = highlight;
    }
    load() {
        return this.file && true;
    }
}
exports.Language = Language;

//# sourceMappingURL=lib.js.map
