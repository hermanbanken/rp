---
layout: default
title:  "Data binding"
date:   2017-05-27 22:10:09 +0200
categories: frp
weight: 5
---

Often the terms reactive and reactive programming are used for programming using frameworks like Angular, React, Vue and Meteor. While these frameworks share much of the concepts of Reactive Programming, they do not offer the primitives types (Observable, Signal, Stream, etc.) that you expect when using Reactive Programming. In this section we explain what these frameworks offer and why it could be considered (a limited form of) Reactive Programming. 

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

Many modern web frameworks and libraries provide this functionality, often in combination with some form of view rendering. For example:

- AngularJS (2009) / Angular (v2+), 
	[docs](https://angular.io/)
- Knockout (2010),
  [docs](http://knockoutjs.com/)
- Meteor (2012),
  [docs](http://docs.meteor.com/#/full/)
- React (2013),
  [docs](https://facebook.github.io/react/)
- Vue.js (2013),
  [docs](https://vuejs.org/v2/guide/)
- Android Data Binding Library (2015), 
  [docs](https://developer.android.com/topic/libraries/data-binding/index.html)

Note that all - but the last - are in JavaScript (or TypeScript). This list is far from exhaustive. Equally some frameworks like this exist for other platforms, like native mobile platforms.

<!--## Implicit
The promise of automagically updating UI's and little to no manual wiring attracts many developers. For novice developers immediate visual feedback of their coding helps speed up the learning process.

The magic comes at a cost however. Compared to other kinds of Reactive Programming we can not control how data is propagated and the API's of for Reactive Extensions offer in -->

Many of the tasks involved in Reactive Programming are implicitly done for us when using these frameworks.

## Automated dependency graph
To achieve the behavior above - the behavior of a spreadsheet - with automatically updating values these frameworks need to detect changes and know which values to recalculate when other values change. To do this the frameworks track which variables are used to create other variables and they track this in a dependency graph. Whenever a dependency changes the graph is used to determine the variables that need to be recomputed.

A small Vue.js sample:

```javascript
var app = new Vue({
  el: '#app-0',
  data: { firstName: "John", lastName: "Doe" },
  computed: {
    fullName: () => { return this.firstName + " " + this.lastName }
  }
})
```

In Vue the data object is tracked by adding getters and setters. Whenever the `fullName` property is used the getters of `firstName` and `lastName` are called registering the following dependencies:

```
firstName -> fullName
lastName  -> fullName
```

Now the next time we update the `firstName` (`app.firstName = "Luke"`) the computation of `fullName` is scheduled.

Implementing such automated dependency tracking is astonishingly simple and in the [Tracker](#Tracker) section we will try to create a bare minimum example to illustrate this fact.

## Auto-subscribing templates

The JavaScript frameworks all allow bindings to be setup in the form of directives inside templates of (HTML) markup. The reason for changes is often user interaction, external input, like clicking a button or entering a form. When the data changes new HTML is generated and inserted.

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

By including ``{{ counter }}`` in the HTML the getter of `counter` is called and a dependency between the counter and the HTML is created. Calling `this.counter++` effectively sets the value of `counter` which Vue registers and as a result schedules a view update.

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

## Slightly limited
Data binding is more limited than Reactive Programming because data binding frameworks do not recognise events as first class data types. They simply re-render when data changes, but the change event itself you can not reference. The dependency graph is created implicitly and you can not reference it.

Not recognising events has some implications: data binding systems only intent to represent a current value. They do not represent time, or allow to reason about previous values, without making you resort to side-effects. To overcome this limitation we need some stronger tools, like Rx.

## Actual Reactive Programming

As the saying goes 'there is a npm package for that' of course we can use Reactive Programming primitives with above frameworks using some additional packages. Consider for example `vue-rx`. When we add the `vue-rx` package we can then use subscriptions in our Vue objects:

```html
<div id="app-3">
  <p>Hello {{ count }}</p>
  <button v-stream:click="plus$">+</button>
</div>
```

```javascript
let subject = new Rx.Subject()
new Vue({
  el: '#app-3',
  subscriptions() {
    this.plus$ = new Rx.Subject()
    return { 
      count: this.$plus.map(() => 1)
        .startWith(0)
        .scan((total, change) => total + change)
    }
  }
})
```

The same holds for React ([rx-react](https://github.com/fdecampredon/rx-react)) and Meteor ([meteor-rxjs](https://github.com/Urigo/meteor-rxjs)) which both have Rx-bindings.

Angular already uses Rx for Reactive Programming internally, and while you do not need to use Rx yourself when using Angular, it is actually recommended that you do, for asynchronous tasks like HTTP requests. Below is a simple example of how to subscribe to a Observable from the template, by simply adding the `async`-pipe after `time`. Angular understands that `time` is an Observable and subscribes for you, and cleans up the subscription if the component is cleaned up.

```typescript
@Component({
  selector: 'body',
  template: '<div>Time: {{ time | async }}</div>'
})
export class AsyncObservablePipeComponent {
  time = new Observable<string>((observer: Subscriber<string>) => {
    setInterval(() => observer.next(new Date().toString()), 1000);
  });
}
```

## Tracker
To gain better understanding of how dependency trackers work, we create our own. First we create a class that will contain the values and that we can depend on, lets call this `Dep`.

```typescript
class Dep<T> {
  constructor(private current: T) {}
  get value() {
    return this.current
  }
  set value(val: T) {
    this.current = val
  }
}
```

We need to support both input variables and computations. So lets extend the constructor and add two convience methods `val` for variables and `signal` for computations:

```typescript
  static val<T>(t: T) { return new Dep(t) }
  static signal<T>(c: () => T) { return new Dep(undefined, c) }
  constructor(private current?: T, private compute?: () => T) {}
```

Then we update the getter to track dependencies:

```typescript
  static active?: Dep<any>                      // (1)

  depending: Dep<any>[] = []                    // (2)

  get value() {
    if(Dep.active && this.depending.indexOf(Dep.active) < 0) {
      this.depending.push(Dep.active)           // (3)
    }
    let value
    if (typeof this.compute === "function") {   // (4)
      let previous = Dep.active
      Dep.active = this                         // (5a)
      value = this.current = this.compute()     // (6)
      Dep.active = previous                     // (5b)
    } else {
      value = this.current                      // (7)
    }
    return value
  }
```

In the `active` field (1) we will store the `Dep` that is currently being calculated. `depending` (2) stores which `Dep` we are a dependency of. 
At (3) we store a dependency if we are calculating the value of our Dep while there already is one Dep set as active. If we have a signal (4) we temporarily make the current Dep active (5a) and later swap this back (5b) after having called the `compute` function (6). If we have a variable we simply return the current value.

Then we implement the setter:

```typescript
  set value(value: T) {
    if(typeof this.compute === "function") {
      throw new Error("Cannot set value of computed property")
    }
    if(value !== this.current) {
      this.current = value
      this.depending.forEach(d => d.trigger())
    }
  }

  trigger() {
    if(this.current !== this.value) {
      this.depending.forEach(d => d.trigger())
    }
  }
```

Now the `current` value will always reflect the latest state, even if we update dependencies. However, it will also recalculate the value by traversing the whole tree, so lets add one more optimization: dirty-checking. To prevent re-computation we only calculate a fresh value when we are explicitly marked as dirty. The final code for our tracker now becomes:

```typescript
export default class Dep<T> {
  static active?: Dep<any>
  static val<T>(t: T) { return new Dep(t) }
  static signal<T>(c: () => T) { return new Dep(undefined, c) }

  private dirty = false
  private depending: Dep<any>[] = []

  constructor(private current?: T, private compute?: () => T) {
    if(typeof compute === "function") {
      this.dirty = true
      let initial = this.value
    }
  }

  get value() {
    if(Dep.active && this.depending.indexOf(Dep.active) < 0) {
      this.depending.push(Dep.active)
    }
    if(typeof this.compute === "function" && !this.dirty) {
      return this.current
    }
    let value
    if (typeof this.compute === "function") {
      let previous = Dep.active
      Dep.active = this
      value = this.current = this.compute()
      Dep.active = previous
      this.dirty = false
    } else {
      value = this.current
    }
    return value
  }

  set value(value: T) {
    if(typeof this.compute === "function") {
      throw new Error("Cannot set value of computed property")
    }
    if(value !== this.current) {
      this.current = value
      this.depending.forEach(d => d.trigger())
    }
  }

  trigger() {
    this.dirty = true
    if(this.current !== this.value) {
      this.depending.forEach(d => d.trigger())
    }
  }
}
```

We can now use our Dep to create an automatically updating system:

```typescript
let a = Dep.val(1)
let b = Dep.val(2)
let c = Dep.signal(() => a.value + b.value)

// Called everytime we update a or b:
Dep.signal(() => console.log(c.value))     // prints 3
a.value = 3                                // prints 5
```

## Conclusion
A quick way to create _Reactive Applications_ is what most of these frameworks promise. They deliver on the quick-part as it is very convenient to create web applications using templates that automatically update. While not necessarily using specialized reactive primitives the frameworks do provide _reactivity_ by means of automated dependency graphs and auto-subscribing templates and offer a gradual introduction to full-fledged Reactive Programming by means of extensions.