//
//  Copyright 2017 - 2019 The XRT Authors. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Imports.
//

//  Imported modules.
var CrPromiseWrapper = require("./wrapper");
var CrSyncConditional = require("./../synchronize/conditional");
var Events = require("events");
var Util = require("util");

//  Imported classes.
var PromiseWrapper = CrPromiseWrapper.PromiseWrapper;
var EventEmitter = Events.EventEmitter;
var ConditionalSynchronizer = CrSyncConditional.ConditionalSynchronizer;

//
//  Constants.
//

//  Promise queue operations.
var PROMISEQUEUEOP_PUSH = 0;
var PROMISEQUEUEOP_POP = 1;

//
//  Classes.
//

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
    var managed = false;

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
    var self = this;

    /**
     *  Waiting requests.
     * 
     *  @type {Array<PromiseQueueItemContext<T>>}
     */
    var waiting = [];

    /**
     *  Pending items.
     * 
     *  @type {Array<T>}
     */
    var pending = [];

    //  Synchronizers.
    var syncHasPendingItem = new ConditionalSynchronizer();

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
            var context = waiting.shift();
            context.markAsManaged();
            var pw = context.getPromiseWrapper();
            var cancellator = context.getCancellator();
            if (cancellator.isFullfilled()) {
                continue;
            }
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
     *  @param {ConditionalSynchronizer} [cancellator] - The cancellator.
     *  @return {Promise<T>} - The promise object (resolve with the item, never reject).
     */
    this.get = function(cancellator) {
        if (arguments.length == 0) {
            cancellator = new ConditionalSynchronizer();
        } else {
            if (cancellator.isFullfilled()) {
                return Promise.reject(new Error("The cancellator was already fullfilled."));
            }
        }
        if (pending.length != 0) {
            var item = pending.shift();
            self.emit("change", PROMISEQUEUEOP_POP, item);
            if (pending.length == 0) {
                syncHasPendingItem.unfullfill();
            }
            return Promise.resolve(item);
        } else {
            return new Promise(function(_resolve, _reject) {
                var cts = new ConditionalSynchronizer();
                var pw = new PromiseWrapper(
                    function(value) {
                        cts.fullfill();
                        _resolve(value);
                    },
                    function(reason) {
                        cts.fullfill();
                        _reject(reason);
                    }
                );
                var ctx = new PromiseQueueItemContext(pw, cancellator);
                waiting.push(ctx);
                cancellator.waitWithCancellator(cts).then(function() {
                    if (!ctx.isManaged()) {
                        _reject(new Error("The cancellator was activated."));
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
     *  @return {T} - The item.
     */
    this.getSync = function() {
        if (pending.length != 0) {
            var item = pending.shift();
            self.emit("change", PROMISEQUEUEOP_POP, item);
            if (pending.length == 0) {
                syncHasPendingItem.unfullfill();
            }
            return item;
        } else {
            throw new Error("No item yet.");
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
     *  @return {Promise} - The promise object (resolves when available, rejects when cancelled).
     */
    this.wait = function(cancellator) {
        if (arguments.length == 0) {
            return syncHasPendingItem.wait();
        } else {
            return syncHasPendingItem.waitWithCancellator(cancellator);
        }
    };

    /**
     *  Clear all in-queue items.
     */
    this.clear = function() {
        while (pending.length != 0) {
            var item = pending.shift();
            self.emit("change", PROMISEQUEUEOP_POP, item);
        }
        syncHasPendingItem.unfullfill();
    };
}

//
//  Event definitions.
//

/**
 *  Promise queue change event.
 * 
 *  Note(s):
 *    [1] This event would only be emitted when the count of pending items was 
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
Util.inherits(PromiseQueue, EventEmitter);

//  Export public APIs.
module.exports = {
    "PromiseQueue": PromiseQueue,
    "PROMISEQUEUEOP_POP": PROMISEQUEUEOP_POP,
    "PROMISEQUEUEOP_PUSH": PROMISEQUEUEOP_PUSH
};