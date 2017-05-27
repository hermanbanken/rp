RegExp.prototype.matchAll = function (input) {
    var m, ar = [];
    while ((m = this.exec(input)) != null)
        ar.push(m);
    return ar;
};

//# sourceMappingURL=regexp.js.map
