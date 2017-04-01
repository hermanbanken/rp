(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.snabbdomVirtualize = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var attrRE = /([\w-]+)|(['"])(.*?)\2/g;

// create optimized lookup object for
// void elements as listed here:
// http://www.w3.org/html/wg/drafts/html/master/syntax.html#void-elements
var lookup = (Object.create) ? Object.create(null) : {};
lookup.area = true;
lookup.base = true;
lookup.br = true;
lookup.col = true;
lookup.embed = true;
lookup.hr = true;
lookup.img = true;
lookup.input = true;
lookup.keygen = true;
lookup.link = true;
lookup.menuitem = true;
lookup.meta = true;
lookup.param = true;
lookup.source = true;
lookup.track = true;
lookup.wbr = true;

module.exports = function (tag) {
    var i = 0;
    var key;
    var res = {
        type: 'tag',
        name: '',
        voidElement: false,
        attrs: {},
        children: []
    };

    tag.replace(attrRE, function (match) {
        if (i % 2) {
            key = match;
        } else {
            if (i === 0) {
                if (lookup[match] || tag.charAt(tag.length - 2) === '/') {
                    res.voidElement = true;
                }
                res.name = match;
            } else {
                res.attrs[key] = match.replace(/^['"]|['"]$/g, '');
            }
        }
        i++;
    });

    return res;
};

},{}],2:[function(require,module,exports){
/*jshint -W030 */
var tagRE = /(?:<!--[\S\s]*?-->|<(?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])+>)/g;
var parseTag = require('./parse-tag');
// re-used obj for quick lookups of components
var empty = Object.create ? Object.create(null) : {};
// common logic for pushing a child node onto a list
function pushTextNode(list, html, start) {
    // calculate correct end of the content slice in case there's
    // no tag after the text node.
    var end = html.indexOf('<', start);
    var content = html.slice(start, end === -1 ? undefined : end);
    // if a node is nothing but whitespace, no need to add it.
    if (!/^\s*$/.test(content)) {
        list.push({
            type: 'text',
            content: content
        });
    }
}

module.exports = function parse(html, options) {
    options || (options = {});
    options.components || (options.components = empty);
    var result = [];
    var current;
    var level = -1;
    var arr = [];
    var byTag = {};
    var inComponent = false;

    html.replace(tagRE, function (tag, index) {
        if (inComponent) {
            if (tag !== ('</' + current.name + '>')) {
                return;
            } else {
                inComponent = false;
            }
        }

        var isOpen = tag.charAt(1) !== '/';
        var isComment = tag.indexOf('<!--') === 0;
        var start = index + tag.length;
        var nextChar = html.charAt(start);
        var parent;

        if (isOpen && !isComment) {
            level++;

            current = parseTag(tag);
            if (current.type === 'tag' && options.components[current.name]) {
                current.type = 'component';
                inComponent = true;
            }

            if (!current.voidElement && !inComponent && nextChar && nextChar !== '<') {
                pushTextNode(current.children, html, start);
            }

            byTag[current.tagName] = current;

            // if we're at root, push new base node
            if (level === 0) {
                result.push(current);
            }

            parent = arr[level - 1];

            if (parent) {
                parent.children.push(current);
            }

            arr[level] = current;
        }

        if (isComment || !isOpen || current.voidElement) {
            if (!isComment) {
                level--;
            }
            if (!inComponent && nextChar !== '<' && nextChar) {
                // trailing text node
                // if we're at the root, push a base text node. otherwise add as
                // a child to the current node.
                parent = level === -1 ? result : arr[level].children;
                pushTextNode(parent, html, start);
            }
        }
    });

    return result;
};

},{"./parse-tag":1}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
// List from https://html.spec.whatwg.org/multipage/webappapis.html#globaleventhandlers.
exports.default = ['onabort', 'onautocomplete', 'onautocompleteerror', 'onblur', 'oncancel', 'oncanplay', 'oncanplaythrough', 'onchange', 'onclick', 'onclose', 'oncontextmenu', 'oncuechange', 'ondblclick', 'ondrag', 'ondragend', 'ondragenter', 'ondragexit', 'ondragleave', 'ondragover', 'ondragstart', 'ondrop', 'ondurationchange', 'onemptied', 'onended', 'onerror', 'onfocus', 'oninput', 'oninvalid', 'onkeydown', 'onkeypress', 'onkeyup', 'onload', 'onloadeddata', 'onloadedmetadata', 'onloadstart', 'onmousedown', 'onmouseenter', 'onmouseleave', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'onwheel', 'onpause', 'onplay', 'onplaying', 'onprogress', 'onratechange', 'onreset', 'onresize', 'onscroll', 'onseeked', 'onseeking', 'onselect', 'onshow', 'onstalled', 'onsubmit', 'onsuspend', 'ontimeupdate', 'ontoggle', 'onvolumechange', 'onwaiting'];
},{}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.virtualizeString = exports.virtualizeNode = undefined;

exports.default = function (el, options) {
    if (typeof el === 'string') {
        return (0, _strings2.default)(el, options);
    } else {
        return (0, _nodes2.default)(el, options);
    }
};

var _nodes = require('./nodes');

var _nodes2 = _interopRequireDefault(_nodes);

var _strings = require('./strings');

var _strings2 = _interopRequireDefault(_strings);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.virtualizeNode = _nodes2.default;
exports.virtualizeString = _strings2.default;
},{"./nodes":5,"./strings":6}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = virtualizeNodes;

var _h = require('snabbdom/h');

var _h2 = _interopRequireDefault(_h);

var _utils = require('./utils');

var _eventListeners = require('./event-listeners');

var _eventListeners2 = _interopRequireDefault(_eventListeners);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function virtualizeNodes(element) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];


    var context = options.context || document;

    if (!element) {
        return null;
    }

    var createdVNodes = [];
    var vnode = convertNode(element, createdVNodes, context);
    options.hooks && options.hooks.create && createdVNodes.forEach(function (node) {
        options.hooks.create(node);
    });
    return vnode;
}

function convertNode(element, createdVNodes, context) {
    // If our node is a text node, then we only want to set the `text` part of
    // the VNode.
    if (element.nodeType === context.defaultView.Node.TEXT_NODE) {
        var _newNode = (0, _utils.createTextVNode)(element.textContent, context);
        _newNode.elm = element;
        createdVNodes.push(_newNode);
        return _newNode;
    }

    // If not a text node, then build up a VNode based on the element's tag
    // name, class and style attributes, and remaining attributes.

    // Special values: style, class. We don't include these in the attrs hash
    // of the VNode.
    var data = {};
    var classes = getClasses(element);
    if (Object.keys(classes).length !== 0) {
        data.class = classes;
    }
    var style = getStyle(element);
    if (Object.keys(style).length !== 0) {
        data.style = style;
    }

    // Build up set of attributes on the element.
    var attributes = element.attributes;
    for (var _i = 0; _i < attributes.length; _i++) {
        var attr = attributes.item(_i);
        var name = attr.name;
        if (name !== 'style' && name !== 'class') {
            if (!data.attrs) {
                data.attrs = {};
            }
            data.attrs[name] = attr.value;
        }
    }

    // Check for event listeners.
    var on = {};
    _eventListeners2.default.forEach(function (key) {
        if (element[key]) {
            on[key.substring(2)] = element[key];
        }
    });
    if (Object.keys(on).length > 0) {
        data.on = on;
    }

    // Build up set of children.
    var childNodes = null;
    var children = element.childNodes;
    if (children.length > 0) {
        childNodes = [];
        for (var i = 0; i < children.length; i++) {
            childNodes.push(convertNode(children.item(i), createdVNodes, context));
        }
    }
    var newNode = (0, _h2.default)(element.tagName.toLowerCase(), data, childNodes);
    newNode.elm = element;
    createdVNodes.push(newNode);
    return newNode;
}

// Builds the class object for the VNode.
function getClasses(element) {
    var className = element.className;
    var classes = {};
    if (className !== null && className.length > 0) {
        className.split(' ').forEach(function (className) {
            classes[className] = true;
        });
    }
    return classes;
}

// Builds the style object for the VNode.
function getStyle(element) {
    var style = element.style;
    var styles = {};
    for (var i = 0; i < style.length; i++) {
        var name = style.item(i);
        var transformedName = (0, _utils.transformName)(name);
        styles[transformedName] = style.getPropertyValue(name);
    }
    return styles;
}
},{"./event-listeners":3,"./utils":7,"snabbdom/h":8}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

exports.default = function (html) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];


    var context = options.context || document;

    // If there's nothing here, return null;
    if (!html) {
        return null;
    }

    // Maintain a list of created vnodes so we can call the create hook.
    var createdVNodes = [];

    // Parse the string into the AST and convert to VNodes.
    var vnodes = convertNodes((0, _parse2.default)(html), createdVNodes, context);

    var res = void 0;
    if (!vnodes) {
        // If there are no vnodes but there is string content, then the string
        // must be just text or at least invalid HTML that we should treat as
        // text (since the AST parser didn't find any well-formed HTML).
        res = toVNode({ type: 'text', content: html }, createdVNodes, context);
    } else if (vnodes.length === 1) {
        // If there's only one root node, just return it as opposed to an array.
        res = vnodes[0];
    } else {
        // Otherwise we have an array of VNodes, which we should return.
        res = vnodes;
    }

    // Call the 'create' hook for each created node.
    options.hooks && options.hooks.create && createdVNodes.forEach(function (node) {
        options.hooks.create(node);
    });
    return res;
};

var _parse = require('html-parse-stringify2/lib/parse');

var _parse2 = _interopRequireDefault(_parse);

var _h = require('snabbdom/h');

var _h2 = _interopRequireDefault(_h);

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function convertNodes(nodes, createdVNodes, context) {
    if (nodes instanceof Array && nodes.length > 0) {
        return nodes.map(function (node) {
            return toVNode(node, createdVNodes, context);
        });
    } else {
        return undefined;
    }
}

function toVNode(node, createdVNodes, context) {
    var newNode = void 0;
    if (node.type === 'text') {
        newNode = (0, _utils.createTextVNode)(node.content, context);
    } else {
        newNode = (0, _h2.default)(node.name, buildVNodeData(node, context), convertNodes(node.children, createdVNodes, context));
    }
    createdVNodes.push(newNode);
    return newNode;
}

function buildVNodeData(node, context) {
    var data = {};
    if (!node.attrs) {
        return data;
    }

    var attrs = Object.keys(node.attrs).reduce(function (memo, name) {
        if (name !== 'style' && name !== 'class') {
            var val = (0, _utils.unescapeEntities)(node.attrs[name], context);
            memo ? memo[name] = val : memo = _defineProperty({}, name, val);
        }
        return memo;
    }, null);
    if (attrs) {
        data.attrs = attrs;
    }

    var style = parseStyle(node);
    if (style) {
        data.style = style;
    }

    var classes = parseClass(node);
    if (classes) {
        data.class = classes;
    }

    return data;
}

function parseStyle(node) {
    try {
        return node.attrs.style.split(';').reduce(function (memo, styleProp) {
            var res = styleProp.split(':');
            var name = (0, _utils.transformName)(res[0].trim());
            if (name) {
                var val = res[1].replace('!important', '').trim();
                memo ? memo[name] = val : memo = _defineProperty({}, name, val);
            }
            return memo;
        }, null);
    } catch (e) {
        return null;
    }
}

function parseClass(node) {
    try {
        return node.attrs.class.split(' ').reduce(function (memo, className) {
            className = className.trim();
            if (className) {
                memo ? memo[className] = true : memo = _defineProperty({}, className, true);
            }
            return memo;
        }, null);
    } catch (e) {
        return null;
    }
}
},{"./utils":7,"html-parse-stringify2/lib/parse":2,"snabbdom/h":8}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.createTextVNode = createTextVNode;
exports.transformName = transformName;
exports.unescapeEntities = unescapeEntities;

var _vnode = require('snabbdom/vnode');

var _vnode2 = _interopRequireDefault(_vnode);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function createTextVNode(text, context) {
    return (0, _vnode2.default)(undefined, undefined, undefined, unescapeEntities(text, context));
}

function transformName(name) {
    // Replace -a with A to help camel case style property names.
    name = name.replace(/-(\w)/g, function _replace($1, $2) {
        return $2.toUpperCase();
    });
    // Handle properties that start with a -.
    var firstChar = name.charAt(0).toLowerCase();
    return '' + firstChar + name.substring(1);
}

// Regex for matching HTML entities.
var entityRegex = new RegExp('&[a-z0-9]+;', 'gi');
// Element for setting innerHTML for transforming entities.
var el = null;

function unescapeEntities(text, context) {
    // Create the element using the context if it doesn't exist.
    if (!el) {
        el = context.createElement('div');
    }
    return text.replace(entityRegex, function (entity) {
        el.innerHTML = entity;
        return el.textContent;
    });
}
},{"snabbdom/vnode":10}],8:[function(require,module,exports){
"use strict";
var vnode_1 = require("./vnode");
var is = require("./is");
function addNS(data, children, sel) {
    data.ns = 'http://www.w3.org/2000/svg';
    if (sel !== 'foreignObject' && children !== undefined) {
        for (var i = 0; i < children.length; ++i) {
            var childData = children[i].data;
            if (childData !== undefined) {
                addNS(childData, children[i].children, children[i].sel);
            }
        }
    }
}
function h(sel, b, c) {
    var data = {}, children, text, i;
    if (c !== undefined) {
        data = b;
        if (is.array(c)) {
            children = c;
        }
        else if (is.primitive(c)) {
            text = c;
        }
        else if (c && c.sel) {
            children = [c];
        }
    }
    else if (b !== undefined) {
        if (is.array(b)) {
            children = b;
        }
        else if (is.primitive(b)) {
            text = b;
        }
        else if (b && b.sel) {
            children = [b];
        }
        else {
            data = b;
        }
    }
    if (is.array(children)) {
        for (i = 0; i < children.length; ++i) {
            if (is.primitive(children[i]))
                children[i] = vnode_1.vnode(undefined, undefined, undefined, children[i]);
        }
    }
    if (sel[0] === 's' && sel[1] === 'v' && sel[2] === 'g' &&
        (sel.length === 3 || sel[3] === '.' || sel[3] === '#')) {
        addNS(data, children, sel);
    }
    return vnode_1.vnode(sel, data, children, text, undefined);
}
exports.h = h;
;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = h;

},{"./is":9,"./vnode":10}],9:[function(require,module,exports){
"use strict";
exports.array = Array.isArray;
function primitive(s) {
    return typeof s === 'string' || typeof s === 'number';
}
exports.primitive = primitive;

},{}],10:[function(require,module,exports){
"use strict";
function vnode(sel, data, children, text, elm) {
    var key = data === undefined ? undefined : data.key;
    return { sel: sel, data: data, children: children,
        text: text, elm: elm, key: key };
}
exports.vnode = vnode;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = vnode;

},{}]},{},[4])(4)
});