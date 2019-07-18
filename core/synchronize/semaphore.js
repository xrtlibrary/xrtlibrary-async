//
//  Copyright 2017 - 2019 The XRT Authors. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Introduction:
//    This module implements asynchronous semaphore.
//

//
//  Imports.
//

//  Imported modules.
const CrAsyncPreempt = require("./../asynchronize/preempt");
const CrPromiseQueue2 = require("./../promise/queue2");
const CrPromiseWrapper = require("./../promise/wrapper");
const CrSyncConditional = require("./../synchronize/conditional");
const XRTLibBugHandler = require("xrtlibrary-bughandler");
const Util = require("util");

//  Imported classes.
const PromiseQueue2 = CrPromiseQueue2.PromiseQueue;
const PromiseWrapper = CrPromiseWrapper.PromiseWrapper;
const ConditionalSynchronizer = CrSyncConditional.ConditionalSynchronizer;
const ReportBug = XRTLibBugHandler.ReportBug;

//
//  Constants.
//

//  Semaphore states.
const SEMSTATE_AWAIT = 0;
const SEMSTATE_FREE = 1;
const SEMSTATE_COUNT = 2;

//
//  Classes.
//

/**
 *  Semaphore synchronizer error.
 * 
 *  @constructor
 *  @param {String} [message] - The message.
 */
function SemaphoreSynchronizerError(message) {
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
 *  Semaphore synchronizer operation cancelled error.
 * 
 *  @constructor
 *  @extends {SemaphoreSynchronizerError}
 *  @param {String} [message] - The message.
 */
function SemaphoreSynchronizerOperationCancelledError(message) {
    //  Let parent class initialize.
    SemaphoreSynchronizerError.apply(this, arguments);
}

/**
 *  Semaphore wait context.
 * 
 *  @constructor
 *  @param {PromiseWrapper} pw - The promise wrapper.
 *  @param {ConditionalSynchronizer} cancellator - The cancellator.
 */
function SemaphoreWaitContext(pw, cancellator) {
    //
    //  Members.
    //

    //  Managed flag.
    let managed = false;

    //
    //  Public methods.
    //

    /**
     *  Mark the wait context as managed.
     */
    this.markAsManaged = function() {
        managed = true;
    };

    /**
     *  Get whether the wait context was managed.
     * 
     *  @return {Boolean} - True if so.
     */
    this.isManaged = function() {
        return managed;
    };

    /**
     *  Get the promise wrapper.
     * 
     *  @return {PromiseWrapper} - The promise wrapper.
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
}

/**
 *  Semaphore synchronizer.
 * 
 *  Note(s):
 *    [1] All P() operations would be queued an processed one-by-one.
 *    [2] The order of acquiring the semaphore depends on the order of P() oper-
 *        ations.
 *    [3] The earlier the P() operation requests, the earlier the P() operation 
 *        acquires the semaphore.
 *    [4] The implementation promises that the order of acquiring the semaphore 
 *        is highly reliable and won't be changed in future releases of this li-
 *        brary.
 * 
 *  @constructor
 *  @param {Number} initialCount - The initial value of the internal counter.
 */
function SemaphoreSynchronizer(initialCount) {
    //
    //  Members.
    //

    /**
     *  Self reference.
     * 
     *  @type {SemaphoreSynchronizer}
     */
    let self = this;

    //  Internal counter.
    let counter = initialCount;

    //  Semaphore state.
    let state = new CrSyncConditional.MultiConditionalSynchronzier(
        SEMSTATE_COUNT, 
        SEMSTATE_FREE
    );

    /**
     *  P() operation queue.
     * 
     *  @type {PromiseQueue2<SemaphoreWaitContext>}
     */
    let queue = new PromiseQueue2();

    //
    //  Public methods.
    //

    /**
     *  Do wait (P) operation.
     * 
     *  Exception(s):
     *    [1] SemaphoreSynchronizer.OperationCancelledError: 
     *        Raised when the cancellator was activated.
     * 
     *  @param {ConditionalSynchronizer} [cancellator] - The cancellator.
     *  @return {Promise} - The promise object (resolves if acquired 
     *                      successfully, rejects if error occurred).
     */
    this.wait = function(
        cancellator = new ConditionalSynchronizer()
    ) {
        if (cancellator.isFullfilled()) {
            return Promise.reject(
                new SemaphoreSynchronizerOperationCancelledError(
                    "The cancellator was already activated."
                )
            );
        }
        return new Promise(function(resolve, reject) {
            let cts = new CrSyncConditional.ConditionalSynchronizer();
            let ctx = new SemaphoreWaitContext(
                new PromiseWrapper(
                    function(value) {
                        cts.fullfill();
                        resolve(value);
                    },
                    function(reason) {
                        cts.fullfill();
                        reject(reason);
                    }
                ),
                cancellator
            );
            queue.push(ctx);
            cancellator.waitWithCancellator(cts).then(function() {
                if (!ctx.isManaged()) {
                    reject(new SemaphoreSynchronizerOperationCancelledError(
                        "The cancellator was activated."
                    ));
                }
            }).catch(function() {
                //  Do nothing.
            });
        });
    };

    /**
     *  Do signal (V) operation.
     */
    this.signal = function() {
        if (state.getCurrent() == SEMSTATE_AWAIT) {
            state.switch(SEMSTATE_FREE);
        } else {
            ++counter;
        }
    };

    /**
     *  Get the value of the counter.
     * 
     *  @return {Number} - The value.
     */
    this.getCount = function() {
        return counter;
    };

    /**
     *  Get whether we can acquire the semaphore without waiting.
     * 
     *  @return {Boolean} - True if so.
     */
    this.isCanAcquireImmediately = function() {
        return counter > 0 && queue.length == 0;
    };

    /**
     *  Get whether there is a P() operation waiting for signal now.
     * 
     *  @return {Boolean} - True if so.
     */
    this.isWaiting = function() {
        return state.getCurrent() == SEMSTATE_AWAIT;
    };

    //
    //  Initializer.
    //

    //  Run the state machine.
    (async function() {
        while(true) {
            //  Get a wait context.
            /**
             *  @type {SemaphoreWaitContext}
             */
            let ctx = await queue.pop();

            //  Get the cancellator of the wait context.
            let cancellator = ctx.getCancellator();

            //  Ignore this context if it was cancelled.
            if (cancellator.isFullfilled()) {
                continue;
            }

            //  Mark that we managed this context.
            ctx.markAsManaged();

            if (counter <= 0) {
                //  Wait for the counter to be greater than 0.
                state.switch(SEMSTATE_AWAIT);

                //  Wait for signals.
                let cts = new ConditionalSynchronizer();
                let wh1 = state.waitWithCancellator(SEMSTATE_FREE, cts);
                let wh2 = cancellator.waitWithCancellator(cts);
                let rsv = await CrAsyncPreempt.CreatePreemptivePromise([
                    wh1, 
                    wh2
                ]);

                //  Handle different signals
                cts.fullfill();
                let wh = rsv.getPromiseObject();
                if (wh == wh1) {
                    ctx.getPromiseWrapper().getResolveFunction().call(this);
                } else if (wh == wh2) {
                    self.signal();
                    ctx.getPromiseWrapper().getRejectFunction().call(
                        this, 
                        new SemaphoreSynchronizerOperationCancelledError(
                            "The cancellator was activated."
                        )
                    );
                } else {
                    ReportBug(
                        "Invalid wait handler", 
                        true, 
                        SemaphoreSynchronizerError
                    );
                }
            } else {
                //  Decrease the counter.
                --counter;

                //  Call the resolver.
                ctx.getPromiseWrapper().getResolveFunction().call(this);
            }
        }
    })().catch(function(error) {
        if (error) {
            throw error;
        }
    });
}
SemaphoreSynchronizer.Error = 
    SemaphoreSynchronizerError;
SemaphoreSynchronizer.OperationCancelledError = 
    SemaphoreSynchronizerOperationCancelledError;

//
//  Inheritances.
//
Util.inherits(
    SemaphoreSynchronizerError, 
    Error
);
Util.inherits(
    SemaphoreSynchronizerOperationCancelledError, 
    SemaphoreSynchronizerError
);

//  Export public APIs.
module.exports = {
    "SemaphoreSynchronizer": SemaphoreSynchronizer
};