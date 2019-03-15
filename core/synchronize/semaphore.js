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
                "resolver": function(value) {
                    cts.fullfill();
                    resolve(value);
                },
                "rejector": function(reason) {
                    cts.fullfill();
                    reject(reason);
                },
                "cancellator": cancellator,
                "managed": false
            };
            queue.put(ctx);
            cancellator.waitWithCancellator(cts).then(function() {
                if (!ctx.managed) {
                    reject("The cancellator was activated.");
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
    (async function() {
        while(true) {
            //  Get a P() operation context.
            /**
             *  @type {?{resolver: (function(): void), rejector: (function(): void), cancellator: ConditionalSynchronizer, managed: Boolean}}
             */
            var ctx = await queue.get();

            //  Ignore this context if it was cancelled.
            if (ctx.cancellator.isFullfilled()) {
                continue;
            }

            //  Mark that we managed this context.
            ctx.managed = true;

            if (counter <= 0) {
                //  Wait for the counter to be greater than 0.
                state.switch(SEMSTATE_AWAIT);

                //  Wait for signals.
                var cts = new ConditionalSynchronizer();
                var wh1 = state.waitWithCancellator(SEMSTATE_FREE, cts);
                var wh2 = ctx.cancellator.waitWithCancellator(cts);
                var rsv = await CrAsyncPreempt.CreatePreemptivePromise([wh1, wh2]);

                //  Handle different signals
                cts.fullfill();
                var wh = rsv.getPromiseObject();
                if (wh == wh1) {
                    ctx.resolver();
                } else if (wh == wh2) {
                    self.signal();
                    ctx.rejector(new Error("The cancellator was activated."));
                } else {
                    throw new Error("BUG: Invalid wait handler.");
                }
            } else {
                //  Decrease the counter.
                --counter;

                //  Call the resolver.
                ctx.resolver();
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