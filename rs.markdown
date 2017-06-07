---
layout: default
title:  "Reactive Streams"
date:   2017-05-27 22:10:09 +0200
categories: frp
weight: 40
---

# Reactive Streams
[Reactive Streams (RS)](http://www.reactive-streams.org) is not one library or framework, but instead it is a single API implemented by many libraries and frameworks on the JVM. The promise is that all those libraries and frameworks can work together in a single application. The interface looks like this:

```java
interface Publisher<T> { // Other name for Observable
	void subscribe(Subscriber<? super T> s);
}
interface Subscriber<T> { // Other name for Observer
	onNext(T t);
	onError(java.lang.Throwable t);
	onComplete();
	onSubscribe(Subscription s);
}
interface Subscription {
	cancel();
	request(long n);
}
interface Processor<T,R> extends Subscriber<T>, Publisher<R>
```

Compared to Rx this essentially adds the `request` method. This is what is used to implement backpressure. On top of the interfaces RS also dictates [43 rules](https://github.com/reactive-streams/reactive-streams-jvm/blob/v1.0.0/README.md#specification) to keep in mind when creating custom implementations of above interfaces.

## Backpressure
The distinguishing feature between the original Rx and Reactive Streams is backpressure. The concept is simple: only send events if the destination requested them. This sounds weird, as the source did subscribe so why not send it straight away? The reasoning is that Subscribers might be slower in processing than Publishers produce. By making that effect explicit the problem of overproduction becomes a problem of the Producer instead of the Subscriber. 

### Use cases for backpressure
When creating a highly concurrent system bound by network traffic backpressure makes sense: we can not use unbounded buffers or block the thread in order to deliver all messages to slow consumers. In fact TCP's buffer windows maps right onto the request call: when the buffer window has room for more data we can request more data upstream.

### Alternatives for backpressure
Backpressure is a trade-off between being purely reactive versus practical, recall:

> Reactive programs continuously interact with their environment, at a **speed determined by the environment instead** of the program itself - Gerard Berry

Some consider the chosen trade-off to be wrong. Consider the example of mouse clicks: how would we apply backpressure to this source? We cannot prevent the mouse from moving. By requiring backpressure as part of the specification, we basically degraded Reactive Streams to an async pull library instead of a fully reactive push-based library.

The argument for practical usage is not strong as it can be shown that there are different mechanisms to deal with fast producers. One solution is simply throttling or sampling the producer dropping values that we cant handle. Another solution is buffering the events until we do have time to process them. These two solutions do not require global back-pressure, but only require a single operator where we expect fast producers.

A more advanced solution comes from the Systems & Control field: feedback control systems. Using a feedback control we can handle a fast producer in a dynamic way. Measuring the speed at which the rest of the system handles events and use that dynamic measure to feed more or less events to the system in the next iteration. By placing this feedback controller close to the producer the the system does not need to implement backpressure. Without backpressure the internals of the library can be simplified substantially. For more information about using feedback control in Reactive Programming I refer to the [Feedback on Backpressure](https://repository.tudelft.nl/islandora/object/uuid:ebba15d9-71ac-42c3-89f7-221c6604828c/datastream/OBJ/download) thesis of Richard van Heest and the library [feedback4s](https://github.com/rvanheest/feedback4s).

While the critique against backpressure is fundamental, its added complexity mostly manifests only inside Rx libraries. From the view of the developer often it seems like nothing is changed compared to the situation without backpressure. And effectively - if we just `request(Long.MAX_VALUE)` all the time - there is no difference.

## Implementations
Several libraries provide implementations for the RS interfaces. The most notable examples are RxJava and Project Reactor and Akka. The types provided by these libraries have many operators available.

- [RxJava](https://github.com/ReactiveX/RxJava) through the `Flowable`-type
- [Project Reactor](http://projectreactor.io/)
- [Akka](http://akka.io/) Streams
- [Java 9 Flow API](https://community.oracle.com/docs/DOC-1006738)

### RxJava
Originally Rx did not implement RS. In version 1 backpressure was retrofitted into Observable, a decision which was reverted in RxJava 2. Version 2 has the following types:

| Type / doc | Description |
|------ |-----|
| [Flowable](http://reactivex.io/RxJava/2.x/javadoc/io/reactivex/Flowable.html) | 0..N flows, with RS & backpressure |
| [Observable](http://reactivex.io/RxJava/2.x/javadoc/io/reactivex/Observable.html) | 0..N flows, no backpressure |
| [Single](http://reactivex.io/RxJava/2.x/javadoc/io/reactivex/Single.html) | flow of 1 item or error |
| [Completable](http://reactivex.io/RxJava/2.x/javadoc/io/reactivex/Completable.html) | only error or complete |
| [Maybe](http://reactivex.io/RxJava/2.x/javadoc/io/reactivex/Maybe.html) | 0 or 1 items, or an error |

Using conversion methods we can convert Observables (and equally Singles, Completables and Maybes) to RS Publishers:

```java
// From RS, to Observable
Flowable.just(1).toObservable()

// From Observable to RS
Observable.just(1).toFlowable(BackpressureStrategy.DROP)
Single.just(1).toFlowable() // no strategy required
```

RxJava is part of the Reactive Extensions family and the operators are very much the same. Go back to [Reactive Streams](rx.html) for more examples.

### Project Reactor
Reactor is very much like RxJava, and in fact they share a lot of operators. Operators added to one eventually ended up in the other as well. The `Flux` and `Mono` types are the types that represent data flows in Reactor. Flux is the 0..N flow variant, while Mono contains at most 1 item and thus is a combination of RxJava's Single, Maybe and Completable in one type. Reactor uses Java 8 (rather than RxJava targetting Java 6) which allows it to use lambda's natively instead of requiring the polyfills that RxJava needs to ship.

The example below shows some of the overlap with the RxJava API:

```java
@Test
public void indexUniqueLetters() {
  Flux<String> letters = Flux
        .fromIterable(Arrays.asList("the", "quick", "brown", "fox"))
        .flatMap(word -> Flux.fromArray(word.split("")))
        .distinct()
        .sort()
        .zipWith(Flux.range(1, Integer.MAX_VALUE),
                 (string, count) -> String.format("%2d. %s", count, string));

  letters.subscribe(System.out::println);
}
```

A good source to learn Reactor is [InfoQ's Reactor by Example](https://www.infoq.com/articles/reactor-by-example) series.

### Akka Streams
We know Akka to be an Actor System suited for distributed applications. The Akka Streams subproject adds general streaming capabilities. Akka Streams uses no Reactive Streams internally but rather it can consume or publish to Reactive Streams. At the core of Akka Streams we have `Source`'s, `Flow`'s and `Sink`'s. Sources produce data, Sinks consume data and Flows we place in between to transform the data.

```[ Source ] => [ Flow ] => [ Sink ]```

After bootstrapping the complete data flow you need to `run` it with an `ActorSystem` and a `Materializer`. This causes the flow to run on whatever distributed cluster is configured or just locally if no custom configuration is provided.

Using the following methods we can [interop between RS and Akka](http://doc.akka.io/docs/akka/current/scala/stream/stream-integrations.html#integrating-with-reactive-streams):

```scala
Source.fromPublisher<T>(publisher: Publisher<T>)
```
and 
```scala
Sink.fromSubscriber<T>(subscriber: Subscriber<T>)
```

The third way materializes an Akka flow to a Publisher using `Sink.asPublisher()`, an example:

```scala
import org.reactivestreams.Publisher
import org.reactivestreams.Subscriber

def tweets: Publisher[Tweet]
def storage: Subscriber[Author]

val authors = Flow[Tweet]
  .filter(_.hashtags.contains(akkaTag))
  .map(_.author)

val authorPublisher: Publisher[Author] =
  Source.fromPublisher(tweets)
        .via(authors)
        .runWith(Sink.asPublisher(fanout = false))

authorPublisher.subscribe()
```

### Java Flow
While complying with the RS specification Java's Flow does only that, it does not provide chaining operators but requires manual wiring of Producers, Processors and Subscribers using `subscribe`. For more detail, David Karnok provides a [guide to create Producers using the Flow interfaces](http://akarnokd.blogspot.nl/2017/03/java-9-flow-api-asynchronous-integer.html). While Java Flow's implementation is not very exiting, the fact that RS is now incorporated in the JVM is. We can now expect many more libraries and drivers implementing RS in one way or another.

### Libraries & Drivers
Some libraries that offer Producers or Subscribers are listed below. The list is not exhaustive and will grow especially when Java Flow will land in Java 9.

- [Ratpack](https://ratpack.io/): webapplication framework
- [MongoDB](https://mongodb.github.io/mongo-java-driver-reactivestreams/): driver for MongoDB
- [Reactive Rabbit](https://github.com/ScalaConsultants/reactive-rabbit): driver for RabbitMQ
- [Reactive Kafka](https://github.com/akka/reactive-kafka): driver for Kafka
- many other libraries

Often one would want to integrate such libraries using either RxJava, Akka or Project Reactor. As an example consider [this sample](https://github.com/ScalaConsultants/reactive-rabbit#example) of using Reactive Rabbit with Akka.  

```scala
import akka.actor.ActorSystem
import akka.stream.ActorMaterializer
import akka.stream.scaladsl.{Sink, Source}
import io.scalac.amqp.Connection

// streaming invoices to Accounting Department
val connection = Connection()
// create org.reactivestreams.Publisher
val queue = connection.consume(queue = "invoices")
// create org.reactivestreams.Subscriber
val exchange = connection.publish(exchange = "accounting_department",
  routingKey = "invoices")

implicit val system = ActorSystem()
implicit val mat = ActorMaterializer()
// Run akka-streams with queue as Source and exchange as Sink
Source.fromPublisher(queue).map(_.message).runWith(Sink.fromSubscriber(exchange))
```

The last line shows how the `queue` Producer from Rabbit is converted into an Akka Source and further processed (`map`) until the data leaves the realm of Akka through the Sink created from the Rabbit `exchange` Subscriber.

## All together
As discussed, the RS library makes it possible to wire flows from Rx, Akka and Reactor together. [This example](https://github.com/rkuhn/ReactiveStreamsInterop/blob/7124906fb50f9a91cee4e8d58c00853898eed239/src/main/scala/com/rolandkuhn/rsinterop/ScalaMain.scala) shows how to create a Rx => Akka => Reactor stream and how use use this from the Ratpack webapplicaton framework.

<script src="http://gist-it.appspot.com/http://github.com/rkuhn/ReactiveStreamsInterop/blob/7124906fb50f9a91cee4e8d58c00853898eed239/src/main/scala/com/rolandkuhn/rsinterop/ScalaMain.scala"></script>

## Conclusion
Many different libraries for the JVM exist that all talk using the same API, Reactive Streams. This is convenient for Java and Scala developers writing reactive programs, as they can use all sorts of external systems (ao RabbitMQ, Mongo, Kafka, etc.) as "inputs from the environment". Though it does not mean that our applications are automatically "Reactive" if we use one of the Reactive Streams libraries.

[Continue with Cycle.js](cycle.html)
