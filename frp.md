---
layout: default
title:  "FRP"
weight: 1
---

# Functional Reactive Programming

One of the first times Reactive Programming was written in capitals was when Conal Elliot wrote his paper about _Functional_ Reactive Programming. Elliot uses functional rather than imperative style for their Reactive Animation system Fran [Elliot, 1997](http://www.eecs.northwestern.edu/~robby/courses/395-495-2009-winter/fran.pdf). Being the first FRP framework, Fran is often referred to as classic functional reactive programming (Classic FRP). It provided a basis for future research into (functional) reactive programming by creating the notion of events and behaviors.

**Warning**: FRP is very closely related to Haskell and this section contains some notation that might look unfamiliar. If you want something practical to use in your next web/mobile project, skip this section and head to [Reactive Extensions](rx.html).

## Abstractions

In FRP two reactive data types existed: Events and Behaviors. Events represent a sequence of discrete timestamped values, for example mouse clicks. 

`Events α = [(Time, α)]`

Behaviors, on the contrary, are continuous and time-varying values. For example analog position, velocity or acceleration, the temperature, or time itself, are behaviors. At any given (valid) time a value exists. They can be represented as a function from time to a value:

`Behavior α = Time → α`

There exists an isomorphism between Events and Behaviors, as shown by [Wan et al, 2001](http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.63.4658&rep=rep1&type=pdf), converting from discrete to continuous time. At each point in time there is either some event or there is no event:

`Event α ≈ Behavior ( Option α )`

Here Option is an abstract data type, being either Some α or None. This isomorphism simplifies the semantics: we can now represent both behaviors and events in a common data type. Wan et al. call this a Signal:

`Signal α = Time → α`

The isomorphism holds two ways, when viewed from a more practical viewpoint. Continuous values, behaviors, when modeled in the computer are really discrete values or samples, so Behaviors are represented as very fast firing Events. There is an actual maximum frequency at which the data is needed, for at least two reasons:

- the input is received only at the sample speed of the sensors and
- the system can only display the results to the screen at a maximum of the refresh rate of the monitor or a given output rate to other outputs.

<script src="workspace/frp-graphs/continuous.discrete.js"></script>

Depending on how the behavior is used, this even allows for some optimization: by not firing an event when the sampled value did not change, we can prevent unnecessary recomputations. When further computations count or average the values this can not be done of course, so in most languages this is an explicit operation, often called `distinct`.

<script src="workspace/frp-graphs/discrete.optimize.js"></script>

Some restrictions on this isomorphism have to be regarded however, as one can express behaviors that are hard or impossible to convert to deterministic events. Sometimes these difficulties are solved by increasing the sampling rate, like with integrals. Languages like Fran allow for behaviors like `integrate` which apply mathematical integration to a function. These behaviors can be approximated with sampling rates going to zero. Examples of impossibly convertible behaviors are `sharp`, [Zeno's paradox](https://en.wikipedia.org/wiki/Zeno%27s_paradoxes), and `unpredictable`. These examples share the feature that frequency and sampling rate play an important role which is hard to express semantically, and thus are described as non-terminating or erroring by [Wan et al.]()

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
