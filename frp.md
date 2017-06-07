---
layout: default
title:  "FRP"
weight: 1
---

# Functional Reactive Programming

In 1997 Conal Elliot created a Functional Reactive Animation system ([Fran]((http://www.eecs.northwestern.edu/~robby/courses/395-495-2009-winter/fran.pdf))) and defined [Functional Reactive Programming](https://stackoverflow.com/a/5878525/552203). While Fran was used only for animation, the core building blocks (_Events_ and _Behavior_) outlived Fran and are very relevant for Reactive Programming in general.

## Building blocks

FRP defines two reactive data types, _Events_ and _Behaviors_. Events represent a sequence of discrete timestamped values, for example mouse clicks. They represent all (past and future) occurrences of some event at a specific times. They are discrete: you can count them.

`Event α = [(Time, α)]`

This notation, directly from the Fran paper, means that Events are generic (in type α) and and represent a collection of pairs of time and value. In other words `Event extends Collection<(Time,A)>`.

Behaviors, on the contrary, are continuous and time-varying values. For example analog position, velocity or acceleration, the temperature, or time itself, are behaviors. At any given (valid) time a behavior has a value. You can measure velocity, but you can not _count_ a velocity as it may have infinite amount of values over time. Behaviors can be represented as a function from time to a value:

`Behavior α = Time → α`

Translating this notation to for example Java: `Function<Time,A>`. Given a time, get a value A.

To get a visual idea of aboves definitions, consider this graph representing a (mouse-move) Event and one representing a (sinus) Behavior.
<script src="workspace/frp-graphs/discrete.js"></script>
<div class="caption">Mouse clicks Event, discrete</div>

<script src="workspace/frp-graphs/continuous.js"></script>
<div class="caption">Sinus wave Behavior, continuos, no gaps</div>

## Signals

Behaviors are not so practical: in the digital world of computers we need to approximate behaviors and their continous values. We can only measure the values a finite amount of times, bounded by computer clock cycles. When [Wan et al.](http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.63.4658&rep=rep1&type=pdf) created a FRP for realtime systems (RT-FRP) they needed a way to provide strict limits on the time and space required for computations. They observed the following _isomorphism_ between Events and Behaviors:

`Event α ≈ Behavior ( Option α )`

This means that at each point in time there is either some event or there is no event. In their system they used _signals_ which represent an optional value at each time. Continuous values, behaviors, when used in the computer are really discrete values or measurements and thus values at every timestep. Events only have values at some timesteps.

<script src="workspace/frp-graphs/continuous.discrete.js"></script>

<div class="caption">Sinus wave as discrete measurements</div>

Often there is an actual maximum frequency at which the behavior measurements are needed, for at least two reasons:

- the input is received only at the sample speed of the sensors and
- the system can only display the results to the screen at a maximum of the refresh rate of the monitor or a given output rate to other outputs.

Depending on how the behavior is used, this even allows for some optimization: by not firing an event when the sampled value did not change, we can prevent unnecessary recomputations. When further computations count or average the values this can not be done of course, so in most languages this is an explicit operation, often called `distinct`.

<script src="workspace/frp-graphs/discrete.optimize.js"></script>

<div class="caption">Only send events when the measurements change</div>

Some restrictions on this isomorphism have to be regarded however, as one can express behaviors that are hard or impossible to convert to deterministic events. Sometimes these difficulties are solved by increasing the sampling rate, like with integrals. Languages like Fran allow for behaviors like `integrate` which apply mathematical integration to a function. These behaviors can be approximated with sampling rates going close to zero.

Examples of impossibly convertible behaviors are `sharp` (behavior with some different value at exactly and only time `t`), [Zeno's paradox](https://en.wikipedia.org/wiki/Zeno%27s_paradoxes) (increasing frequency going to infinity), and `unpredictable` (non-determinism). These examples share the feature that frequency and sampling rate play an important role. This is hard to express semantically, [Wan and Hudak](https://pdfs.semanticscholar.org/b3b5/59104528d31f7db7fbe208377abdc4a00e15.pdf) describe them as non-terminating or erroring for their real time FRP.

## Examples

The original Fran implementation became [deprecated](http://conal.net/fran/). However, other FRP libaries were created based on Fran, so just for fun, let's look at some examples.

```haskell
wiggle = sin (pi * time)
```

`wiggle` defines a Behavior which fluctuates over time between -1 and 1. If time would be just a constant value we would know how to apply `pi * ` and the `sin` functions. However, `time` is a Behavior and Fran exploits implicit _lifting_ of Haskell type classes and the appropriate type class instances to use familiar syntax for the reactive types. Let's delve deeper.

```haskell
colorCycle t0 =
  red    `untilB` leftButtonPress t0 *=> \t1 ->
  green  `untilB` leftButtonPress t1 *=> \t1 ->
  colorCycle t2
```

Events can be used in conjunction with Behaviors as shown in this `colorCycle` example. Here the `leftButtonPress t0` are the mouse clicks starting from time `t0`. When this event occurs `untilB` switches from `red` to whatever the right side of that expression emitted: a new behavior which starts of as `green`. A next click will recursively switch to a new `colorCycle`, so the behavior becomes `red` again. You might wonder what the arrow `*=>` means. Recall that events are time and value pairs, so Elliot defined:

- `+=>` as a handler which takes both time and data of the event
- `==>` as a handler which takes only the data of the event
- `*=>` as a handler which takes only time of the event
- `-=>` as a handler which receives none of the data

These different handlers are available as a convenience to not pollute the code with unused lambda-arguments or directly use expressions needing only those arguments. 

Many operators are available, for which I am not going to provide individual examples, but instead here are some important ones here:

| Operator | What it does |
| -------- | ------------ |
| `time` : Behavior<sub>Time</sub> | Simplest behavior, simply the current time |
| `constEv` : Time -> α -> Event α | defines a constant event at a given time and with a given value |
| `untilB` : Behavior<sub>α</sub> -> Event<sub>Behavoir<sub>α</sub></sub> -> Behavoir<sub>α</sub> | behave like the first behavior, until an event occurs, then switch to the behavior inside the event |
| `predicate` : Behavior<sub>Bool</sub> -> Time -> Event<sub>()</sub> | defines an event at the first time behavior `b` is `true` after time `t` |
| `joinEv` : Event<sub>Event<sub>α</sub></sub> -> Event<sub>α</sub> | Emits an event when both the outer and inner event occurred |
| `.|.` : Event<sub>α</sub> -> Event<sub>α</sub> -> Event<sub>α</sub> | Takes whichever event occurs first |
| `snapshot` : Event<sub>α</sub> -> Behavior<sub>β</sub> -> Event<sub>α x β</sub> | Samples the behavior when the event occurs, yielding pairs of the event/behavior values |
| `lift`<sub>n</sub> | Combines multiple behaviors with a function over the `n` values inside, yielding a new behavior |

## Semantics

The semantics of Events and Behaviors are well defined in Elliots paper [Push-Pull Functional Reactive Programming](http://conal.net/papers/push-pull-frp/push-pull-frp.pdf). The original definitions and primitives are replaced by common Haskell classes and methods where possible, giving the semantics of the Event and Behavior instances of Functor, Applicative Functor, Monoid and Monad, when they exist.

For both Behavior and Event the Functor instance is trivial: a function is applied each value, leaving the time value intact. The Applicative Functor instances are less trivial. For a function-valued and one or more argument-valued Behaviors the Applicative Functor <*>-function samples functions and arguments at time t. The resulting Behavior consists of the application of those inputs.

<pre>instance Applicative Behavior where
  at (pure a)
      = pure a
      = const a
  at (b<sub>f</sub> &lt;*&gt; b<sub>x</sub>)
      = at b<sub>f</sub> &lt;*&gt; at b<sub>x</sub>
      = λt ⟶ (b<sub>f</sub> `at` t) (b<sub>x</sub> `at` t)
</pre>

For Event the Applicative Functor needs to handle two Event's which not necessarily have equal (amount of) values of t. Therefore all possible pairs constructed from values of the two Event's, yielding m + n different time clusters of values, as we need to wait for both time values t<sub>1</sub> and t<sub>2</sub>, effectively taking the maximum t.

For Event's the Monoid and Monad instances are defined by Elliot. The Monoid instance can provide an empty Event (never occurs) and merge multiple Events, in a time-ordered fashion. 

The Monad instance is useful when an Event generates Events, for which Elliot uses an astroid collision tracking example, where each spawned astroid generates an Event of collisions. The instance takes care of flattening this event-valued event, taking care that inner events cannot fire before they are created by the outer event.

[Continue with Elm](elm.html)
