//
//  Copyright 2017 - 2019 The XRT Authors. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Introduction:
//    This module implements a asynchronous queue data structure (improved vers-
//    ion).
//

//
//  Imports.
//

//  Imported modules.
const CrAsyncPreempt = require("./../asynchronize/preempt");
const CrPromiseWrapper = require("./wrapper");
const CrSyncConditional = require("./../synchronize/conditional");
const XRTLibBugHandler = require("xrtlibrary-bughandler");
const Events = require("events");
const Util = require("util");

//  Imported classes.
const PromiseWrapper = CrPromiseWrapper.PromiseWrapper;
const EventEmitter = Events.EventEmitter;
const ConditionalSynchronizer = CrSyncConditional.ConditionalSynchronizer;
const ReportBug = XRTLibBugHandler.ReportBug;

//
//  Constants.
//

//  Promise queue "change" event types.
const PROMISEQUEUE_CHANGETYPE_PUSH = 0;
const PROMISEQUEUE_CHANGETYPE_POP = 1;
const PROMISEQUEUE_CHANGETYPE_UNPOP = 2;

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
 *  Promise queue receipt.
 * 
 *  @constructor
 */
function PromiseQueueReceipt() {
    //
    //  Members.
    //

    //  Synchronizers.
    let syncAccept = new ConditionalSynchronizer();
    let syncDecline = new ConditionalSynchronizer();
    let syncReceiptAck = new ConditionalSynchronizer();

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

    /**
     *  Get the receipt acknowledge synchronizer.
     * 
     *  @return {ConditionalSynchronizer} - The synchronizer.
     */
    this.getReceiptAcknowledgeSynchronizer = function() {
        return syncReceiptAck;
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
    let self = this;

    //  Waiting for receipt flag.
    let isWaitingReceipt = false;

    /**
     *  Pop contexts queue.
     * 
     *  @type {Array<PromiseQueuePopContext>}
     */
    let queuePopContexts = [];

    //  Pop contexts queue has item synchronizer.
    let syncHasPopContext = new ConditionalSynchronizer();
    
    /**
     *  Items queue.
     * 
     *  @type {Array<T>}
     */
    let queueItems = [];

    //  Items queue has item synchronizer.
    let syncHasItem = new ConditionalSynchronizer();

    //
    //  Private methods.
    //

    /**
     *  Pop an item off from the pop contexts queue.
     * 
     *  @return {PromiseQueuePopContext} - The context.
     */
    function _QueuePopContext_Pop() {
        let ctx = queuePopContexts.shift();
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
        let item = queueItems.shift();
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
     *    [1] PromiseQueue.InvalidOperationError: 
     *        Raised when tries to assign value to this property.
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
                throw new PromiseQueueInvalidOperationError(
                    "The \"length\" property can not be set."
                );
            }
        }
    );

    //
    //  Public methods.
    //

    /**
     *  Get whether this object is waiting for a receipt.
     * 
     *  @return {Boolean} - True if so.
     */
    this.isWaitingForReceipt = function() {
        return isWaitingReceipt;
    };

    /**
     *  Pop an item asynchronously.
     * 
     *  Exception(s):
     *    [1] PromiseQueue.OperationCancelledError: 
     *        Raised when the cancellator was activated.
     * 
     *  @param {ConditionalSynchronizer} [cancellator] - The cancellator.
     *  @return {Promise<T>} - The promise object (resolves with the item when 
     *                         succeed, rejects when error occurred).
     */
    this.pop = function(
        cancellator = new ConditionalSynchronizer()
    ) {
        return self.popWithReceipt(null, cancellator);
    };

    /**
     *  Pop an item asynchronously with receipt mechanism.
     * 
     *  Exception(s):
     *    [1] PromiseQueue.OperationCancelledError: 
     *        Raised when the cancellator was activated.
     * 
     *  @param {?PromiseQueueReceipt} receipt - The receipt (NULL if not set).
     *  @param {ConditionalSynchronizer} [cancellator] - The cancellator.
     *  @return {Promise<T>} - The promise object (resolves with the item when 
     *                         succeed, rejects when error occurred).
     */
    this.popWithReceipt = function(
        receipt, 
        cancellator = new ConditionalSynchronizer()
    ) {
        //  Check the cancellator.
        if (cancellator.isFullfilled()) {
            return Promise.reject(new PromiseQueueOperationCancelledError(
                "The cancellator was already activated."
            ));
        }

        return new Promise(function(resolve, reject) {
            //  Create a cancellation token.
            let cts = new ConditionalSynchronizer();

            //  Create a promise wrapper.
            let pw = new PromiseWrapper(
                function(value) {
                    cts.fullfill();
                    resolve(value);
                }, 
                function(reason) {
                    cts.fullfill();
                    reject(reason);
                }
            );

            //  Create a pop context.
            let ctx = new PromiseQueuePopContext(pw, cancellator, receipt);
            _QueuePopContext_Push(ctx);

            //  Monitor the cancellator.
            cancellator.waitWithCancellator(cts).then(function() {
                if (!ctx.isManaged()) {
                    pw.getRejectFunction().call(
                        this, 
                        new PromiseQueueOperationCancelledError(
                            "The cancellator was activated."
                        )
                    );
                }
            }, function() {
                //  Do nothing.
            });
        });
    }

    /**
     *  Unpop an item.
     * 
     *  Note(s):
     *    [1] This method can't be called when this object is waiting for a rec-
     *        eipt.
     * 
     *  Exception(s):
     *    [1] PromiseQueue.InvalidOperationError: 
     *        Raised this object is still waiting for a receipt.
     * 
     *  @param {T} item - The item.
     */
    this.unpop = function(item) {
        if (isWaitingReceipt) {
            throw new PromiseQueueInvalidOperationError(
                "Unable to unpop when this object is waiting for a receipt."
            );
        }
        _QueueItems_Unpop(item);
    };

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
            let popContext = _QueuePopContext_Pop();

            //  Mark the pop context as managed.
            popContext.markAsManaged();

            //  Check the cancellator.
            let popContextCancellator = popContext.getCancellator();
            if (popContextCancellator.isFullfilled()) {
                continue;
            }

            //  Get the promise wrapper.
            let popContextPW = popContext.getPromiseWrapper();

            //  Wait for an item.
            while (!syncHasItem.isFullfilled()) {
                //  Wait for signals.
                let cts = new ConditionalSynchronizer();
                let wh1 = syncHasItem.waitWithCancellator(cts);
                let wh2 = popContextCancellator.waitWithCancellator(cts);
                let rsv = await CrAsyncPreempt.CreatePreemptivePromise([
                    wh1, 
                    wh2
                ]);

                //  Handle different signals.
                cts.fullfill();
                let wh = rsv.getPromiseObject();
                if (wh == wh1) {
                    continue;
                } else if (wh == wh2) {
                    popContextPW.getRejectFunction().call(
                        this, 
                        new PromiseQueueOperationCancelledError(
                            "The cancellator was activated."
                        )
                    );
                    break;
                } else {
                    ReportBug("Invalid wait handler.", true, PromiseQueueError);
                }
            }
            if (popContextCancellator.isFullfilled()) {
                continue;
            }
            let popItem = _QueueItems_Pop();

            //  Resolves the promise object.
            popContextPW.getResolveFunction().call(this, popItem);

            //  Wait for receipt.
            let popContextReceipt = popContext.getReceipt();
            if (popContextReceipt) {
                //  Mark as waiting for receipt.
                isWaitingReceipt = true;

                //  Wait for signals.
                let cts = new ConditionalSynchronizer();
                let wh1 = popContextReceipt.getAcceptSynchronizer(
                ).waitWithCancellator(cts);
                let wh2 = popContextReceipt.getDeclineSynchronizer(
                ).waitWithCancellator(cts);
                let rsv = await CrAsyncPreempt.CreatePreemptivePromise([
                    wh1, 
                    wh2
                ]);

                //  Handle different signals.
                try {
                    cts.fullfill();
                    let wh = rsv.getPromiseObject();
                    if (wh == wh1) {
                        //  Do nothing.
                    } else if (wh == wh2) {
                        //  Give back the item.
                        _QueueItems_Unpop(popItem);
                    } else {
                        ReportBug(
                            "Invalid wait handler.", 
                            true, 
                            PromiseQueueError
                        );
                    }
                } finally {
                    //  Mark as not waited for the receipt.
                    isWaitingReceipt = false;

                    //  Mark that we acknowledged the receipt.
                    popContextReceipt.getReceiptAcknowledgeSynchronizer(
                    ).fullfill();
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