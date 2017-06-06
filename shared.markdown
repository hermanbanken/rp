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
Choosing the right language or framework thus requires at least some knowledge of the internal evaluation models. Generally two paradigms exist: _push_ and _pull_. In this section we explains both their advantages and disadvantages, and use cases.

When propagating changes in a reactive system, either of the two parties can be in charge of initiating the propagation. Either the sources send (push) values to their dependants or the dependants request (pull) the values from their sources. Don't be confused: the data always originates at the source and flows to destination, but who is responsible is what changes.

### Push
_Push_ based reactive systems propagate changes to subscribers as soon as new data arrives. It is _data-driven_. To achieve this, such a system let subscibers register with the source or observable to receive updates first. The source then remembers who is subscribed. Later, when a source changes, it pushes an update to all dependants. There is nothing the dependant can do to stop this, except unregistering. This conforms to the original definition of Reactive Programming: the dependant operates at the speed of the environment providing new data. This ensures the fasted delivery possible: whenever new data is available it reaches the destination. A disadvantage is that the programmer needs to make sure that processing the change is fast, virtually instant. Luckily frameworks generally implement ways to deduplicate, buffer or drop superfluous changes. Push based systems work best when changes have a discrete character, for example clicks or tweets, and there is no sample rate that is seriously limiting the main effect. Push based it more suitable for updating a database or application UIs than for example the game loop of a 60fps 3d shooter game.

### Pull
_Pull_ based systems propagate changes whenever the subscriber requires new data. They are <em>demand-driven</em>. The first Functional Reactive Programming languages (<a href="http://conal.net/fran/">Fran</a>) were pull based. It matches well with the concept of a Behavior, a continuous function: continuous functions need to be sampled to visualize them on a screen or write them to disk. When a new sample is started each value requests the values of it's upstream dependencies. This ensures no wasteful computations are done in-between samples, but also introduces a delay between changes and their effect: on average half the sample rate and in the worst case the full sample rate.

It can be argued that pull based systems are not 'reactive' in the sense of the original definition: the subscriber is in charge of requesting new data, so it is possible that the system does not operate at the speed of the environment. Depending on the use case this can be a good thing, but in most use cases for Reactive Programming pull-based systems theoretically offer better performance.

### Pull the trigger
The evaluation model is really about which party triggers change to be propagated, but there is another distinction: how the change is propagated. In frameworks that utilize a subscriber pattern the change is pushed to the subscribers, providing them with a new value. This is in contrast to frameworks that operate on a dependency graph, which trigger re-computation of a part of this graph, by retrieving the input values and performing the computation, triggering changes further down the graph.

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
