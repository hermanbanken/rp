---
layout: default
title:  "Reactive Extensions"
date:   2017-05-27 22:10:09 +0200
categories: rp
weight: 3
---

# Reactive Extensions 

Reactive Extensions (Rx) was created at Microsoft to provide a reactive extension library to normal programming languages. The first available implementation was Rx.NET for C#. Later a family of libraries for many languages (ao Java, Scala, JavaScript, Swift, Kotlin, [full list](http://reactivex.io/languages.html)) were created under the name ReactiveX, now mostly coordinated by Netflix.

Rx is build to fill the gap in the following [table](http://reactivex.io/intro.html):
	
|               |	single item           |	multiple items				    |
| synchronous   |	`T getData()`         |	`Iterable<T> getData()`  	|
| asynchronous  |	`Future<T> getData()` |	`?`												|

It deals with multiple items in an asynchronous fashion, using the `Observable`, filling the gap in the table with `Observable<T> getData()` If you have ever worked with Futures/Promises or with modern collections (with map, filter, etc.) you will see some common concepts in Observables. Basically Rx is two things:

- the Observable/Observer interfaces, the dual of Iterable/Iterator
- a very powerful API built on top

In the remainder of this article we will first explain how that duality works, and then provide some examples to get you up to speed.

## Duality
In mathematics the concept of _duality_ is a very powerful tool, often used to solve a problem in a different way. This example of using duality is one that you probably know of:

```javascript
!(a && b) == !a || !b
!(a || b) == !a && !b
```

Developers use these rules often to simplify if-statements, and it makes sense intuitively. But to prove that this holds De Morgan used the duality between conjunction (`&&`) and disjunction (`||`) to prove that the negation (`!`) distributes over conjunction and disjunction. Many other dualities are used in programming, and you might have been using them without knowing.

So how does this relate to Reactive Programming? Lets take a look at the Iterable and Iterator pair of interfaces:

```scala
trait Iteratable<T> {
  def iterator(): Iterator<T> 
}
trait Iteratable<T> {
	def hasNext(): boolean
	def next(): T // can throw an Exception
}
```

The Iterable interface is some sort of factory for creating Iterators, which we can ask whether a next value exists with `hasNext` and if it is available retrieve it using `next`. Lets take a look at how the following `moveNext` method that does the same as aboves `hasNext` and `next` combined. The Option encodes what `hasNext` did before and the throwing of `next` is also made explicit.

```scala
trait Iteratable<T> {
	def moveNext(): Either[Exception,Option[T]]
}
```

Now `moveNext` is simply a getter of some type `Either[Exception,Option[T]]`, which we will alias as `A`, and Iterable gets that getter. So we can abbreviate this to this Haskell-like type:

```
() -> (() -> A)
```

Dualizing is just another word for reversing the arrows. The result is that our getters become setters.

```
() <- (() <- A)  
// tidying up by reading from right to left
((A -> ()) -> ()
```

Here you pass a method that wants to receive an `A` to a method that will then somewhere in the future callback your method when a new element is available. If we convert this back to language like Scala we get our Observable and Observer types. The callback is implemented by the Observer, which we give to the `subscribe` method.

```scala
trait Observable<T> {
  def subscribe(observer: Observer<T>): Unit 
}
trait Observer<T> {
  def next(a: Either[Exception,Option[T]]): Unit
}
```

The `next` method is not really practical, so lets split that out.

```scala
trait Observable<T> {
  def subscribe(observer: Observer<T>): Unit 
}
trait Observer<T> {
  def next(t: T): Unit
  def error(error: Exception): Unit
  def complete(): Unit
}
```

And voilà, this are the Rx types (leaving subscriptions out for simplicities sake).

## Examples