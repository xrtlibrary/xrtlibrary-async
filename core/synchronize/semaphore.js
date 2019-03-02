//
//  Copyright 2017 - 2019 The XRT Authors. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Imports.
//

//  Imported modules.
var CrAsyncLoop = require("./../asynchronize/loop");
var CrAsyncPreempt = require("./../asynchronize/preempt");
var CrAsyncWaterfall = require("./../asynchronize/waterfall");
var CrPromiseQueue = require("./../promise/queue");
var CrSyncConditional = require("./../synchronize/conditional");

//  Imported classes.
var PromiseQueue = CrPromiseQueue.PromiseQueue;
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
 *  Semaphore synchronizer.
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
     *  @type {PromiseQueue<{resolver: (function(): void), rejector: (function(): void), cancellator: ConditionalSynchronizer, managed: Boolean}>}
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
        if (!(cancellator instanceof ConditionalSynchronizer)) {
            cancellator = new ConditionalSynchronizer();
        }
        if (cancellator.isFullfilled()) {
            return Promise.reject(new Error("The cancellator was already activated."));
        }
        return new Promise(function(resolve, reject) {
            var cts = new CrSyncConditional.ConditionalSynchronizer();
            var ctx = {
                "resolver": function() {
                    cts.fullfill();
                    resolve();
                },
                "rejector": reject,
                "cancellator": cancellator,
                "managed": false
            };
            queue.put(ctx);
            cancellator.waitWithCancellator(cts).then(function() {
                if (!ctx.managed) {
                    reject();
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

    //
    //  Initializer.
    //

    //  Run the state machine.
    CrAsyncLoop.RunAsynchronousLoop(function() {
        /**
         *  @type {?{resolver: (function(): void), rejector: (function(): void), cancellator: ConditionalSynchronizer, managed: Boolean}}
         */
        var ctx = null;
        return new Promise(function(semHandleNext) {
            CrAsyncWaterfall.CreateWaterfallPromise([
                function() {
                    //  Get a P() operation context.
                    return queue.get();
                },
                function(_ctx) {
                    //  Save the context.
                    ctx = _ctx;
    
                    //  Ignore this context if it was cancelled.
                    if (ctx.cancellator.isFullfilled()) {
                        ctx.rejector();
                        return Promise.reject(null);
                    }

                    //  Mark that we managed this context.
                    ctx.managed = true;

                    if (counter <= 0) {
                        //  Wait for the counter to be greater than 0.
                        state.switch(SEMSTATE_AWAIT);
                        var cts = new CrSyncConditional.ConditionalSynchronizer();
                        var wh1 = state.waitWithCancellator(SEMSTATE_FREE, cts);
                        var wh2 = ctx.cancellator.waitWithCancellator(cts);
                        return new Promise(function(semHoldAck, semHoldReject) {
                            CrAsyncPreempt.CreatePreemptivePromise([wh1, wh2]).then(function(rsv) {
                                cts.fullfill();
                                var wh = rsv.getPromiseObject();
                                if (wh == wh1) {
                                    semHoldAck();
                                } else if (wh == wh2) {
                                    self.signal();
                                    ctx.rejector();
                                    semHoldReject(null);
                                } else {
                                    semHoldReject(new Error("Invalid wait handler."));
                                }
                            });
                        });
                    } else {
                        //  Decrease the counter.
                        --counter;
                        return Promise.resolve();
                    }
                },
                function() {
                    //  Call the resolver.
                    ctx.resolver();

                    return Promise.resolve();
                }
            ], true).then(function() {
                semHandleNext();
            }).catch(function(error) {
                if (error) {
                    throw error;
                } else {
                    semHandleNext();
                }
            });
        });

    });
}

//  Export public APIs.
module.exports = {
    "SemaphoreSynchronizer": SemaphoreSynchronizer
};