---
layout: default
title:  "Shared ideas"
date:   2017-05-27 22:10:09 +0200
categories: rp
weight: 6
---

# Shared ideas
Having reviewed several kinds of Reactive Programming, we now look at some concepts that are shared among several implementations and look for similarities and differences.

## Streams
There are many different names for streams. Flows, observables, signals, events, behaviors, flux to name a few. What they all have in common is that they represent some collection of (past or future) values. Having these data types means that we can reason about future values just as we can about values that we already have.

Some libraries restrict the types of events in the streams: the "next*(error|complete)"-restriction of Rx and alike. Other libraries like FRP define continuous streams in the form of Behaviors that we need to measure in order to display. Other libraries like Elm consider Signals as pure inputs to the reactive system that we can not declare during runtime.

## Push versus pull

## Glitches