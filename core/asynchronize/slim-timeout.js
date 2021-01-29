//
//  Copyright 2019 - 2021 XiaoJSoft Studio. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Constants.
//

//  Slim timeout status.
const SLIMTIMEOUT_STATUS_AWAIT = 0;
const SLIMTIMEOUT_STATUS_TIMEOUTED = 1;
const SLIMTIMEOUT_STATUS_CANCELLED = 2;

//
//  Type definitions.
//

/**
 *  @typedef {Object} TSlimTimeoutWaitHandle
 *  @property {Number} status
 *    - Current status:
 *      - SLIMTIMEOUT_STATUS_AWAIT:
 *          Waiting for the timeout timer to be expired.
 *      - SLIMTIMEOUT_STATUS_TIMEOUTED:
 *          The timeout timer expired.
 *      - SLIMTIMEOUT_STATUS_CANCELLED:
 *          Cancelled before the timeout timer expires.
 *  @property {Promise<TSlimTimeoutWaitHandle>} handle
 *    - The wait handle (a promise object that resolves with this wait handle 
 *      when it leaves SLIMTIMEOUT_STATUS_AWAIT status).
 *  @property {() => void} cancel
 *    - The cancellator function.
 */

//
//  Public functions.
//

/**
 *  Wait for timeout.
 * 
 *  @param {Number} timespan
 *    - The timeout (unit: milliseconds).
 *  @returns {TSlimTimeoutWaitHandle}
 *    - The slim timeout wait handle.
 */
function WaitTimeoutSlim(timespan) {
    /**
     *  @type {TSlimTimeoutWaitHandle}
     */
    let wh = {
        "status": SLIMTIMEOUT_STATUS_AWAIT
    };
    wh.handle = new Promise(function(resolve) {
        let status = SLIMTIMEOUT_STATUS_AWAIT;
        let tmr = setTimeout(function() {
            if (status != SLIMTIMEOUT_STATUS_AWAIT) {
                return;
            }
            status = SLIMTIMEOUT_STATUS_TIMEOUTED;
            wh.status = status;
            resolve(wh);
        }, timespan);
        wh.cancel = function() {
            if (status != SLIMTIMEOUT_STATUS_AWAIT) {
                return;
            }
            status = SLIMTIMEOUT_STATUS_CANCELLED;
            wh.status = status;
            clearTimeout(tmr);
            resolve(wh);
        };
    });
    return wh;
}

//  Export public APIs.
module.exports = {
    "SLIMTIMEOUT_STATUS_AWAIT": SLIMTIMEOUT_STATUS_AWAIT,
    "SLIMTIMEOUT_STATUS_TIMEOUTED": SLIMTIMEOUT_STATUS_TIMEOUTED,
    "SLIMTIMEOUT_STATUS_CANCELLED": SLIMTIMEOUT_STATUS_CANCELLED,
    "WaitTimeoutSlim": WaitTimeoutSlim
};