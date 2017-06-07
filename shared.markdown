---
layout: default
title:  "Shared ideas"
date:   2017-05-27 22:10:09 +0200
categories: rp
weight: 60
---

# Shared ideas
Having reviewed several kinds of Reactive Programming, we now look at some concepts that are shared among several implementations and look for similarities and differences.

## Streams
There are many different names for streams. Flows, observables, signals, events, behaviors, flux to name a few. What they all have in common is that they represent some collection of (past or future) values. Having these data types means that we can reason about future values just as we can about values that we already have.

Some libraries restrict the types of events in the streams: the "next*(error&#124;complete)"-restriction of Rx and alike. Other libraries like FRP define continuous streams in the form of Behaviors that we need to measure in order to display. Other libraries like Elm consider Signals as pure inputs to the reactive system that we can not declare during runtime.

## The evaluation model: to push or pull
Each reactive programming language or framework has an _evaluation model_, responsible for propagating changes. This evaluation model of a reactive system is mostly hidden to the user, but it influences the performance and the capabilities that the system offers.
Choosing the right language or framework thus requires at least some knowledge of the internal evaluation models. Generally two paradigms exist: _push_ and _pull_. Lets explains both their advantages and disadvantages, and use cases.

When propagating changes in a reactive system, either of the two parties can be in charge of initiating the propagation. Either the sources send (push) values to their dependants or the dependants request (pull) the values from their sources. Don't be confused: the data always originates at the source and flows to destination, but who is responsible is what changes.

### Push
_Push_ based reactive systems propagate changes to subscribers as soon as new data arrives. It is _data-driven_. To achieve this, such a system let subscibers register with the source or observable to receive updates first. The source then remembers who is subscribed. Later, when a source changes, it pushes an update to all dependants. There is nothing the dependant can do to stop this, except unregistering. This conforms to the original definition of Reactive Programming: the dependant operates at the speed of the environment providing new data. This ensures the fasted delivery possible: whenever new data is available it reaches the destination. A disadvantage is that the programmer needs to make sure that processing the change is fast, virtually instant. Luckily frameworks generally implement ways to deduplicate, buffer or drop superfluous changes. Push based systems work best when changes have a discrete character, for example clicks or tweets, and there is no sample rate that is seriously limiting the main effect. Push based it more suitable for updating a database or application UIs than for example the game loop of a 60fps 3d shooter game.

### Pull
_Pull_ based systems propagate changes whenever the subscriber requires new data. They are <em>demand-driven</em>. The first Functional Reactive Programming languages (<a href="http://conal.net/fran/">Fran</a>) were pull based. It matches well with the concept of a Behavior, a continuous function: continuous functions need to be sampled to visualize them on a screen or write them to disk. When a new sample is started each value requests the values of it's upstream dependencies. This ensures no wasteful computations are done in-between samples, but also introduces a delay between changes and their effect: on average half the sample rate and in the worst case the full sample rate.

It can be argued that pull based systems are not 'reactive' in the sense of the original definition: the subscriber is in charge of requesting new data, so it is possible that the system does not operate at the speed of the environment. Depending on the use case this can be a good thing, but in general this becomes harder to reason about if we combine the two.

### Pull for re-computation
The evaluation model is really about which party triggers change to be propagated, but there is another distinction: how the change is propagated. In frameworks that utilize a subscriber pattern the change is pushed to the subscribers, providing them with a new value. This is in contrast to frameworks that internally manage a dependency graph (like the [data binding](binding.html) ones), which trigger re-computation of a part of this graph, by retrieving the input values and performing the computation, triggering changes further down the graph.

## Hot or cold
The issue of hot and cold streams is frequently a problem new developers face and don't understand. Stackoverflow is full of people having bugs caused by this and there are equally many articles explaining the difference. So lets [add another one](https://xkcd.com/927/).

Whether a stream is hot or cold depends [on one thing](https://twitter.com/headinthebox/status/616007915112017920): do side effects happen upon subscription? Hot streams share side effects, while cold streams run (the/any) side effect per observer. Lets look at the examples below ([source](https://medium.com/@benlesh/hot-vs-cold-observables-f8094ed53339)):

```javascript
// COLD
var cold = new Observable((observer) => {
  var producer = new Producer();
  // have observer listen to producer here
});
```

```javascript
// HOT
var producer = new Producer();
var hot = new Observable((observer) => {
  // have observer listen to producer here
});
```

Commonly people confuse cold streams to be streams that are synchronous (`Observable.from(1, 2, 3)`). While that is a common source of cold streams, the following Observable is also stone cold and certainly not synchronous:

```javascript
// COLD
var cold = new Observable((observer) => {
  // interval created inside
  let t = setInterval(() => observer.next(true), 100)
  return () => clearInterval(t)
});
```

Another source of confusion is due to avoiding re-computation. Given a hot stream, if we create multiple new streams off this source by multiple transformations the computation of the operators is still going to be executed multiple times. People refer to these streams as _"warm"_ however they are still hot as long as the operators have pure functions.

```javascript
var hot = /* HOT input stream */

// heavyComputation executed twice (for A & for B), 
// should still be called HOT, heavyComputation is no side-effect
var hotAndExpensive = hot.map(heavyComputation)

var hotA = hotAndExpensive.map(fooComputation)
var hotB = hotAndExpensive.map(barComputation)
```

### Making cold streams hot
Often we want to execute side-effect once, so our cold stream should be subscribed once. There are several ways and operators to make our stream hot. The idea is to have a single observer for the cold stream, and this single observer then multicasts the values to all of its own registered listeners. Examples using RxJS:

```javascript
cold = /* cold interval Observable from above */

var hot1 = cold.share()
// hot1 automatically starts cold after the first subscriber

var hot2 = cold.publish()
// use hot2 multiple times
hot2.connect()
```

## Glitches
Some reactive languages advocate to be glitch free, which sounds good, but what does it mean?
Glitches are described as a temporarily state that is incorrect and should not occur.
A very simple and often used example is a triangle shape dependency graph.
Node A is a reactive value and node B depends on it.
Node C depends on both A and B and combines the resulting values somehow.
Now when node A changes both B and C must also be updated. Now a glitch occurs if the changes of A and B do not arrive at C at the exact same instant.
Some languages have some sort of clock tick which allows the changes to be buffered until the next tick, and some do not.
It is important to know whether the language you are using prevents glitches or not.
Arguably glitches do not matter: nothing ever happens simultaneous in a single cpu core,
so even the intermediate state should be regarded as correct.
When you do not expect these states however, nasty bugs could creep in.

An artificial `glitch` using Rx:

```javascript
const A = new Subject()
const B = A.map(x => x * 2)
const C = Observable.combineLatest(A, B, (a, b) => a + b)
C.subscribe(console.log)

A.next(1) // 3
A.next(3) // 5, 9
A.next(5) // 11, 15
```

Here we see that `combineLatest` waits for both A and B to have send a value before it outputs, so only 1 output for `A.next(1)`. Then if we send `3`, we see 5 (`A == 3 && B == 2`) come out and then 9 (`A == 3 && B == 6`). This is because in Rx values are pushed to every Observer of a Subject recursively and sequentially.

The 5 could be considered a glitch: a temporary incorrect state. However when we are aware of these shapes in the dependency graph we can quickly remedy the issue:

```javascript
// if they emit at the same time always
const C = Observable.zip(A, B, (a, b) => a + b)

// if they are `hot` and a minor delay is acceptable
const C = Observable.combineLatest(A, B, (a, b) => a + b).debounce(0)
```