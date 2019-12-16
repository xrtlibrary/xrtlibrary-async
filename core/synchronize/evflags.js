//
//  Copyright 2017 - 2019 The XRT Authors. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Imports.
//

//  Imported modules.
const CrAsyncPreempt = require("./../asynchronize/preempt");
const CrSyncConditional = require("./conditional");
const XRTLibBugHandler = require("xrtlibrary-bughandler");
const Util = require("util");

//  Imported classes.
const ConditionalSynchronizer = CrSyncConditional.ConditionalSynchronizer;

//  Imported functions.
const CreatePreemptivePromise = CrAsyncPreempt.CreatePreemptivePromise;
const ReportBug = XRTLibBugHandler.ReportBug;

//
//  Classes.
//

/**
 *  Event flags error.
 * 
 *  @constructor
 *  @extends {Error}
 *  @param {String} [message] - The message.
 */
function EventFlagsError(message = "") {
    //  Let parent class initialize.
    Error.call(this, message);
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = message;
}

/**
 *  Event flags parameter error.
 * 
 *  @constructor
 *  @extends {EventFlagsError}
 *  @param {String} [message] - The message.
 */
function EventFlagsParameterError(message = "") {
    //  Let parent class initialize.
    EventFlagsError.call(this, message);
}

/**
 *  Event flags invalid operation error.
 * 
 *  @constructor
 *  @extends {EventFlagsError}
 *  @param {String} [message] - The message.
 */
function EventFlagsInvalidOperationError(message = "") {
    //  Let parent class initialize.
    EventFlagsError.call(this, message);
}


/**
 *  Event flags operation cancelled error.
 * 
 *  @constructor
 *  @extends {EventFlagsError}
 *  @param {String} [message] - The message.
 */
function EventFlagsOperationCancelledError(message = "") {
    //  Let parent class initialize.
    EventFlagsError.call(this, message);
}

/**
 *  Event flags.
 * 
 *  @constructor
 *  @throws {EventFlagsParameterError}
 *      - The initial value is invalid.
 *  @param {Number} [initialValue] 
 *      - The initial flag value.
 */
function EventFlags(initialValue = 0) {
    //  Check parameters.
    if (!_IsValidFlagValue(initialValue)) {
        throw new EventFlagsParameterError("Invalid initial value.");
    }

    //
    //  Members.
    //

    //  Self reference.
    let self = this;

    /**
     *  Wait set.
     * 
     *  @type {Set<Function>}
     */
    let waitSet = new Set();

    //  Current flag value.
    let currentValue = initialValue;

    //
    //  Properties.
    //

    /**
     *  Get/set current flag value.
     * 
     *  @throws {EventFlagsParameterError}
     *      - The new value is invalid.
     *  @name EventFlags#value
     *  @type {Number}
     */
    Object.defineProperty(
        self,
        "value",
        {
            get: function() {
                return currentValue;
            },
            set: function(nvalue) {
                if (!_IsValidFlagValue(nvalue)) {
                    throw new EventFlagsParameterError("Invalid value.");
                }
                currentValue = nvalue;
                _TriggerAll();
            }
        }
    );

    //
    //  Private methods.
    //

    /**
     *  Execute all triggers.
     */
    function _TriggerAll() {
        waitSet.forEach(function(cb) {
            cb();
        });
    }

    /**
     *  Check whether a flag value is valid.
     * 
     *  @param {Number} value 
     *      - The flag value to be checked.
     *  @return {Boolean}
     *      - True if the flag value is valid.
     */
    function _IsValidFlagValue(value) {
        if (!Number.isInteger(value)) {
            return false;
        }
        if (value < 0x00000000 || value > 0xFFFFFFFF) {
            return false;
        }
        return true;
    }

    //
    //  Public methods.
    //

    /**
     *  Wait for a combination of conditions or events (i.e. bits) to be set (or
     *  cleared) in an event flag group.
     * 
     *  Note(s):
     *    [1] The application can wait for any condition to be set or cleared, 
     *        for all conditions to be set or cleared. If the events that the 
     *        caller desires are not available, the caller is blocked until the 
     *        desired conditions or events are satisfied or the cancellator was 
     *        activated.
     * 
     *  @throws {EventFlagsParameterError}
     *      - One of following error occurred:
     * 
     *          - 'flags' is not an unsigned 32-bit integer.
     *          - 'opt' contains invalid option (or combination of options).
     * 
     *  @throws {EventFlagsOperationCancelledError}
     *      - The cancellator was activated.
     *  @param {Number} flags
     *      - A bit pattern indicating which bit(s) (i.e., flags) to check. The 
     *        bits wanted are specified by setting the corresponding bits in 
     *        flags. If the application wants to wait for bits 0 and 1 to be 
     *        set, specify 0x03. The same applies if you'd want to wait for the 
     *        same 2 bits to be cleared (you'd still specify which bits by 
     *        passing 0x03).
     *  @param {Number} opt
     *      - An integer that specifies whether all bits are to be set/cleared 
     *        or any of the bits are to be set/cleared. Here are the options:
     * 
     *          - EventFlags.PEND_FLAG_CLR_ALL
     *          - EventFlags.PEND_FLAG_CLR_ANY
     *          - EventFlags.PEND_FLAG_SET_ALL
     *          - EventFlags.PEND_FLAG_SET_ANY
     * 
     *      - The caller may also specify whether the flags are consumed by 
     *        "adding" EventFlags.PEND_FLAG_CONSUME to this parameter. For 
     *        example, to wait for any flag in a group and then clear the flags 
     *        that satisfy the condition, you would set this parameter to:
     * 
     *          - EventFlags.PEND_FLAG_SET_ALL + EventFlags.PEND_FLAG_CONSUME
     * 
     *  @param {ConditionalSynchronizer} [cancellator]
     *      - The cancellator.
     *  @return {Promise<Number>}
     *      - The promise object (resolves with an integer that flags that 
     *        caused the promise object being resolved, rejects if error 
     *        occurred).
     */
    this.pend = async function(
        flags,
        opt,
        cancellator = new ConditionalSynchronizer()
    ) {
        //  Check 'flags' parameter.
        if (!_IsValidFlagValue(flags)) {
            throw new EventFlagsParameterError("Invalid flags.");
        }

        //  Check 'opt' parameter.
        let consume = false;
        switch (opt >>> 0) {
            case EventFlags.PEND_FLAG_CLR_ALL:
            case EventFlags.PEND_FLAG_CLR_ANY:
            case EventFlags.PEND_FLAG_SET_ALL:
            case EventFlags.PEND_FLAG_SET_ANY:
                break;
            case (EventFlags.PEND_FLAG_CONSUME + EventFlags.PEND_FLAG_CLR_ALL):
            case (EventFlags.PEND_FLAG_CONSUME + EventFlags.PEND_FLAG_CLR_ANY):
            case (EventFlags.PEND_FLAG_CONSUME + EventFlags.PEND_FLAG_SET_ALL):
            case (EventFlags.PEND_FLAG_CONSUME + EventFlags.PEND_FLAG_SET_ANY):
                consume = true;
                opt = ((opt & (~EventFlags.PEND_FLAG_CONSUME)) >>> 0);
                break;
            default:
                throw new EventFlagsParameterError("Invalid pend option.");
        }

        //  Return signal.
        let rsig = new ConditionalSynchronizer();

        /**
         *  Value change trigger.
         */
        function _Trigger() {
            if (!cancellator.isFullfilled()) {
                let affected = 0;
                switch (opt) {
                    case EventFlags.PEND_FLAG_CLR_ALL:
                        if (((currentValue & flags) >>> 0) != 0) {
                            return;
                        }
                        if (consume) {
                            currentValue = ((currentValue | flags) >>> 0);
                        }
                        affected = flags;
                        break;
                    case EventFlags.PEND_FLAG_CLR_ANY:
                        let tmp = ((currentValue & flags) >>> 0);
                        if (tmp == flags) {
                            return;
                        }
                        if (consume) {
                            currentValue = ((currentValue | flags) >>> 0);
                        }
                        affected = ((~tmp) >>> 0);
                        break;
                    case EventFlags.PEND_FLAG_SET_ALL:
                        if (((currentValue & flags) >>> 0) != flags) {
                            return;
                        }
                        if (consume) {
                            currentValue = ((currentValue & (~flags)) >>> 0);
                        }
                        affected = flags;
                        break;
                    case EventFlags.PEND_FLAG_SET_ANY:
                        affected = ((currentValue & flags) >>> 0);
                        if (affected == 0) {
                            return;
                        }
                        if (consume) {
                            currentValue = ((currentValue & (~flags)) >>> 0);
                        }
                        break;
                    default:
                        return;
                }
                rsig.fullfill(affected);
            }
            if (waitSet.has(_Trigger)) {
                waitSet.delete(_Trigger);
            }
        }

        //  Insert the trigger to the wait set.
        waitSet.add(_Trigger);

        //  Try current value.
        _Trigger();

        //  Wait for signals.
        let cts = new ConditionalSynchronizer();
        let wh1 = rsig.waitWithCancellator(cts);
        let wh2 = cancellator.waitWithCancellator(cts);
        let rsv = await CreatePreemptivePromise([wh1, wh2]);
        cts.fullfill();

        //  Delete the trigger.
        if (waitSet.has(_Trigger)) {
            waitSet.delete(_Trigger);
        }

        //  Handle the active signal.
        let wh = rsv.getPromiseObject();
        if (wh == wh1) {
            return rsv.getValue();
        } else if (wh == wh2) {
            if (rsig.isFullfilled()) {
                return rsig.getFullfilledData();
            }
            throw new EventFlagsOperationCancelledError(
                "The cancellator was activated."
            );
        } else {
            ReportBug("Invalid wait handler.", true, EventFlagsError);
        }
    };

    /**
     *  Set or clear event flag bits.
     * 
     *  Note(s):
     *    [1] The bits set or cleared are specified in a bit mask (i.e., the 
     *        flags parameter). The caller can set or clear bits that are 
     *        already set or cleared.
     * 
     *  @throws {EventFlagsParameterError}
     *      - One of following error occurred:
     * 
     *          - 'flags' is not an unsigned 32-bit integer.
     *          - 'opt' contains invalid option (or combination of options).
     * 
     *  @param {Number} flags
     *      - An integer that specifies which bits to be set or cleared. If opt 
     *        is EventFlags.POST_FLAG_SET, each bit that is set in flags will 
     *        set the corresponding bit in the event flag group. For example to 
     *        set bits 0, 4 and 5, you would set flags to 0x31 (note that bit 0 
     *        is the least significant bit). If opt is EventFlags.POST_FLAG_CLR,
     *        each bit that is set in flags will clear the corresponding bit in 
     *        the event flag group. For example to clear bits 0, 4, and 5, you 
     *        would specify flags as 0x31 (again, bit 0 is the least significant
     *        bit).
     *  @param {Number} opt
     *      - An integer that indicates whether the flags are set 
     *        (EventFlags.POST_FLAG_SET) or cleared (EventFlags.POST_FLAG_CLR).
     */
    this.post = function(
        flags,
        opt
    ) {
        //  Check 'flags' parameter.
        if (!_IsValidFlagValue(flags)) {
            throw new EventFlagsParameterError("Invalid flags.");
        }

        //  Check 'opt' parameter.
        switch (opt >>> 0) {
            case EventFlags.POST_FLAG_CLR:
                currentValue = ((currentValue & (~flags)) >>> 0);
                break;
            case EventFlags.POST_FLAG_SET:
                currentValue = ((currentValue | flags) >>> 0);
                break;
            default:
                throw new EventFlagsParameterError("Invalid pend option.");
        }

        //  Execute all triggers.
        _TriggerAll();
    };
}

//  Error classes.
EventFlags.Error = EventFlagsError;
EventFlags.ParameterError = EventFlagsParameterError;
EventFlags.InvalidOperationError = EventFlagsInvalidOperationError;
EventFlags.OperationCancelledError = EventFlagsOperationCancelledError;

//  Constants.
EventFlags.PEND_FLAG_CLR_ALL = 1;
EventFlags.PEND_FLAG_CLR_ANY = 2;
EventFlags.PEND_FLAG_SET_ALL = 4;
EventFlags.PEND_FLAG_SET_ANY = 8;
EventFlags.PEND_FLAG_CONSUME = 16;
EventFlags.POST_FLAG_CLR = 1;
EventFlags.POST_FLAG_SET = 2;

//
//  Inheritances.
//
Util.inherits(EventFlagsError, Error);
Util.inherits(EventFlagsParameterError, EventFlagsError);
Util.inherits(EventFlagsInvalidOperationError, EventFlagsError);
Util.inherits(EventFlagsOperationCancelledError, EventFlagsError);

//  Export public APIs.
module.exports = {
    "EventFlags": EventFlags
};