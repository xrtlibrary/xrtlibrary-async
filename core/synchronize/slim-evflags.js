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
 *  @typedef {Object} TSlimEventFlagsWaitHandle
 *  @property {Number} status
 *    - Current status:
 *      - SlimEventFlags.STATUS_AWAIT:
 *          Wait for specified condition satisfies.
 *      - SlimEventFlags.STATUS_SATISFIED:
 *          The wait condition has been satisfied.
 *      - SlimEventFlags.STATUS_CANCELLED:
 *          Cancelled before the wait condition satisfies.
 *  @property {Number} value
 *    - The flag value at the time that the wait condition satisfies.
 *  @property {Promise<TSlimEventFlagsWaitHandle>} handle
 *    - The wait handle (a promise object that resolves with this wait handle 
 *      when it leaves SlimEventFlags.STATUS_AWAIT status).
 *  @property {() => void} cancel
 *    - The cancellator function.
 */

//
//  Classes.
//

/**
 *  Slim event flags.
 * 
 *  Note(s):
 *    [1] The initial flag value shall be an unsigned 32-bit integer.
 *          - 0x00000000 would be used as the initial flag value if specified 
 *            initial flag value is not an integer or is a negative integer.
 *          - 0xFFFFFFFF would be used as the initial flag value if specified 
 *            initial flag value is greater than 0xFFFFFFFF.
 * 
 *  @constructor
 *  @param {Number} [initialValue]
 *    - The initial flag value.
 */
function SlimEventFlags(initialValue = 0x00000000) {
    //
    //  Prepare.
    //

    //  Prepare the initial value.
    if (Number.isInteger(initialValue)) {
        if (initialValue > 0xFFFFFFFF) {
            initialValue = 0xFFFFFFFF;
        } else if (initialValue < 0x00000000) {
            initialValue = 0x00000000;
        } else {
            //  Do nothing.
        }
    } else {
        initialValue = 0x00000000;
    }

    //
    //  Members.
    //

    //  Self reference.
    let self = this;

    //  Flag value.
    let u32now = initialValue;

    /**
     *  Value change notifiers.
     * 
     *  @type {Set<() => void>}
     */
    let notifiers = new Set();

    //
    //  Public methods.
    //

    /**
     *  Wait for specified condition satisfies.
     * 
     *  Note(s):
     *    [1] The condition indicated by following formula is monitored:
     *          ((flag & onebits) == onebits) && ((flag & zerobits) == 0)
     *    [2] Both "onebits" and "zerobits" parameters are assumed to be 
     *        unsigned 32-bit integers.
     *        No additional parameter validity check would be performed on both
     *        parameters for performance reason. Behavior is undefined when any 
     *        of both is not an unsigned 32-bit integer.
     * 
     *  @param {Number} onebits
     *    - An unsigned 32-bit integer that indicates which bits of the flag
     *      should be 1.
     *  @param {Number} [zerobits]
     *    - An unsigned 32-bit integer that indicates which bits of the flag 
     *      should be 0.
     *  @param {Boolean} [nonblock]
     *    - True if non-block mode is on.
     *  @returns {?TSlimEventFlagsWaitHandle}
     *    - The wait handle (NULL if non-block mode is on and the condition is 
     *      not satisfied yet).
     */
    this.wait = function(
        onebits, 
        zerobits = 0x00000000, 
        nonblock = false
    ) {
        function _IsMatched() {
            return (
                ((u32now & onebits) == onebits) && 
                ((u32now & zerobits) == 0)
            );
        }
        if (_IsMatched()) {
            let wh = {
                "status": SlimEventFlags.STATUS_SATISFIED,
                "value": u32now,
                "cancel": DUMMY_CALLBACK
            };
            wh.handle = Promise.resolve(wh);
            return wh;
        } else {
            if (nonblock) {
                return null;
            }
            let wh = {
                "status": SlimEventFlags.STATUS_AWAIT,
                "value": null
            };
            wh.handle = new Promise(function(resolve) {
                let status = SlimEventFlags.STATUS_AWAIT;
                function _WaitHandler_Recheck() {
                    if (status != SlimEventFlags.STATUS_AWAIT) {
                        return;
                    }
                    if (!_IsMatched()) {
                        return;
                    }
                    status = SlimEventFlags.STATUS_SATISFIED;
                    wh.status = status;
                    wh.value = u32now;
                    notifiers.delete(_WaitHandler_Recheck);
                    resolve(wh);
                }
                wh.cancel = function() {
                    if (status != SlimEventFlags.STATUS_AWAIT) {
                        return;
                    }
                    status = SlimEventFlags.STATUS_CANCELLED;
                    wh.status = status;
                    notifiers.delete(_WaitHandler_Recheck);
                    resolve(wh);
                };
                notifiers.add(_WaitHandler_Recheck);
            });
            return wh;
        }
    };

    /**
     *  Wait for custom condition satisfies.
     * 
     *  @param {(flag: Number) => Boolean} chk
     *    - The custom condition satisfication checker function.
     *      - This function shall return true if the flag value satisfies the 
     *        condition.
     *      - This function shall return false otherwise.
     *  @param {Boolean} [nonblock]
     *    - True if non-block mode is on.
     *  @returns {?TSlimEventFlagsWaitHandle}
     *    - The wait handle (NULL if non-block mode is on and the condition is 
     *      not satisfied yet).
     */
    this.customWait = function(
        chk,
        nonblock = false
    ) {
        function _IsMatched() {
            try {
                return chk.call(self, u32now);
            } catch(error) {
                return false;
            }
        }
        if (_IsMatched()) {
            let wh = {
                "status": SlimEventFlags.STATUS_SATISFIED,
                "value": u32now,
                "cancel": DUMMY_CALLBACK
            };
            wh.handle = Promise.resolve(wh);
            return wh;
        } else {
            if (nonblock) {
                return null;
            }
            let wh = {
                "status": SlimEventFlags.STATUS_AWAIT,
                "value": null
            };
            wh.handle = new Promise(function(resolve) {
                let status = SlimEventFlags.STATUS_AWAIT;
                function _WaitHandler_Recheck() {
                    if (status != SlimEventFlags.STATUS_AWAIT) {
                        return;
                    }
                    if (!_IsMatched()) {
                        return;
                    }
                    status = SlimEventFlags.STATUS_SATISFIED;
                    wh.status = status;
                    wh.value = u32now;
                    notifiers.delete(_WaitHandler_Recheck);
                    resolve(wh);
                }
                wh.cancel = function() {
                    if (status != SlimEventFlags.STATUS_AWAIT) {
                        return;
                    }
                    status = SlimEventFlags.STATUS_CANCELLED;
                    wh.status = status;
                    notifiers.delete(_WaitHandler_Recheck);
                    resolve(wh);
                };
                notifiers.add(_WaitHandler_Recheck);
            });
            return wh;
        }
    };

    /**
     *  Get current flag value.
     * 
     *  @returns {Number}
     *    - The flag value.
     */
    this.current = function() {
        return u32now;
    };

    /**
     *  Modify the flag value.
     * 
     *  Note(s):
     *    [1] New flag value is calculated according to following formula:
     *          flag = (((flag | orbits) & andbits) ^ xorbits)
     *    [2] "orbits", "andbits" and "xorbits" parameters must be unsigned 
     *        32-bit integer.
     *        No additional parameter validity check would be performed on these
     *        parameters for performance reason. Behavior is undefined when any 
     *        of these parameters is not an unsigned 32-bit integer.
     * 
     *  @param {Number} orbits
     *    - The ORing bits.
     *  @param {Number} [andbits]
     *    - The ANDing bits.
     *  @param {Number} [xorbits]
     *    - The XORing bits.
     */
    this.modify = function(orbits, andbits = 0xFFFFFFFF, xorbits = 0x00000000) {
        let u32new = ((((u32now | orbits) & andbits)) ^ xorbits);
        if (u32new != u32now) {
            u32now = u32new;
            let cbs = new Set(notifiers);
            for (let cb of cbs) {
                cb.call(self);
            }
        }
    };

    /**
     *  Assign the flag value.
     * 
     *  Note(s):
     *    [1] The new flag value must be an unsigned 32-bit integer.
     *        Behavior is undefined when the new flag value is not an unsigned 
     *        32-bit integer.
     * 
     *  @param {Number} u32new
     *    - The new flag value.
     */
    this.assign = function(u32new) {
        if (u32new != u32now) {
            u32now = u32new;
            let cbs = new Set(notifiers);
            for (let cb of cbs) {
                cb.call(self);
            }
        }
    };
}

//  Slim event flags wait handler status.
SlimEventFlags.STATUS_AWAIT     = 0;
SlimEventFlags.STATUS_SATISFIED = 1;
SlimEventFlags.STATUS_CANCELLED = 2;

//  Export public APIs.
module.exports = {
    "SlimEventFlags": SlimEventFlags
};