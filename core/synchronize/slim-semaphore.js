//
//  Copyright 2019 - 2021 XiaoJSoft Studio. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Constants.
//

//  Dummy callback.
const DUMMY_CALLBACK = function() {};

//
//  Type definitions.
//

/**
 *  @typedef {Object} TSlimSemaphoreWaitHandle
 *  @property {Number} status
 *    - Current status:
 *      - SlimSemaphoreSynchronizer.STATUS_AWAIT:
 *          Waiting for entering the semaphore.
 *      - SlimSemaphoreSynchronizer.STATUS_GRANTED:
 *          Entered the semaphore.
 *      - SlimSemaphoreSynchronizer.STATUS_CANCELLED:
 *          Cancelled before entering the semaphore.
 *  @property {Promise<TSlimSemaphoreWaitHandle>} handle
 *    - The wait handle (a promise object that resolves with this wait handle 
 *      when it leaves SlimSemaphoreSynchronizer.STATUS_AWAIT status).
 *  @property {() => void} cancel
 *    - The cancellator function.
 */

/**
 *  Slim semaphore synchronizer.
 * 
 *  Note(s):
 *    [1] The initial token count must be a non-negative integer or Infinity.
 * 
 *          - If the initial token count is less than 0, it would be set to 0.
 *          - If the initial token count is NaN, it would be set to 0.
 *          - If the initial token count is a finite non-integer number, it 
 *            would be floored to the nearest integer that is less than it.
 *          - If the initial token count is not a Number object, if would be 
 *            set to 0.
 * 
 *  @constructor
 *  @param {Number} [initialTokens]
 *    - The initial token count.
 */
function SlimSemaphoreSynchronizer(initialTokens = 0) {
    //
    //  Prepare.
    //

    //  Prepare the initial token count.
    if (typeof(initialTokens) != "number" || Number.isNaN(initialTokens)) {
        initialTokens = 0;
    } else {
        if (initialTokens < 0) {
            initialTokens = 0;
        } else {
            if (
                Number.isFinite(initialTokens) && 
                !Number.isInteger(initialTokens)
            ) {
                initialTokens = Math.floor(initialTokens);
            }
        }
    }

    //
    //  Members.
    //

    //  Self reference.
    let self = this;

    /**
     *  Waiter callbacks.
     * 
     *  @type {Set<() => void>}
     */
    let waiters = new Set();

    //  Available tokens.
    let tokens = initialTokens;

    //
    //  Public methods.
    //
    
    /**
     *  Wait for entering the semaphore.
     * 
     *  @param {Boolean} [nonblock]
     *    - True if non-block mode is on.
     *  @returns {?TSlimSemaphoreWaitHandle}
     *    - The wait handle (NULL if non-block mode is on and unable to enter 
     *      the semaphore without blocking).
     */
    this.wait = function(nonblock = false) {
        if (Number.isFinite(tokens) && tokens == 0) {
            if (nonblock) {
                return null;
            }
            /**
             *  @type {TSlimSemaphoreWaitHandle}
             */
            let wh = {
                "status": SlimSemaphoreSynchronizer.STATUS_AWAIT
            };
            wh.handle = new Promise(function(resolve) {
                let status = SlimSemaphoreSynchronizer.STATUS_AWAIT;
                function _WaitHandler_Enter() {
                    if (status != SlimSemaphoreSynchronizer.STATUS_AWAIT) {
                        return;
                    }
                    status = SlimSemaphoreSynchronizer.STATUS_ENTERED;
                    wh.status = status;
                    waiters.delete(_WaitHandler_Enter);
                    resolve(wh);
                }
                wh.cancel = function() {
                    if (status != SlimSemaphoreSynchronizer.STATUS_AWAIT) {
                        return;
                    }
                    status = SlimSemaphoreSynchronizer.STATUS_CANCELLED;
                    wh.status = status;
                    waiters.delete(_WaitHandler_Enter);
                    resolve(wh);
                };
                waiters.add(_WaitHandler_Enter);
            });
            return wh;
        } else {
            --(tokens);
            let wh = {
                "status": SlimSemaphoreSynchronizer.STATUS_ENTERED,
                "cancel": DUMMY_CALLBACK
            };
            wh.handle = Promise.resolve(wh);
            return wh;
        }
    };

    /**
     *  Release the semaphore.
     */
    this.signal = function() {
        if (waiters.size == 0) {
            ++(tokens);
        } else {
            let cb = null;
            for (let _cb of waiters) {
                cb = _cb;
                break;
            }
            cb.call(self);
        }
    };

    /**
     *  Release the semaphore forever.
     * 
     *  Note(s):
     *    [1] Release the semaphore forever means that all threads (coroutines)
     *        that are currently waiting for entering the semaphore would be 
     *        granted to enter the semaphore. All future requests to enter 
     *        the semaphore would also be granted to enter the semaphore 
     *        immediately without blocking.
     */
    this.forever = function() {
        let cbs = new Set(waiters);
        for (let cb of cbs) {
            cb.call(self);
        }
        tokens = Infinity;
    };
}

//  Slim semaphore wait handler status.
SlimSemaphoreSynchronizer.STATUS_AWAIT     = 0;
SlimSemaphoreSynchronizer.STATUS_ENTERED   = 1;
SlimSemaphoreSynchronizer.STATUS_CANCELLED = 2;

//  Export public APIs.
module.exports = {
    "SlimSemaphoreSynchronizer": SlimSemaphoreSynchronizer
};