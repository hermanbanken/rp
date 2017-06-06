---
layout: default
title:  "Cycle.js"
weight: 45
---

# Cycle.js

Cycle is a web framework that separates your main application (a pure, as possible, function) from the effects which take place in drivers. The main application receives inputs in the form of sources and creates sinks with the side effects that need to be performed. This creates a loop, a Cycle. An image from the [documentation](https://cycle.js.org/) explains best:

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
The [xstream library](https://github.com/staltz/xstream) is the default RP library of Cycle. It is a simpler alternative to RxJS. Cycle has the following four fundamental types: 

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

// Transforming the stream
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
<!--The use case of xstream inside Cycle is mostly for creating UI applications. These applications request 
Some differences exist between xstream and -->
- Stream is hot, uses reference counting, PublishSubject

## Memoization
- MemoryStream caches latest value. Is a ReplaySubject

## Comparing RxJS and xstream for Cycle.js

## Drivers for side effects

- like Elm Architecture
	- aggregating side effects in streams allows for optimizations like batching, see Elm optimization strategy

## Conclusion
- Built on top of RP
- design pattern for web apps using RP