//
//  Copyright 2019 - 2021 XiaoJSoft Studio. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Imports.
//

//  Imported modules.
const CrSyncConditional = 
    require("./conditional");

//  Imported classes.
const ConditionalSynchronizer = 
    CrSyncConditional.ConditionalSynchronizer;

//
//  Constants.
//

//  Dummy callback.
const DUMMY_CALLBACK = function() {};

//
//  Type definitions.
//

/**
 *  @typedef {Object} TSlimCompletionWaitHandle
 *  @property {Number} status
 *    - Current status:
 *      - SlimCompletion.STATUS_AWAIT:
 *          Waiting for completion enters completed status.
 *      - SlimCompletion.STATUS_COMPLETED:
 *          Completion enters completed status.
 *      - SlimCompletion.STATUS_CANCELLED:
 *          Cancelled before the completion enters completed status.
 *  @property {Promise<TSlimCompletionWaitHandle>} handle
 *    - The wait handle (a promise object that resolves with this wait handle 
 *      when it leaves SlimCompletion.STATUS_AWAIT status).
 *  @property {() => void} cancel
 *    - The cancellator function.
 */

//
//  Classes.
//

/**
 *  Slim completion source.
 * 
 *  @constructor
 */
function SlimCompletion() {
    //
    //  Members.
    //
    let self = this;

    /**
     *  Waiter callbacks.
     * 
     *  @type {Set<() => void>}
     */
    let waiters = new Set();

    //  Completed flag.
    let completed = false;

    //
    //  Public methods.
    //

    /**
     *  Wait for the completion enters completed status.
     * 
     *  @param {Boolean} [nonblock]
     *    - True if non-block mode is on.
     *  @returns {?TSlimCompletionWaitHandle}
     *    - The wait handle (NULL if non-block mode is on and the completion 
     *      is not in completed status yet).
     */
    this.wait = function(nonblock = false) {
        if (completed) {
            let wh = {
                "status": SlimCompletion.STATUS_COMPLETED,
                "cancel": DUMMY_CALLBACK
            };
            wh.handle = Promise.resolve(wh);
            return wh;
        } else {
            if (nonblock) {
                return null;
            }
            let wh = {
                "status": SlimCompletion.STATUS_AWAIT
            };
            wh.handle = new Promise(function(resolve) {
                let status = SlimCompletion.STATUS_AWAIT;
                function _WaitHandler_Complete() {
                    if (status != SlimCompletion.STATUS_AWAIT) {
                        return;
                    }
                    status = SlimCompletion.STATUS_COMPLETED;
                    wh.status = status;
                    waiters.delete(_WaitHandler_Complete);
                    resolve(wh);
                }
                wh.cancel = function() {
                    if (status != SlimCompletion.STATUS_AWAIT) {
                        return;
                    }
                    status = SlimCompletion.STATUS_CANCELLED;
                    wh.status = status;
                    waiters.delete(_WaitHandler_Complete);
                    resolve(wh);
                };
                waiters.add(_WaitHandler_Complete);
            });
            return wh;
        }
    };

    /**
     *  Enter completed status.
     */
    this.complete = function() {
        if (completed) {
            return;
        }
        completed = true;
        while (waiters.size != 0) {
            let cbs = new Set(waiters);
            for (let cb of cbs) {
                cb.call(self);
            }
        }
    };
}

/**
 *  Wait for condition.
 * 
 *  @param {ConditionalSynchronizer} cond
 *    - The conditional synchronizer.
 *  @param {Boolean} [nonblock]
 *    - True if non-block mode is on.
 *  @returns {?TSlimCompletionWaitHandle}
 *    - The wait handle (NULL if non-block mode is on and the conditional 
 *      synchronizer is not fullfilled yet).
 */
SlimCompletion.WaitCondition = function(cond, nonblock = false) {
    if (cond.isFullfilled()) {
        let wh = {
            "status": SlimCompletion.STATUS_COMPLETED,
            "cancel": DUMMY_CALLBACK
        };
        wh.handle = Promise.resolve(wh);
        return wh;
    } else {
        if (nonblock) {
            return null;
        }
        let cts = new ConditionalSynchronizer();
        let wh = {
            "status": SlimCompletion.STATUS_AWAIT,
            "cancel": function() {
                cts.fullfill();
            }
        };
        wh.handle = new Promise(function(resolve) {
            cond.waitWithCancellator(cts).then(function() {
                wh.status = SlimCompletion.STATUS_COMPLETED;
                resolve(wh);
            }).catch(function() {
                wh.status = SlimCompletion.STATUS_CANCELLED;
                resolve(wh);
            });
        });
        return wh;
    }
};

//  Slim completion wait handler status.
SlimCompletion.STATUS_AWAIT     = 0;
SlimCompletion.STATUS_COMPLETED = 1;
SlimCompletion.STATUS_CANCELLED = 2;

//  Export public APIs.
module.exports = {
    "SlimCompletion": SlimCompletion
};