//
//  Copyright 2017 - 2019 The XRT Authors. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Imports.
//

//  Imported modules.
var CrAsyncPreempt = require("./../asynchronize/preempt");
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

//  Promise queue "change" event types.
var PROMISEQUEUE_CHANGETYPE_PUSH = 0;
var PROMISEQUEUE_CHANGETYPE_POP = 1;
var PROMISEQUEUE_CHANGETYPE_UNPOP = 2;

//
//  Classes.
//

/**
 *  Promise queue error.
 * 
 *  @constructor
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
 *  Promise queue receipt.
 * 
 *  @constructor
 */
function PromiseQueueReceipt() {
    //
    //  Members.
    //

    //  Synchronizers.
    var syncAccept = new ConditionalSynchronizer();
    var syncDecline = new ConditionalSynchronizer();

    //
    //  Public methods.
    //

    /**
     *  Get the accept synchronizer.
     * 
     *  @return {ConditionalSynchronizer} - The synchronizer.
     */
    this.getAcceptSynchronizer = function() {
        return syncAccept;
    };

    /**
     *  Get the decline synchronizer.
     * 
     *  @return {ConditionalSynchronizer} - The synchronizer.
     */
    this.getDeclineSynchronizer = function() {
        return syncDecline;
    };
}

/**
 *  Promise queue pop context.
 * 
 *  @template T
 *  @constructor
 *  @param {PromiseWrapper} pw - The promise wrapper.
 *  @param {ConditionalSynchronizer} cancellator - The cancellator.
 *  @param {?PromiseQueueReceipt} receipt - The receipt (NULL if not set).
 */
function PromiseQueuePopContext(pw, cancellator, receipt) {
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
     *  Get the receipt.
     * 
     *  @return {?PromiseQueueReceipt} - The receipt (NULL if not set).
     */
    this.getReceipt = function() {
        return receipt;
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
 *  Promise queue (version 2).
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

    //  Self reference.
    var self = this;

    /**
     *  Pop contexts queue.
     * 
     *  @type {Array<PromiseQueuePopContext>}
     */
    var queuePopContexts = [];

    //  Pop contexts queue has item synchronizer.
    var syncHasPopContext = new ConditionalSynchronizer();
    
    /**
     *  Items queue.
     * 
     *  @type {Array<T>}
     */
    var queueItems = [];

    //  Items queue has item synchronizer.
    var syncHasItem = new ConditionalSynchronizer();

    //
    //  Private methods.
    //

    /**
     *  Pop an item off from the pop contexts queue.
     * 
     *  @return {PromiseQueuePopContext} - The context.
     */
    function _QueuePopContext_Pop() {
        var ctx = queuePopContexts.shift();
        if (queuePopContexts.length == 0) {
            syncHasPopContext.unfullfill();
        }
        return ctx;
    }

    /**
     *  Push an item to the pop contexts queue.
     * 
     *  @param {PromiseQueuePopContext} ctx - The pop context.
     */
    function _QueuePopContext_Push(ctx) {
        queuePopContexts.push(ctx);
        syncHasPopContext.fullfill();
    }

    /**
     *  Pop an item off from the items queue.
     * 
     *  @return {T} - The item.
     */
    function _QueueItems_Pop() {
        var item = queueItems.shift();
        if (queueItems.length == 0) {
            syncHasItem.unfullfill();
        }
        self.emit("change", PROMISEQUEUE_CHANGETYPE_POP, item);
        return item;
    }

    /**
     *  Unpop an item to the items queue.
     * 
     *  @param {T} item - The item.
     */
    function _QueueItems_Unpop(item) {
        queueItems.unshift(item);
        syncHasItem.fullfill();
        self.emit("change", PROMISEQUEUE_CHANGETYPE_UNPOP, item);
    }

    /**
     *  Push an item to the items queue.
     * 
     *  @param {T} item - The item.
     */
    function _QueueItems_Push(item) {
        queueItems.push(item);
        syncHasItem.fullfill();
        self.emit("change", PROMISEQUEUE_CHANGETYPE_PUSH, item);
    }

    //
    //  Properties.
    //

    /**
     *  The count of queued items.
     * 
     *  Exception(s):
     *    [1] PromiseQueue.InvalidOperationError: Raised when tries to assign value to this 
     *                                            property.
     * 
     *  @name PromiseQueue#length
     *  @type {Number}
     *  @default 0
     *  @readonly
     */
    Object.defineProperty(
        self,
        "length",
        {
            get: function() {
                return queueItems.length;
            },
            set: function() {
                throw new PromiseQueueInvalidOperationError("The \"length\" property can not be set.");
            }
        }
    );

    //
    //  Public methods.
    //

    /**
     *  Pop an item asynchronously.
     * 
     *  Exception(s):
     *    [1] PromiseQueue.OperationCancelledError: Raised when the cancellator was activated.
     * 
     *  @param {ConditionalSynchronizer} [cancellator] - The cancellator.
     *  @return {Promise<T>} - The promise object (resolves with the item when succeed, rejects when error occurred).
     */
    this.pop = function(cancellator) {
        if (arguments.length == 0) {
            return self.popWithReceipt(null);
        } else {
            return self.popWithReceipt(null, cancellator);
        }
    };

    /**
     *  Pop an item asynchronously with receipt mechanism.
     * 
     *  Exception(s):
     *    [1] PromiseQueue.OperationCancelledError: Raised when the cancellator was activated.
     * 
     *  @param {?PromiseQueueReceipt} receipt - The receipt (NULL if not set).
     *  @param {ConditionalSynchronizer} [cancellator] - The cancellator.
     *  @return {Promise<T>} - The promise object (resolves with the item when succeed, rejects when error occurred).
     */
    this.popWithReceipt = function(receipt, cancellator) {
        //  Check the cancellator.
        if (arguments.length > 1) {
            if (cancellator.isFullfilled()) {
                return Promise.reject(new PromiseQueueOperationCancelledError("The cancellator was already activated."));
            }
        } else {
            cancellator = new ConditionalSynchronizer();
        }

        return new Promise(function(_resolve, _reject) {
            //  Create a cancellation token.
            var cts = new ConditionalSynchronizer();

            //  Create a promise wrapper.
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

            //  Create a pop context.
            var ctx = new PromiseQueuePopContext(pw, cancellator, receipt);
            _QueuePopContext_Push(ctx);

            //  Monitor the cancellator.
            cancellator.waitWithCancellator(cts).then(function() {
                if (!ctx.isManaged()) {
                    pw.getRejectFunction().call(this, new PromiseQueueOperationCancelledError("The cancellator was activated."));
                }
            }, function() {
                //  Do nothing.
            });
        });
    }

    /**
     *  Push an item.
     * 
     *  @param {T} item - The item.
     */
    this.push = function(item) {
        _QueueItems_Push(item);
    };

    /**
     *  Clear all items.
     */
    this.clear = function() {
        while (queueItems.length != 0) {
            _QueueItems_Pop();
        }
    };

    //  Run the main workflow.
    (async function() {
        while(true) {
            //  Wait for a pop context.
            while(!syncHasPopContext.isFullfilled()) {
                await syncHasPopContext.wait();
            }
            var popContext = _QueuePopContext_Pop();

            //  Mark the pop context as managed.
            popContext.markAsManaged();

            //  Check the cancellator.
            var popContextCancellator = popContext.getCancellator();
            if (popContextCancellator.isFullfilled()) {
                continue;
            }

            //  Get the promise wrapper.
            var popContextPW = popContext.getPromiseWrapper();

            //  Wait for an item.
            while (!syncHasItem.isFullfilled()) {
                //  Wait for signals.
                var cts = new ConditionalSynchronizer();
                var wh1 = syncHasItem.waitWithCancellator(cts);
                var wh2 = popContextCancellator.waitWithCancellator(cts);
                var rsv = await CrAsyncPreempt.CreatePreemptivePromise([wh1, wh2]);

                //  Handle different signals.
                cts.fullfill();
                var wh = rsv.getPromiseObject();
                if (wh == wh1) {
                    continue;
                } else if (wh == wh2) {
                    popContextPW.getRejectFunction().call(this, new PromiseQueueOperationCancelledError("The cancellator was activated."));
                    break;
                } else {
                    throw new PromiseQueueError("BUG: Invalid wait handler.");
                }
            }
            if (popContextCancellator.isFullfilled()) {
                continue;
            }
            var popItem = _QueueItems_Pop();

            //  Resolves the promise object.
            popContextPW.getResolveFunction().call(this, popItem);

            //  Wait for receipt.
            var popContextReceipt = popContext.getReceipt();
            if (popContextReceipt) {
                //  Wait for signals.
                var cts = new ConditionalSynchronizer();
                var wh1 = popContextReceipt.getAcceptSynchronizer().waitWithCancellator(cts);
                var wh2 = popContextReceipt.getDeclineSynchronizer().waitWithCancellator(cts);
                var rsv = await CrAsyncPreempt.CreatePreemptivePromise([wh1, wh2]);

                //  Handle different signals.
                cts.fullfill();
                var wh = rsv.getPromiseObject();
                if (wh == wh1) {
                    //  Do nothing.
                } else if (wh == wh2) {
                    //  Give back the item.
                    _QueueItems_Unpop(popItem);
                } else {
                    throw new PromiseQueueError("BUG: Invalid wait handler.");
                }
            }
        }
    })();
}
PromiseQueue.Receipt = PromiseQueueReceipt;
PromiseQueue.Error = PromiseQueueError;
PromiseQueue.OperationCancelledError = PromiseQueueOperationCancelledError;
PromiseQueue.InvalidOperationError = PromiseQueueInvalidOperationError;
PromiseQueue.CHANGETYPE_PUSH = PROMISEQUEUE_CHANGETYPE_PUSH;
PromiseQueue.CHANGETYPE_POP = PROMISEQUEUE_CHANGETYPE_POP;
PromiseQueue.CHANGETYPE_UNPOP = PROMISEQUEUE_CHANGETYPE_UNPOP;

//
//  Event definitions.
//

/**
 *  Promise queue change event.
 * 
 *  Note(s):
 *    [1] This event would only be emitted when the count of pending items were 
 *        changed.
 * 
 *  @event PromiseQueue#change
 *  @param {Number} type - The action type (one of PromiseQueue.CHANGETYPE_*).
 *  @param {*} item - The item related to the action.
 */

//
//  Inheritances.
//
Util.inherits(PromiseQueue, EventEmitter);
Util.inherits(PromiseQueueError, Error);
Util.inherits(PromiseQueueOperationCancelledError, PromiseQueueError);
Util.inherits(PromiseQueueInvalidOperationError, PromiseQueueError);

//  Export public APIs.
module.exports = {
    "PromiseQueue": PromiseQueue
};