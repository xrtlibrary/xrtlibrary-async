# XRTLibrary-Async

## Introduction

This library contains several asynchronous mechanism implementations which can help you write complex JavaScript asynchronous programs.

<u>Available features</u>:
 - An advanced *Promise.race()* which also returns the associated Promise object.
 - Asynchronous queue.
 - Deferred-style conditional synchronizers.
 - Asynchronous semaphore.
 - Asynchronous lock.

<u>Deprecated features</u>:
 - Asynchronous program flows (which can be replaced by *async/await*).

## Installation

To install this package, you can use NPM by typing following command:

```
npm install xrtlibrary-async --save
```

Then you can import this library in your JavaScript code:

```
var XRTLibAsync = require("xrtlibrary-async");
```

## Examples

Download this package and see the "examples" directory.

## API

### (Module) Asynchronize.Loop (<u>Deprecated</u>)

<u>Introduction</u>:
This module contains several functions that can help you create asynchronous program flows, including:

 - for statement.
 - while statement.
 - do...while statement.

<u>Warning(s)</u>:
 - This module has been deprecated.
 - The existence of this module is ONLY for compatible. You shall NOT use any API of this module in new application.
 - Use JavaScript's native *async/await* mechanism to replace this module.

#### RunAsynchronousLoop(fn)

Run a loop asynchronously.

<u>Parameter(s)</u>:
 - fn (*() => Promise*): The loop function.

<u>Return value</u>:
 - (*Promise*) The promise object.

<u>Example</u>:
```
var counter = 0;
XRTLibAsync.Asynchronize.Loop.RunAsynchronousLoop(function() {
    console.log(++counter);
    return XRTLibAsync.Asynchronize.Timeout.CreateTimeoutPromise(1000);
});
//  Output (1000ms per line):
//    1
//    2
//    3
//    ...
```

Equivalent using *async/await*:

````
var counter = 0;
while(true) {
    console.log(++counter);
    await XRTLibAsync.Asynchronize.Timeout.CreateTimeoutPromise(1000);
}
````

#### RunAsynchronousForNext(fnCondition, fnNext, fnBody)

Run a for-next statement asynchronously.

<u>Parameter(s)</u>:
 - fnCondition (*() => Boolean*): The condition function.
 - fnNext (*() => void*): The next function.
 - fnBody (*() => Promise*): The body function.

<u>Return value</u>:
 - (*Promise*) The promise object.

<u>Example</u>:
```
var i = 1;
XRTLibAsync.Asynchronize.Loop.RunAsynchronousForNext(
    function() {
        return i <= 3;
    },
    function() {
        ++i;
    },
    function() {
        console.log(i);
        return XRTLibAsync.Asynchronize.Timeout.CreateTimeoutPromise(1000);
    }
);
//  Output (1000ms per line):
//    1
//    2
//    3
```

Equivalent using *async/await*:

```
for (var i = 1; i <= 3; ++i) {
    console.log(i);
    await XRTLibAsync.Asynchronize.Timeout.CreateTimeoutPromise(1000);
}
```

#### RunAsynchronousDoWhile(fnCondition, fnBody)

Run a do-while statement asynchronously.

<u>Parameter(s)</u>:
 - fnCondition (*() => Boolean*): The condition function.
 - fnBody (*() => Promise*): The body function.

<u>Return value</u>:
 - (*Promise*) The promise object.

<u>Example</u>:
```
var i = 1;
XRTLibAsync.Asynchronize.Loop.RunAsynchronousDoWhile(
    function() {
        return i < 1;
    },
    function() {
        console.log(i);
        return XRTLibAsync.Asynchronize.Timeout.CreateTimeoutPromise(1000);
    }
);
//  Output:
//    1
```

Equivalent using *async/await*:

```
var i = 1;
do {
    console.log(i);
    await XRTLibAsync.Asynchronize.Timeout.CreateTimeoutPromise(1000);
} while(i < 1);
```

### (Module) Asynchronize.Waterfall (<u>Deprecated</u>)

<u>Introduction</u>:
This module contains a helper function that can help you create generic asynchronous waterfall program flows.

<u>Warning(s)</u>:
 - This module has been deprecated.
 - The existence of this module is ONLY for compatible. You shall NOT use any API of this module in new application.
 - Use JavaScript's native async/await mechanism to replace this module.

#### CreateWaterfallPromise(tasks, [strictMode])

Create a waterfall promise.

<u>Parameter(s)</u>:
 - tasks (*(() => Promise)[]*): The tasks.
 - strictMode (*Boolean*): True if a task function must return with a Promise object.

<u>Return value</u>:
 - The waterfall promise (resolve with the the value of the lastest task).

<u>Example</u>:
```
XRTLibAsync.Asynchronize.Waterfall.CreateWaterfallPromise([
    function() {
        console.log("Hello!");
        return XRTLibAsync.Asynchronize.Timeout.CreateTimeoutPromise(1000);
    },
    function() {
        console.log("World!");
        return Promise.resolve();
    }
]);
//  Output:
//    Hello!
//    World!  (1000ms later)
```

Equivalent using *async/await*:

```
console.log("Hello!");
await XRTLibAsync.Asynchronize.Timeout.CreateTimeoutPromise(1000);
console.log("World!");
```

### (Module) Asynchronize.Preempt

<u>Introduction</u>:
The function that this module provides is similar to *Promise.race()*. But instead of returning the resolved value only, this module also gives the Promise object so that you can know which asynchronous task finishs the first.

#### (Class) PreemptResolve

Preempt resolve container.

##### preemptrsv.getValue()

Get the value.

<u>Return value</u>:
 - (*) The value.

##### preemptrsv.getPromiseObject()

Get the promise object.

<u>Return value</u>:
 - (Promise) The promise object.

#### (Class) PreemptReject

Preempt reject container.

##### preemptrej.getReason()

Get the reason.

<u>Return value</u>:
 - (*) The reason.

##### preemptrej.getPromiseObject()

Get the promise object.

<u>Return value</u>:
 - (Promise) The promise object.

#### CreatePreemptivePromise(tasks)

Create a preemptive promise (the first completed task will take over the promise).

<u>Note(s)</u>:
 - Generally, when more than one tasks are in settled states, the task which has the smallest index in tasks array would be returned. But you shall **NOT** rely on this (this behavior may changes in future releases of this library.).
 - If the returned promise object rejects, an instance of *PreemptReject* class would be provided as the reject reason.

<u>Parameter(s)</u>:
 - tasks (*Promise[]*): The tasks.

<u>Return value</u>:
 - (*Promise&lt;PreemptResolve&gt;*) The promise object.

<u>Example</u>:
```
var p1 = XRTLibAsync.Asynchronize.Timeout.CreateTimeoutPromise(100);    //  This promise object resolves after 100ms.
var p2 = XRTLibAsync.Asynchronize.Timeout.CreateTimeoutPromise(500);    //  This promise object resolves after 500ms.
var p3 = XRTLibAsync.Asynchronize.Timeout.CreateTimeoutPromise(1000);   //  This promise object resolves after 1000ms.
var rsv = await XRTLibAsync.Asynchronize.Preempt.CreatePreemptivePromise([p1, p2, p3]);
var p = rsv.getPromiseObject();
if (p == p1) {
	console.log("Promise 1 preempted!");
} else if (p == p2) {
	console.log("Promise 2 preempted!");
} else if (p == p3) {
	console.log("Promise 3 preempted!");
} else {
    throw new Error("Unreachable.");
}
//  Output:
//    Promise 1 preempted!
```

### (Module) Asynchronize.Timeout

<u>Introduction</u>:
This module implements asynchronous delay functions.

#### (Class) TimeoutPromiseError

Timeout promise error.

<u>Extend(s)</u>:
 - *Error*

#### (Class) TimeoutPromiseOperationCancelledError

Timeout promise operation cancelled error.

<u>Extend(s)</u>:
 - *TimeoutPromiseError*

#### CreateTimeoutPromise(timespan, [value])

Create a timeout promise which resolves after specific duration (timespan).

<u>Parameter(s)</u>:
 - timespan (*Number*): The duration (timespan, unit: milliseconds).
 - value (*): (Optional) The resolve value (default = null).

<u>Return value</u>:
 - (*Promise*) The promise object (resolves when timeouted, never rejects).

<u>Example</u>:
```
console.log("Hello!");
console.log(await XRTLibAsync.Asynchronize.Timeout.CreateTimeoutPromise(1000, "World!");
//  Output:
//    Hello!
//    World!  (1000ms later)
```

#### CreateTimeoutPromiseEx(timespan, cancellator, [value])

Create a timeout promise which resolves after specific duration (timespan) with a cancellable mechanism.

<u>Exception(s)</u>:
 - *TimeoutPromiseOperationCancelledError*: Raised when the cancellator was activated.

<u>Parameter(s)</u>:
 - timespan (*Number*): The duration (timespan, unit: milliseconds).
 - cancellator (*Synchronize.Conditional.ConditionalSynchronizer*): The cancellator.
 - value (*): (Optional) The resolve value (default = null).

<u>Return value</u>:
 - (*Promise*) The promise object (resolves when timeouted, rejects if error occurred).

<u>Example</u>:
```
var cancellator = new XRTLibAsync.Synchronize.Conditional.ConditionalSynchronizer();
XRTLibAsync.Asynchronize.Timeout.CreateTimeoutPromiseEx(5000, cancellator).then(function() {
    throw new Error("Unreachable.");
}).catch(function(error) {
    if (error instanceof XRTLibAsync.Asynchronize.Timeout.TimeoutPromiseOperationCancelledError) {
        console.log("Timeout timer has been cancelled.");
    } else {
        throw error;
    }
});
//  Cancel after 1000ms.
setTimeout(function() {
    cancellator.fullfill();
}, 1000);
//  Output:
//    Timeout timer has been cancelled.  (1000ms after startup)
```

### (Module) Event

<u>Introduction</u>:
This module implements several functions that helps you handle events.

#### (Class) EventWaiterError

Event waiter error.

<u>Extend(s)</u>:
 - *Error*

#### (Class) EventWaiterOperationCancelledError

Event waiter operation cancelled error.

<u>Extend(s)</u>:
 - *EventWaiterError*

#### WaitEvent(handler, name, [cancellator])

Wait for an event.

<u>Exception(s)</u>:
 - *EventWaiterOperationCancelledError* - Raised when the cancellator was activated.

<u>Parameter(s)</u>:
 - handler (*EventEmitter*): The event handler.
 - name (*String*): The event name.
 - cancellator (*Synchronize.Conditional.ConditionalSynchronizer*): (Optional) The cancellator.

<u>Return value</u>:
 - (*Promise&lt;Array&gt;*) The promise object (resolves with the event arguments if succeed, rejects if error occurred).

<u>Example</u>:
```
var server = net.createServer();
var listenWaitHandler = XRTLibAsync.Event.WaitEvent(server, "listening");
server.listen(8080);
await listenWaitHandler;
console.log("Server listened!");
```

```
var server = net.createServer();
var cts = new XRTLibAsync.Synchronize.Conditional.ConditionalSynchronizer();
var wh1 = XRTLibAsync.Event.WaitEvent(server, "listening", cts);
var wh2 = XRTLibAsync.Event.WaitEvent(server, "error", cts);
server.listen(8080);
var rsv = await XRTLibAsync.Asynchronize.Preempt.CreatePreemptivePromise([wh1, wh2]);
cts.fullfill();
var wh = rsv.getPromiseObject();
if (wh == wh1) {
    console.log("Server listened!");
    //  Handle connections here.
} else if (wh == wh2) {
    console.log("Unable to bind!");
    server.close();
    //  Handle server close here.
} else {
    throw new Error("Unreachable.");
}
```

### (Module) Promise

<u>Introduction</u>:
This module implements several data structures that are related to JavaScript's promise mechanism.

#### (Constant) PROMISEQUEUEOP_PUSH

Indicates a push (*put()*) operation to a PromiseQueue object.

#### (Constant) PROMISEQUEUEOP_POP

Indicates a pop (*get()* and *getSync()*) operation to a PromiseQueue object.

#### (Class) PromiseWrapper&lt;T&gt;

Promise context wrapper.

##### new PromiseWrapper(resolve, reject)

Constructs an object.

<u>Parameter(s)</u>:
 - resolve (*(value: T) => void*): The resolve function.
 - reject (*(reason: *) => void*): The reject function.

##### pw.getResolveFunction()

Get the resolve function.

<u>Return value</u>:
 - (*(value: T) => void*): The resolve function.

##### pw.getRejectFunction()

<u>Return value</u>:
 - (*(reason: *) => void*): The reject function.

#### (Class) PromiseQueue&lt;T&gt;

Promise queue.

<u>Extend(s)</u>:
 - EventEmitter

##### (Event) 'change'

Promise queue change event.

<u>Note(s)</u>:
 - This event would only be emitted when the count of pending items were changed.
 - This event wouldn't be emitted if you put an item and there is already some *get()* operations in waiting (In this situation, the waiting *get()* operation would be answered with the item immediately instead of inserting the item to the pending items queue).

<u>Parameter(s)</u>:
 - type (*Number*): The action type (one of *PROMISEQUEUEOP_\**).
 - item (*): The item related to the action.

##### pq.put(item)

Put an item to the queue.

<u>Parameter(s)</u>:
 - item (*T*): The item.

##### pq.get([cancellator])

Get an item from the queue.

<u>Exception(s)</u>:
 - *PromiseQueue.OperationCancelledError*: Raised when the cancellator was activated.

<u>Parameter(s)</u>:
 - cancellator (*Synchronize.Conditional.ConditionalSynchronizer*): (Optional) The cancellator.

<u>Return value</u>:
 - (*Promise&lt;T&gt;*) The promise object (resolves with the item if succeed, rejects if error occurred).

<u>Example</u>:
```
var queue = new XRTLibAsync.Promise.PromiseQueue();
(async function() {
    console.log(await queue.get());
})();
(async function() {
    for (var i = 1; i <= 5; ++i) {
        queue.put(i);
        await XRTLibAsync.Asynchronize.Timeout.CreateTimeoutPromise(1000);
    }
})();
```

##### pq.getSync()

Get an item from the queue synchronously.

<u>Note(s)</u>:
 - An error will be thrown if the queue has no item.
 - It highly **NOT** recommended to use this method with both *wait()* and *clear()* method.

<u>Exception(s)</u>:
 - *PromiseQueue:InvalidOperationError*: Raised when this queue is empty.

<u>Return value</u>:
 - (*T*) The item.

##### pq.getLength()

Get the count of in-queue items (queue length).

<u>Return value</u>:
 - (*Number*) The item count.

##### pq.wait([cancellator])

Wait for an item to be available.

<u>Parameter(s)</u>:
 - cancellator (*Synchronize.Conditional.ConditionalSynchronizer*): (Optional) The cancellator.

<u>Return value</u>:
 - The promise object (resolves when available, rejects if error occurred).

##### pq.clear()

Clear all in-queue items.

#### (Class) PromiseQueue.Error

Promise queue error.

<u>Extend(s)</u>:
 - *Error*

#### (Class) PromiseQueue.OperationCancelledError

Promise queue operation cancelled error.

<u>Extend(s)</u>:
 - *PromiseQueue.Error*

#### (Class) PromiseQueue.InvalidOperationError

Promise queue invalid operation error.

<u>Extend(s)</u>:
 - *PromiseQueue.Error*

#### (Class) PromiseQueue2&lt;T&gt;

Promise queue (version 2).

<u>Extend(s)</u>:
 - EventEmitter

##### (Constant) PromiseQueue2.CHANGETYPE_PUSH

Indicates a push (*push()*) operation.

##### (Constant) PromiseQueue2.CHANGETYPE_POP

Indicates a pop (*pop()* and *popWithReceipt()*) operation.

##### (Constant) PromiseQueue2.CHANGETYPE_UNPOP

Indicates an unpop (*unpop()*) operation.

##### (Event) 'change'

Promise queue change event.

<u>Note(s)</u>:
 - This event would only be emitted when the count of pending items were changed.

<u>Parameter(s)</u>:
 - type (*Number*): The action type (one of *PromiseQueue2.CHANGETYPE_\**).
 - item (*): The item related to the action.

##### (Property) pq2.length (*readonly*)

The count of queued items.

Exception(s):
 - *PromiseQueue.InvalidOperationError*: Raised when tries to assign value to this property.

##### pq2.isWaitingForReceipt()

Get whether this object is waiting for a receipt.

<u>Return value</u>:
 - True if so.

##### pq2.pop([cancellator])

Pop an item asynchronously.

<u>Exception(s)</u>:
 - *PromiseQueue.OperationCancelledError*: Raised when the cancellator was activated.

<u>Parameter(s)</u>:
 - cancellator (*Synchronize.Conditional.ConditionalSynchronizer*): (Optional) The cancellator.

<u>Return value</u>:
 - (*Promise&lt;T&gt;*) The promise object (resolves with the item when succeed, rejects when error occurred).

##### pq2.popWithReceipt(receipt, [cancellator])
       
Pop an item asynchronously with receipt mechanism.

<u>Exception(s)</u>:
 - PromiseQueue.OperationCancelledError: Raised when the cancellator was activated.

<u>Parameter(s)</u>:
 - receipt (?*PromiseQueue2.Receipt*): The receipt (*NULL* if not set).
 - cancellator (*Synchronize.Conditional.ConditionalSynchronizer*): (Optional) The cancellator.

<u>Return value</u>:
 - (*Promise&lt;T&gt;*) The promise object (resolves with the item when succeed, rejects when error occurred).

<u>Example</u>:
```
var queue = new XRTLibAsync.Promise.PromiseQueue2();

async function RunWorker(workerId) {
    while(true) {
        var receipt = new XRTLibAsync.Promise.PromiseQueue2.Receipt();
        var task = await queue.popWithReceipt(receipt);
        if (task === null) {
            console.log("Worker " + workerId.toString() + " ended.");
            receipt.getDeclineSynchronizer().fullfill();  //  Reject the popped item (the item would be unpopped to the queue).
            break;
        } else {
    	    console.log("Worker " + workerId.toString() + ", task " + task.toString());
    	    receipt.getAcceptSynchronizer().fullfill();   //  Accept the popped item.
    	    await XRTLibAsync.Asynchronize.Timeout.CreateTimeoutPromise(1000 * Math.random());
        }
    }
}

//  Run workers.
RunWorker(1);
RunWorker(2);

//  Add tasks.
function (var i = 1; i <= 100; ++i) {
    queue.push(i);
}
queue.push(null);
```

##### pq2.unpop(item)

Unpop an item.

<u>Note(s)</u>:
 - This method can't be called when this object is waiting for a receipt.

<u>Exception(s)</u>:
 - *PromiseQueue.InvalidOperationError*: Raised this object is still waiting for a receipt.

<u>Parameter(s)</u>:
 - item (*T*) - The item.

##### pq2.push(item)

Push an item.

<u>Parameter(s)</u>:
 - item (*T*) - The item.

##### pq2.clear()

Clear all items.

#### (Class) PromiseQueue2.Receipt

Promise queue receipt.

##### receipt.getAcceptSynchronizer()

Get the decline synchronizer.

<u>Return value</u>:
 - (*Synchronize.Conditional.ConditionalSynchronizer*) The synchronizer.

##### receipt.getDeclineSynchronizer()

Get the accept synchronizer.

<u>Return value</u>:
 - (*Synchronize.Conditional.ConditionalSynchronizer*) The synchronizer.

##### receipt.getReceiptAcknowledgeSynchronizer()

Get the receipt acknowledge.

<u>Return value</u>:
 - (*Synchronize.Conditional.ConditionalSynchronizer*) The synchronizer.

#### (Class) PromiseQueue2.Error

Promise queue error.

<u>Extend(s)</u>:
 - Error

#### (Class) PromiseQueue2.OperationCancelledError

Promise queue operation cancelled error.

<u>Extend(s)</u>:
 - PromiseQueue2.Error

### (Module) Synchronize.Conditional

<u>Introduction</u>:
This module implements deferred-style conditional synchronizers.

#### (Class) ConditionalSynchronizer&lt;T&gt;

Conditional-based synchronizer.

##### ConditionalSynchronizer.waitAll(synchronizers)

Wait for all conditional synchronizers to be fullfilled.

<u>Parameter(s)</u>:
 - synchronizers (*ConditionalSynchronizer[]*): The synchronizers.

<u>Return value</u>:
 - (*Promise&lt;Array&gt;*) The promise object (resolves with fullfill values of the synchronizers).

##### ConditionalSynchronizer.waitAllWithCancellator(synchronizers, cancellator)

Wait for all conditional synchronizers to be fullfilled with a cancellable mechanism.

<u>Exception(s)</u>:
 - ConditionalSynchronizer.OperationCancelledError: Raised when the the cancellator was activated.

<u>Parameter(s)</u>:
 - synchronizers (*ConditionalSynchronizer[]*): The synchronizers.
 - cancellator (*ConditionalSynchronizer*): The cancellator.

<u>Return value</u>:
 - (*Promise&lt;Array&gt;*) The promise object (resolves with fullfill values of the synchronizers, reject if cancelled).

##### new ConditionalSynchronizer()

Construct a new object.

##### cs.wait()

Wait for the condition to be fullfilled.

<u>Return value</u>:
 - (*Promise&lt;T&gt;*) The promise object (never raise error).

<u>Example</u>:
```
//  Tasks context.
var sync = new XRTLibAsync.Synchronize.Conditional.ConditionalSynchronizer();

//  In one task:
(async function() {
    console.log(await sync.wait());
})();

//  In another task:
(async function() {
    console.log("Hello world!");
	sync.fullfill("Javascript");
})();

//  Output:
//    Hello world!
//    Javascript
```

##### cs.waitWithCancellator(cancellator)

Wait for the condition to be fullfilled with a cancellable mechanism.

<u>Note(s)</u>:
 - Once you called this method, a wait handle will be allocated inside the cancellator. It's highly recommended to declare the cancellator as a local variable to avoid memory leak.

<u>Exception(s)</u>:
 - *ConditionalSynchronizer.OperationCancelledError*: Raised when the the cancellator was activated.

<u>Parameter(s)</u>:
 - cancellator (*ConditionalSynchronizer*): The cancellator.

<u>Return value</u>:
 - (*Promise&lt;T&gt;*) The promise object (reject when cancelled before fullfilled).

<u>Example</u>:
```
var server = net.createServer();
var syncServerListened = new XRTLibAsync.Synchronize.Conditional.ConditionalSynchronizer();
var syncServerError = new XRTLibAsync.Synchronize.Conditional.ConditionalSynchronizer();
server.on("listening", function() {
    syncServerListened.fullfill(server.address());
});
server.on("error", function(error) {
    syncServerError.fullfill(error);
});
var cts = new XRTLibAsync.Synchronize.Conditional.ConditionalSynchronizer();
var wh1 = syncServerListened.waitWithCancellator(cts);
var wh2 = syncServerError.waitWithCancellator(cts);
server.listen(8080);
var rsv = await XRTLibAsync.Asynchronize.Preempt.CreatePreemptivePromise([wh1, wh2]);
cts.fullfill();  //  Cancel all pending wait handlers.
var wh = rsv.getPromiseObject();
if (wh == wh1) {
    console.log("Server listened!");
    //  Handle connections here.
} else if (wh == wh2) {
    console.log("Unable to bind!");
    server.close();
    //  Handle server close here.
} else {
    throw new Error("Unreachable.");
}
```

##### cs.fullfill([data])

Mark the condition as fullfilled.

<u>Note(s)</u>:
 - If the synchronizer has already been fullfilled, calling to this method would be ignored.

<u>Parameter(s)</u>:
 - data (*T*): The data (default = null).

##### cs.unfullfill()

Mark the condition as unfullfilled.

<u>Note(s)</u>:
 - If the synchronizer is not fullfilled, calling to this method would be ignored.

##### cs.isFullfilled()

Get whether the condition was fullfilled.

<u>Return value</u>:
 - (*Boolean*) True if so.

##### cs.getFullfilledData()

Get the fullfilled data.

<u>Exception(s)</u>:
 - *ConditionalSynchronizer.InvalidOperationError*: Raised when the synchronizer is not fullfilled.

<u>Return value</u>:
 - (*T*) The data.

#### (Class) ConditionalSynchronizer.Error

Conditional synchronizer error.

<u>Extend(s)</u>:
 - *Error*

#### (Class) ConditionalSynchronizer.OperationCancelledError

Conditional synchronizer operation cancelled error.

<u>Extend(s)</u>:
 - *ConditionalSynchronizer.Error*

#### (Class) ConditionalSynchronizer.InvalidOperationError

Conditional synchronizer invalid operation error.

<u>Extend(s)</u>:
 - *ConditionalSynchronizer.Error*

#### (Class) ConditionalSynchronizer.IndexOutOfRangeError

Conditional synchronizer index out of range error.

<u>Extend(s)</u>:
 - *ConditionalSynchronizer.Error*

#### (Class) MultiConditionalSynchronzier&lt;T&gt;

Switchable multi-conditions synchronizer.

##### new MultiConditionalSynchronizer(total, initial, [initialData])

Construct a new object.

<u>Parameter(s)</u>:
 - total (*Number*): The condition count.
 - initial (*Number*): The initial condition index.
 - initialData (*T*): (Optional) The initial promise data (default = null).

##### mcs.wait(index)

Wait for specific condition.

<u>Exception(s)</u>:
 - *ConditionalSynchronizer.IndexOutOfRangeError*: Raised when the index is out of range.

<u>Parameter(s)</u>:
 - index (*Number*): The condition index.

<u>Return value</u>:
 - (*Promise&lt;T&gt;*) The promise object (never raise error).

##### mcs.waitWithCancellator(index, cancellator)

Wait for specific condition with a cancellable mechanism.

<u>Note(s)</u>:
 - Once you called this method, a wait handle will be allocated inside the cancellator. It's highly recommended to declare the cancellator as a local variable to avoid memory leak.

<u>Exception(s)</u>:
 - *ConditionalSynchronizer.IndexOutOfRangeError*: Raised when the index is out of range.
 - *ConditionalSynchronizer.OperationCancelledError*: Raised when the the cancellator was activated.

<u>Parameter(s)</u>:
 - index (*Number*): The condition index.
 - cancellator (*ConditionalSynchronizer*): The cancellator.

<u>Return value</u>:
 - (*Promise&lt;T&gt;*) The promise object (reject when cancelled before fullfilled).

##### mcs.switch(index, data)

Switch to specific condition.

<u>Exception(s)</u>:
 - *ConditionalSynchronizer.IndexOutOfRangeError*: Raised when the index is out of range.

<u>Parameter(s)</u>:
 - index (*Number*): The condition index.
 - data (*T*): The fullfill data (default = null).

##### mcs.getCurrent()

Get current condition.

<u>Return value</u>:
 - (*Number*) The condition index.

##### mcs.getTotal()

Get total conditions.

<u>Return value</u>:
 - (*Number*) The condition count.

#### (Class) AutomateUnlockConditionalSynchronizer&lt;T&gt;

Conditional synchronizer with automatic unlock functionality.

##### new AutomateUnlockConditionalSynchronizer()

Construct a new object.

##### aucs.wait()

Wait for the condition to be fullfilled.

<u>Return value</u>:
 - (*Promise&lt;T&gt;*) The promise object (never raise error).

##### aucs.waitWithCancellator(cancellator)

Wait for the condition to be fullfilled with a cancellable mechanism.

<u>Note(s)</u>:
 - Once you called this method, a wait handle will be allocated inside the cancellator. It's highly recommended to declare the cancellator as a local variable to avoid memory leak.

<u>Exception(s):</u>
 - *ConditionalSynchronizer.OperationCancelledError*: Raised when the the cancellator was activated.

<u>Parameter(s)</u>:
 - cancellator (*ConditionalSynchronizer*): The cancellator.

<u>Return value</u>:
 - (*Promise&lt;T&gt;*) The promise object (reject when cancelled before fullfilled).

##### aucs.fullfill([data])

Mark the condition as fullfilled.

<u>Parameter(s)</u>:
 - data (*T*): The data (default = null).

### (Module) Synchronize.Lock

<u>Introduction</u>:
This module implements asynchronous lock (mutex).

#### (Class) LockSynchronizer

Lock synchronizer.

<u>Note(s)</u>:
 - All lock-acquire request would be queued an processed one-by-one.
 - The order of acquiring the lock depends on the order of lock-acquire operations.
 - The earlier the lock-acquire operation requests, the earlier the lock-acquire operation acquires the lock.
 - The implementation promises that the order of acquiring the lock is highly reliable and the behavior won't be changed in future releases of this library.

##### new LockSynchronizer()

Construct a new object.

##### lock.acquire([cancellator])

Acquire the lock.

<u>Exception(s)</u>:
 - *LockSynchronizer.OperationCancelledError*: Raised when the cancellator was activated.

<u>Parameter(s)</u>:
 - cancellator (*Synchronize.Conditional.ConditionalSynchronizer*): The cancellator.

<u>Return value</u>:
 - (*Promise&lt;Synchronize.Conditional.ConditionalSynchronizer&gt;*) The promise object (release synchronizer will be passed).

<u>Example</u>:
```
//  Tasks context.
var lock = new XRTLibAsync.Synchronize.Lock.LockSynchronizer();

async function RunTask(taskId) {
    //  Acquire the lock.
    var releaser = await lock.acquire();
    console.log("Task " + taskId.toString() + " acquired the lock.");

    //  Do something...
    await XRTLibAsync.Asynchronize.Timeout.CreateTimeoutPromise(1000 * Math.random());

    //  Release the lock.
    console.log("Task " + taskId.toString() + " released the lock.");
    releaser.fullfill();
}

//  Create 10 tasks.
for (var i = 1; i <= 10; ++i) {
    RunTask(i);
}

//  Output:
//    Task 1 acquired the lock.
//    Task 1 released the lock.
//    Task 2 acquired the lock.
//    ...
//    Task 10 released the lock.
```

#### (Class) LockSynchronizer.Error

Lock synchronizer error.

<u>Extend(s)</u>:
 - *Error*

#### (Class) LockSynchronizer.OperationCancelledError

Lock synchronizer operation cancelled error.

<u>Extend(s)</u>:
 - *LockSynchronizer.Error*

### (Module) Synchronize.Notify (<u>deprecated</u>)

<u>Introduction</u>:
This module implements a notification synchronizer.

<u>Warning(s)</u>:
 - This module has been deprecated.
 - The existence of this module is ONLY for compatible. You shall NOT use any API of this module in new application.

#### (Class) NotificationSynchronizer&lt;T&gt;

Notification synchronizer.

##### new NotificationSynchronizer()

Construct a new object.

##### ns.register(cb)

Register a callback.

<u>Parameter(s)</u>:
 - cb (*(value: T) => void*): The callback.

##### ns.unregister(cb)

Unregister a callback.

<u>Parameter(s)</u>:
 - cb (*(value: T) => void*): The callback.

##### ns.notify(...args)

Notify all callbacks.

### (Module) Synchronize.Poll

<u>Introduction</u>:
This module implements a poll-based event waiter.

#### (Class) PollError

Poll error.

<u>Extend(s)</u>:
 - *Error*

#### (Class) PollOperationCancelledError

Poll operation cancelled error.

<u>Extend(s)</u>:
 - *PollError*

#### PollFor(detector, delayMin, delayMax, delayIncreaseRatio, [cancellator])

Poll for a customized condition to be fullfilled.

<u>Parameter(s)</u>:
 - detector (*()=>Boolean*): The condition detector (return True when the condition was fullfilled).
 - delayMin (*Number*): The minimum detect interval (must larger than 0).
 - delayMax (*Number*): The maximum detect interval.
 - delayIncreaseRatio (*Number*): The increase ratio of the detect interval.
 - cancellator (*Synchronize.Conditional.ConditionalSynchronizer*): The cancellator.

<u>Return value</u>:
 - (*Promise*) The promise object (resolves when the condition fullfilled, rejects if the cancellator was activated).

#### PollForEx&lt;T&gt;(detector, resvData, delayMin, delayMax, delayIncreaseRatio, cancellator)

(Extend) Poll for a customized condition to be fullfilled.

<u>Exception(s)</u>:
 - *PollOperationCancelledError*: Raised when the cancellator was activated.

<u>Parameter(s)</u>:
 - detector (*()=>Boolean*): The condition detector (return True when the condition was fullfilled).
 - resvData (*T*): The data passed to Promise.resolve() method.
 - delayMin (*Number*): The minimum detect interval (must larger than 0).
 - delayMax (*Number*): The maximum detect interval.
 - delayIncreaseRatio (*Number*): The increase ratio of the detect interval.
 - cancellator (*Synchronize.Conditional.ConditionalSynchronizer*): The cancellator.

<u>Return value</u>:
 - (*Promise&lt;T&gt;*) The promise object (resolves when the condition fullfilled, rejects if the cancellator was activated).

### (Module) Synchronize.Semaphore

<u>Introduction</u>:
This module implements asynchronous semaphore.

#### (Class) SemaphoreSynchronizer

Semaphore synchronizer.

<u>Note(s)</u>:
 - All P() operations would be queued an processed one-by-one.
 - The order of acquiring the semaphore depends on the order of P() operations.
 - The earlier the P() operation requests, the earlier the P() operation acquires the semaphore.
 - The implementation promises that the order of acquiring the semaphore is highly reliable and won't be changed in future releases of this library.

##### new SemaphoreSynchronizer(initialCount)

Construct a new object.

<u>Parameter(s)</u>:
 - initialCount (*Number*): The initial value of the internal counter.

##### semaphore.wait([cancellator])

Do wait (*P*) operation.

<u>Exception(s)</u>:
 - *SemaphoreSynchronizer.OperationCancelledError*: Raised when the cancellator was activated.

<u>Parameter(s)</u>:
 - cancellator (*Synchronize.Conditional.ConditionalSynchronizer*): The cancellator.

<u>Return value</u>:
 - (*Promise*) The promise object (resolves if acquired successfully, rejects if error occurred).

##### semaphore.signal()

Do signal (*V*) operation.

##### semaphore.getCount()

Get the value of the counter.

<u>Return value</u>:
 - (*Number*) The value.

##### semaphore.isCanAcquireImmediately()

Get whether we can acquire the semaphore without waiting.

<u>Return value</u>:
 - (*Boolean*) True if so.

##### semaphore.isWaiting()

Get whether there is a P() operation waiting for signal now.

<u>Return value</u>:
 - (*Boolean*) True if so.

