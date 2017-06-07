---
layout: default
title:  "Cycle.js"
weight: 45
---

# Cycle.js

Cycle is a web framework that separates your main application (a pure - [as possible](https://staltz.com/is-your-javascript-function-actually-pure.html) - function) from the effects which take place in drivers. The main application receives inputs in the form of sources and creates sinks with the side effects that need to be performed. This creates a loop, a Cycle. An image from the [documentation](https://cycle.js.org/) explains best:

![Cycle main() dataflow and side effects](https://cycle.js.org/img/cycle-nested-frontpage.svg)

Cycle is built on top of Reactive Programming libraries (which you can select yourself) and drivers for - among others - virtual dom rendering and HTTP communication. It fills the same gap as frameworks like React and Vue. When more reactive expressiveness is needed Cycle is a better choice than these libraries as you are free to define exactly how the sources are wired to the sinks, without restrictions like the component architecture of libraries like [Vue](binding.html) and [React](binding.html).

The hello world example of Cycle shows how to wire an input field to an application which directly outputs the name again:

```javascript
import {run} from '@cycle/run'
import {div, label, input, hr, h1, makeDOMDriver} from '@cycle/dom'

function main(sources) {
  const input$ = sources.DOM.select('.field').events('input')

  const name$ = input$.map(ev => ev.target.value).startWith('')

  const vdom$ = name$.map(name =>
    div([
      label('Name:'),
      input('.field', {attrs: {type: 'text'}}),
      hr(),
      h1('Hello ' + name),
    ])
  )

  return { DOM: vdom$ }
}

run(main, { DOM: makeDOMDriver('#app-container') })
```

Here only the `run` and `makeDOMDriver` methods are part of Cycle. The rest of the code is a combination of [_xstream_](#xstream) and [_virtual-dom_](https://github.com/snabbdom/snabbdom).

## xstream
The [xstream library](https://github.com/staltz/xstream) is the default RP library of Cycle. It is a stripped down and simplified version of RxJS. Cycle has the following four fundamental types:

- Stream
- MemoryStream
- Listener
- Producer

The Stream and MemoryStream emit events. You must attach Listeners to the Stream or MemoryStreams to receive the events. The production of events is done by a Producer. 
A basic xstream looks like this:

```javascript
// A simple producer which emits every second
var producer = {
  start: function (listener) {
    this.id = setInterval(() => listener.next('yo'), 1000)
  },
  stop: function () {
    clearInterval(this.id)
},
  id: 0,
}

// A stream created from that producer
var stream = xs.create(producer)

// Transforming the stream, here with the `drop` and `startWith` operators
var transformed = stream
  .drop(1)
  .startWith('hello')

// Listen
var listener = {
  next: (value) => console.log(value),
  error: (err) => console.error(err),
  complete: () => console.log("done"),
}
transformed.subscribe(listener)
```

All Producer and Listener objects are simply normal JavaScript objects which you must ensure to give the following methods:

- Producer
  - `start`: starts the data flow
  - `stop`: stop and cleanup resources
- Listener
  - `next(n)`: receives values
  - `error(e)`: receives error, last event in stream
  - `complete()`: notified upon completion, last event in stream

The Stream and MemoryStream object in contrast are created using [factory methods](https://github.com/staltz/xstream#factories) and have a [set of operators](https://github.com/staltz/xstream#methods-and-operators) (a subset of the RxJS operators).

## Reference counting
Streams in `xstream` are always [hot](shared.html#hot-or-cold) meaning that the side effects of the producer setup are run once. No matter how many listeners you add to the stream, there is only a single producer. This is done by counting the amount of listeners of a stream: when the count moves from 0 to 1 the producer is started, when the count goes from 1 to 0 the producer is scheduled to be stopped. Scheduled, meaning only after the next tick (setTimeout(0), setImmediate, nextTick). 

It is a common pattern in UI's is to swap components (like tabs) that use the same stream of data, thus the following is common:

```javascript
var stream = xs.periodic(1000)

var screen1 = { next: n => console.log("Screen 1, value: " + n) }
var screen2 = { next: n => console.log("Screen 2, value: " + n) }

// go to screen 1
stream.addListener(screen1)     // ref-count 0 => 1

// later we switch to screen 2
stream.removeListener(screen1)  // ref-count 1 => 0, schedule stop
stream.addListener(screen2)     // ref-count 0 => 1, cancel scheduled stop
```

By removing the `screen1` listener and immediately adding the `screen2` listener in the same sequential execution the stream is kept active. Any next value that was already scheduled and arrives in less than 1 second will still be delivered, whereas a full stop and start would means a next value would come after 1 full second. The same holds for expensive to create streams, for example those that represent remote resources we do not want to request multiple times.

## Memoization
Depending on the type of stream memoization through Cycle's `Stream.remember()` function can be very useful. `remember` ensures that upon subscription the new listener receives the latest value.  If a stream represents an external resource we commonly want to cache values in this stream until a new value arrives. By caching at least some (stale) value is immediately available to be rendered. 

```javascript
const stream1 = xs.from(fetch("/api/movies/1")).remember();
const stream2 = xs.of(2);

// screen 1
stream1.addListener({})

// later in screen 2
xs.combine(stream1, stream2)
```

In above sample the second screen receives the same result as the first screen, even if the request completed before we switch to screen 2. The pattern of combining the values of multiple streams is common in Cycle and possible through `combine`, which puts together the latest values of each stream in an array, every time one of the streams emits.

## Comparing RxJS and xstream for Cycle.js
Using Cycle.js differs from using RP as part of some regular imperative codebase in that it takes care of subscribing the streams. By doing so it can make sure that sinks are connected to the sinks, creating a cycle. The divers hide the subscription away from the users and since users don't have control over these subscriptions it would be awkward to debug the subscriptions of a stream, for example in cases where multiple subscriptions on the same stream result in side-effects running multiple times.

If we use RxJS we can create streams that are cold: when multiple subscriptions happen the effects are ran multiple times. The same holds for hot reference-counting streams that are unsubscribed and synchronously resubscribed. To remedy this we must make sure to use the right operators when using Rx, to not cause these situations. xstream avoids the situations all together by making it impossible to create cold streams and very unlikely that resubscription triggers the effects by adding asynchronous unsubscription. 

If we do want to use Rx inside Cycle the following operators help:

- [`share`](http://reactivex.io/rxjs/class/es6/Observable.js~Observable.html#instance-method-share). This multicasts the observable as long as there is at least one observer. Beware of the issues dicussed in [Reference counting](#reference-counting) when you create the behavior of switching between components (e.g. routing, tabs).
- [`publish(selector)`](http://reactivex.io/rxjs/class/es6/Observable.js~Observable.html#instance-method-publish). Rx' publish without arguments creates a `ConnectableObservable` which we must manually `connect()` but publish with selector allows us to use the multicasted observable many times inside the selector.

## Drivers for side effects: Stream IO
Moving the side effects to drivers sounds familiar if you have just read the [Elm section](elm.html). The Elm Architecture deals with side effects through _commands_ (Cmd) and reacts to the result of the effect through means of _subscriptions_ (Sub) and _messages_ (Msg). The Elm runtime handles the commands and ensures messages are send back through Subscriptions.

Cycle works similarly. Cycle has Sinks through which similar commands are send for the _drivers_ to apply and drivers give back their output as Sources. Two examples of Cycle drivers are the DOM driver and the HTTP driver.

> Sidenote:
>
> This way of delegating output effects and receiving input effects is the Stream IO pattern, once part of Haskell 1.0. In current versions of Haskell the default pattern for IO became Monadic IO through the use of the IO monad.

### DOM driver
The DOM driver is responsible for rendering a virtual DOM tree to the actual browser DOM and attaching event listeners as requested by the `main()` function. The underlying virtual dom library makes sure to apply the minimal amount of changes to prevent costly browser layout operations. As a user we do not need to worry about these underlying performance optimizations or differences between different browsers, instead we leave that to the driver.

<style>
img[alt="DOM driver"] { 
  max-width:  400px; 
}
</style>

![DOM driver](https://cycle.js.org/img/main-domdriver-side-effects.svg).

Above sample, here repeated, shows where the DOM driver is used:

```javascript
import {run} from '@cycle/run'
import {div, label, input, hr, h1, makeDOMDriver} from '@cycle/dom'

function main(sources) {
  const input$ = sources.DOM.select('.field').events('input')
                      // ^ use select & events to receive events  
  const name$ = input$.map(ev => ev.target.value).startWith('')

  const vdom$ = name$.map(name =>
    div([
      label('Name:'),
      input('.field', {attrs: {type: 'text'}}),
      hr(),
      h1('Hello ' + name),
    ])
  )
  // ^ a virtual dom stream is created for the DOM driver to render

  return { DOM: vdom$ }
}

run(main, { 
  DOM: makeDOMDriver('#app-container')
  // ^ attach the dom driver
})
```

The obvious alternative of not using Cycle.js drivers (Stream IO) is to use some kind of monadic IO. In JavaScript we do have explicit access to the outside "World" being the DOM so we can mix some monadic IO through RxJS Observables with imperative logic to update the DOM. This still has the performance gains of virtual dom and as a bonus is quite easy to understand too.

```javascript
import { Observable, BehaviorSubject } from 'rxjs'
import snabbdom from 'snabbdom'
import h from 'snabbdom/h'
const patch = snabbdom.init([event])

let input$ = Observable.fromEvent(document.querySelector(".field"), "input")

let vdom$ = input$.map(name => 
  h("div", [
    h("label", 'Name:'),
    h("input", '.field', { attrs: {type: 'text'} }),
    h("hr"),
    h("h1", 'Hello ' + name),
  ])
)

let app = document.querySelector("div.app")
vdom$.subscribe(vnode => { 
  app = patch(app, vnode)
})
```

### HTTP driver
A good sample of using the HTTP driver is available [here](https://github.com/cyclejs/cyclejs/blob/master/examples/http-search-github/src/main.js). To use the HTTP driver we create a Sink of requests that we want the driver to handle and in turn receive a Source with all responses that the driver got back. Lets show parts of the linked example:

```javascript
const searchRequest$ = sources.DOM.select('.field').events('input')
    .map(ev => ev.target.value)
    .map(q => ({
      url: `https://api.github.com/search/repositories?q=${encodeURI(q)}`,
      category: 'github',
    }));

const otherRequest$ = sources.Time.periodic(1000).take(2)
    .mapTo({url: 'http://www.google.com', category: 'google'});

const request$ = xs.merge(searchRequest$, otherRequest$);

const vtree$ = sources.HTTP.select('github')
    .flatten()
    .map(res => res.body.items)
    .startWith([])
    .map(results =>
      div([
        label('.label', 'Search:'),
        input('.field', {attrs: {type: 'text'}}),
        hr(),
        ul('.search-results', results.map(result =>
          li('.search-result', [
            a({attrs: {href: result.html_url}}, result.name)
          ])
        ))
      ])
    );

return {
  DOM: vtree$, // dom driver sink
  HTTP: request$, // http driver sink
};
```

In this example we see requests of two kinds: Github search requests and Google searches. The Github API is searched when the DOM source returns an event while the Google search is done periodically. The example shows how we can neatly separate the logic of doing the requests from handling the responses.

An important objection is that handling the HTTP request in this way (the Stream IO way) decouples the request from the response: while Monadic IO keeps the state in one object (the monad), Stream IO must deal with responses of certain requests in different locations. In above example the `category` field needs to be added to the request - labeling the stream - which is then later on used to retrieve the response stream (`sources.HTTP.select('github')`). This feels a little bit iffy: we need to resort to magical identifiers to get our responses. What would happen if we had a dynamic amount of different categories?

Consider this 'monadic' alternative by using plain RxJS and virtual-dom:

```javascript
const inputs = Observable.fromEvent(document.querySelector(".field"), "input")

const searches$ = inputs.switchMap(q => 
  fetch(`https://api.github.com/search/repositories?q=${encodeURI(q)}`)
    .then(res => ({ items: res.body.items, q: q }))
)

const searches$
  .startWith({ items: [], q: "" })
  .map(result => div([
    "Your search", 
    result.q,
    ...result.items, 
    /* more vtree here */
  ]))
```

The monadic `flatMap` (here variant `switchMap` is used) in the example allows us to keep arbitrary state of the query with the response. With Stream IO the requests and responses are uncoupled not allowing us to associate arbitrary state with the I/O. 

## Conclusion
So far we have seen that Cycle is mostly a paradigm how to structure applications using drivers (Stream IO) and Reactive Programming as a glue. As a framework it offers the `run` method and several ready-made drivers. The power of Cycle comes from how it integrates with `xstream` to simplify streams (always hot) and with `virtual-dom` (through the DOM driver) to create pure application logic.

The Stream IO way of writing applications has advantages for separating logic and creating easily testable applications, as we can simply replace the drivers at one single location with mocked alternatives. It does require a mental shift from using imperative logic or from using monadic IO though.

We have seen a mixed monadic / imperative alternative to Stream IO, by exploiting the access to the DOM in the imperative world of JavaScript. The code remains well readable and has more expressive power (e.g. `flatMap` to keep the state together). However, in the end your choice is still a matter of preference.

[Continue with Shared ideas](shared.html)
