---
layout: default
title:  "Data binding"
date:   2017-05-27 22:10:09 +0200
categories: frp
weight: 5
---

# Data binding frameworks
Among non-technical users the most well known example of data bindings are Excel Spreadsheets. The idea is that you define some value in terms of other values, and when the dependencies change, the dependent values are updated too.

```javascript
var a = 1
var b = 2
var c = a + b
// c == 3
b = 5
// c == 6
```

Many modern web frameworks and libraries provide this functionality, in combination with some form of view rendering. For example:

- AngularJS (2009), 
	[docs](https://angular.io/)
- Knockout (2010),
  [docs](http://knockoutjs.com/)
- Meteor (2012),
  [docs](http://docs.meteor.com/#/full/)
- React (2013),
  [docs](https://facebook.github.io/react/)
- Vue.js (2013),
  [docs](https://vuejs.org/v2/guide/)
- Andriod Data Binding Library (2015), 
  [docs](https://developer.android.com/topic/libraries/data-binding/index.html)

Note that all but the last are in JavaScript (or TypeScript). This list is far from exhaustive. Equally some frameworks like this exist for other platforms, like native mobile platforms.

<!--## Implicit
The promise of automagically updating UI's and little to no manual wiring attracts many developers. For novice developers immediate visual feedback of their coding helps speed up the learning process.

The magic comes at a cost however. Compared to other kinds of Reactive Programming we can not control how data is propagated and the API's of for Reactive Extensions offer in -->

## Templates

The JavaScript frameworks all allow bindings to be setup in the form of directives inside templates of HTML markup and/or using manual wiring using imperative syntax. The reason for changes is often user interaction, external input, like clicking a button or entering a form. When the model changes new HTML is generated and inserted.

A small Vue.js sample:

```html
<div id="app-1">
  <p>{{ counter }}</p>
  <button v-on:click="addOne">Add one</button>
</div>
```

```javascript
var app = new Vue({
  el: '#app-1',
  data: { counter: 0 },
  methods: {
    addOne: () => { this.counter++ }
  }
})
```

Some of the above frameworks support two-way bindings out of the box: when special directives are in place not only will the view update when the model changes, but the model will be automatically updated when the view changes too, by keystrokes in a form field for example. Writing these bindings allows developers to write layout code once and not be bothered with writing callbacks for the change of each individual value.

```html
<div id="app-2">
  <p>Hello {{ message }}</p>
  <input v-model="message">
</div>
```
```javascript
var app = new Vue({
  el: '#app-2',
  data: { message: 'World' }
})
```

## Dependency graph

It is possible to build a data binding system using Reactive Programming. It is more limited than Reactive Programming because data binding frameworks do not recognise events as first class data types. They simply re-render when data changes, but the event itself you can not reference.

Not recognising events has some implications: data binding systems only intent to represent a current value. They do not represent time, or allow to reason about previous values, without making you resort to side-effects. To overcome this limitation we need some stronger tools, like the next use case of the term reactive, that this article is about.