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
var CrPromiseQueue = require("./../promise/queue");
var CrPromiseWrapper = require("./../promise/wrapper");
var CrSyncConditional = require("./../synchronize/conditional");

//  Imported classes.
var PromiseQueue = CrPromiseQueue.PromiseQueue;
var PromiseWrapper = CrPromiseWrapper.PromiseWrapper;
var ConditionalSynchronizer = CrSyncConditional.ConditionalSynchronizer;

//
//  Constants.
//

//  Semaphore states.
var SEMSTATE_AWAIT = 0;
var SEMSTATE_FREE = 1;
var SEMSTATE_COUNT = 2;

//
//  Classes.
//

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
    var managed = false;

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
 *    [2] The order of acquiring the semaphore depends on the order of P() operations.
 *    [3] The earlier the P() operation requests, the earlier the P() operation acqui-
 *        res the semaphore.
 *    [4] The implementation promises that the order of acquiring the semaphore is hi-
 *        ghly reliable and won't be changed in future releases of this library.
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
    var self = this;

    //  Internal counter.
    var counter = initialCount;

    //  Semaphore state.
    var state = new CrSyncConditional.MultiConditionalSynchronzier(SEMSTATE_COUNT, SEMSTATE_FREE);

    /**
     *  P() operation queue.
     * 
     *  @type {PromiseQueue<SemaphoreWaitContext>}
     */
    var queue = new PromiseQueue();

    //
    //  Public methods.
    //

    /**
     *  Do wait (P) operation.
     * 
     *  @param {ConditionalSynchronizer} [cancellator] - The cancellator.
     *  @return {Promise} - The promise object.
     */
    this.wait = function(cancellator) {
        if (arguments.length > 0) {
            if (cancellator.isFullfilled()) {
                return Promise.reject(new Error("The cancellator was already activated."));
            }
        } else {
            cancellator = new ConditionalSynchronizer();
        }
        return new Promise(function(resolve, reject) {
            var cts = new CrSyncConditional.ConditionalSynchronizer();
            var ctx = new SemaphoreWaitContext(
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
            queue.put(ctx);
            cancellator.waitWithCancellator(cts).then(function() {
                if (!ctx.isManaged()) {
                    reject(new Error("The cancellator was activated."));
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
        return counter > 0 && queue.getLength() == 0;
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
            var ctx = await queue.get();

            //  Get the cancellator of the wait context.
            var cancellator = ctx.getCancellator();

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
                var cts = new ConditionalSynchronizer();
                var wh1 = state.waitWithCancellator(SEMSTATE_FREE, cts);
                var wh2 = cancellator.waitWithCancellator(cts);
                var rsv = await CrAsyncPreempt.CreatePreemptivePromise([wh1, wh2]);

                //  Handle different signals
                cts.fullfill();
                var wh = rsv.getPromiseObject();
                if (wh == wh1) {
                    ctx.getPromiseWrapper().getResolveFunction().call(this);
                } else if (wh == wh2) {
                    self.signal();
                    ctx.getPromiseWrapper().getRejectFunction().call(this, new Error("The cancellator was activated."));
                } else {
                    throw new Error("BUG: Invalid wait handler.");
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

//  Export public APIs.
module.exports = {
    "SemaphoreSynchronizer": SemaphoreSynchronizer
};