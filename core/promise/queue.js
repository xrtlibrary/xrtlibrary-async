//
//  Copyright 2017 - 2020 The XRT Authors. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Introduction:
//    This module implements a asynchronous queue data structure.
//

//
//  Imports.
//

//  Imported modules.
const CrPromiseWrapper = require("./wrapper");
const CrSyncConditional = require("./../synchronize/conditional");
const Events = require("events");
const Util = require("util");

//  Imported classes.
const PromiseWrapper = CrPromiseWrapper.PromiseWrapper;
const EventEmitter = Events.EventEmitter;
const ConditionalSynchronizer = CrSyncConditional.ConditionalSynchronizer;

//
//  Constants.
//

//  Promise queue operations.
const PROMISEQUEUEOP_PUSH = 0;
const PROMISEQUEUEOP_POP = 1;

//
//  Classes.
//

/**
 *  Promise queue error.
 * 
 *  @constructor
 *  @extends {Error}
 *  @param {String} [message] - The message.
 */
function PromiseQueueError(message) {
    //  Let parent class initialize.
    if (arguments.length > 0) {
        Error.call(this, message);
        this.message = message;
    } else {
        Error.call(this);
        this.message = "Unknown error.";
    }
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
}

/**
 *  Promise queue operation cancelled error.
 * 
 *  @constructor
 *  @extends {PromiseQueueError}
 *  @param {String} [message] - The message.
 */
function PromiseQueueOperationCancelledError(message) {
    //  Let parent class initialize.
    PromiseQueueError.apply(this, arguments);
}

/**
 *  Promise queue invalid operation error.
 * 
 *  @constructor
 *  @extends {PromiseQueueError}
 *  @param {String} [message] - The message.
 */
function PromiseQueueInvalidOperationError(message) {
    //  Let parent class initialize.
    PromiseQueueError.apply(this, arguments);
}

/**
 *  Promise queue item context.
 * 
 *  @template T
 *  @constructor
 *  @param {PromiseWrapper} pw - The promise wrapper.
 *  @param {ConditionalSynchronizer} cancellator - The cancellator.
 */
function PromiseQueueItemContext(pw, cancellator) {
    //
    //  Members.
    //

    //  Managed flag.
    let managed = false;

    //
    //  Public methods.
    //

    /**
     *  Get the promise wrapper.
     * 
     *  @return {PromiseWrapper<T>} - The promise wrapper.
     */
    this.getPromiseWrapper = function() {
        return pw;
    };

    /**
     *  Get the cancellator.
     * 
     *  @return {ConditionalSynchronizer} - The cancellator.
     */
    this.getCancellator = function() {
        return cancellator;
    };

    /**
     *  Get whether the item context was managed.
     * 
     *  @return {Boolean} - True if so.
     */
    this.isManaged = function() {
        return managed;
    };

    /**
     *  Mark the item context as managed.
     */
    this.markAsManaged = function() {
        managed = true;
    };
}

/**
 *  Promise queue.
 * 
 *  @template T
 *  @constructor
 *  @extends {EventEmitter}
 */
function PromiseQueue() {
    //  Let parent class initialize.
    EventEmitter.call(this);

    //
    //  Members.
    //

    /**
     *  Self reference.
     * 
     *  @type {PromiseQueue<T>}
     */
    let self = this;

    /**
     *  Waiting requests.
     * 
     *  @type {Array<PromiseQueueItemContext<T>>}
     */
    let waiting = [];

    /**
     *  Pending items.
     * 
     *  @type {Array<T>}
     */
    let pending = [];

    //  Synchronizers.
    let syncHasPendingItem = new ConditionalSynchronizer();

    //
    //  Public methods.
    //

    /**
     *  Put an item to the queue.
     * 
     *  @param {T} item - The item.
     */
    this.put = function(item) {
        while(waiting.length != 0) {
            let context = waiting.shift();
            let pw = context.getPromiseWrapper();
            let cancellator = context.getCancellator();
            if (cancellator.isFullfilled()) {
                continue;
            }
            context.markAsManaged();
            pw.getResolveFunction().call(this, item);
            return;
        }
        pending.push(item);
        self.emit("change", PROMISEQUEUEOP_PUSH, item);
        syncHasPendingItem.fullfill();
    };

    /**
     *  Get an item from the queue.
     * 
     *  Exception(s):
     *    [1] PromiseQueue.OperationCancelledError: 
     *        Raised when the cancellator was activated.
     * 
     *  @param {ConditionalSynchronizer} [cancellator] - The cancellator.
     *  @return {Promise<T>} - The promise object (resolves with the item if 
     *                         succeed, rejects if error occurred).
     */
    this.get = function(
        cancellator = new ConditionalSynchronizer()
    ) {
        if (cancellator.isFullfilled()) {
            return Promise.reject(new PromiseQueueOperationCancelledError(
                "The cancellator was already fullfilled."
            ));
        }
        if (pending.length != 0) {
            let item = pending.shift();
            self.emit("change", PROMISEQUEUEOP_POP, item);
            if (pending.length == 0) {
                syncHasPendingItem.unfullfill();
            }
            return Promise.resolve(item);
        } else {
            return new Promise(function(_resolve, _reject) {
                let cts = new ConditionalSynchronizer();
                let pw = new PromiseWrapper(
                    function(value) {
                        cts.fullfill();
                        _resolve(value);
                    },
                    function(reason) {
                        cts.fullfill();
                        _reject(reason);
                    }
                );
                let ctx = new PromiseQueueItemContext(pw, cancellator);
                waiting.push(ctx);
                cancellator.waitWithCancellator(cts).then(function() {
                    if (!ctx.isManaged()) {
                        _reject(new PromiseQueueOperationCancelledError(
                            "The cancellator was activated."
                        ));
                    }
                }, function() {
                    //  Do nothing.
                });
            });
        }
    };

    /**
     *  Get an item from the queue synchronously.
     * 
     *  Note(s):
     *    [1] An error will be thrown if the queue has no item.
     *    [2] It highly NOT recommended to use this method with both wait() and 
     *        clear() method. See following condition:
     * 
     *        +------+----------------------+----------------------+
     *        | Tick |        Task 1        |        Task 2        |
     *        +------+----------------------+----------------------+
     *        |  1   | await queue.wait()   |          -           |
     *        |  2   |          -           | queue.clear()        |
     *        |  3   | queue.getSync()      |          -           |
     *        +------+----------------------+----------------------+
     * 
     *        The tick 3 would raise an error since there is no item in the 
     *        queue.
     * 
     *        To avoid this situation, use get([cancellator]) method instead.
     * 
     *  Exception(s):
     *    [1] PromiseQueue:InvalidOperationError: 
     *        Raised when this queue is empty.
     * 
     *  @return {T} - The item.
     */
    this.getSync = function() {
        if (pending.length != 0) {
            let item = pending.shift();
            self.emit("change", PROMISEQUEUEOP_POP, item);
            if (pending.length == 0) {
                syncHasPendingItem.unfullfill();
            }
            return item;
        } else {
            throw new PromiseQueueInvalidOperationError("No item yet.");
        }
    };

    /**
     *  Get the count of in-queue items (queue length).
     * 
     *  @return {Number} - The item count.
     */
    this.getLength = function() {
        return pending.length;
    };

    /**
     *  Wait for an item to be available.
     * 
     *  @param {ConditionalSynchronizer} [cancellator] - The cancellator.
     *  @return {Promise} - The promise object (resolves when available, rejects
     *                      if error occurred).
     */
    this.wait = function(
        cancellator = new ConditionalSynchronizer()
    ) {
        return syncHasPendingItem.waitWithCancellator(cancellator);
    };

    /**
     *  Clear all in-queue items.
     */
    this.clear = function() {
        while (pending.length != 0) {
            let item = pending.shift();
            self.emit("change", PROMISEQUEUEOP_POP, item);
        }
        syncHasPendingItem.unfullfill();
    };
}
PromiseQueue.Error = PromiseQueueError;
PromiseQueue.OperationCancelledError = PromiseQueueOperationCancelledError;
PromiseQueue.InvalidOperationError = PromiseQueueInvalidOperationError;
PromiseQueue.CHANGETYPE_POP = PROMISEQUEUEOP_POP;
PromiseQueue.CHANGETYPE_PUSH = PROMISEQUEUEOP_PUSH;

//
//  Event definitions.
//

/**
 *  Promise queue change event.
 * 
 *  Note(s):
 *    [1] This event would only be emitted when the count of pending items were 
 *        changed.
 *    [2] This event wouldn't be emitted if you put an item and there is already 
 *        some get() operations in waiting (In this situation, the waiting get() 
 *        operation would be answered with the item immediately instead of inse-
 *        rting the item to the pending items queue).
 * 
 *  @event PromiseQueue#change
 *  @param {Number} type - The action type (one of PROMISEQUEUEOP_*).
 *  @param {*} item - The item related to the action.
 */

//
//  Inheritances.
//
Util.inherits(PromiseQueueError, Error);
Util.inherits(PromiseQueueOperationCancelledError, PromiseQueueError);
Util.inherits(PromiseQueueInvalidOperationError, PromiseQueueError);
Util.inherits(PromiseQueue, EventEmitter);

//  Export public APIs.
module.exports = {
    "PromiseQueue": PromiseQueue,
    "PROMISEQUEUEOP_POP": PROMISEQUEUEOP_POP,
    "PROMISEQUEUEOP_PUSH": PROMISEQUEUEOP_PUSH
};