//
//  Copyright 2017 - 2019 The XRT Authors. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Imports.
//

//  Imported modules.
var CrAsyncPreempt = require("./preempt");
var CrSyncConditional = require("./../synchronize/conditional");
var XRTLibTimer = require("xrtlibrary-timer");
var Util = require("util");

//  Imported classes.
var ConditionalSynchronizer = CrSyncConditional.ConditionalSynchronizer;

//
//  Classes.
//

/**
 *  Timeout promise error.
 * 
 *  @constructor
 *  @param {String} [message] - The message.
 */
function TimeoutPromiseError(message) {
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
 *  Timeout promise operation cancelled error.
 * 
 *  @constructor
 *  @extends {TimeoutPromiseError}
 *  @param {String} [message] - The message.
 */
function TimeoutPromiseOperationCancelledError(message) {
    //  Let parent class initialize.
    TimeoutPromiseError.apply(this, arguments);
}

//
//  Public functions.
//

/**
 *  Create a timeout promise which resolves after specific duration (timespan).
 * 
 *  @param {Number} timespan - The duration (timespan).
 *  @param {*} [value] - (Optional) The resolve value.
 *  @return {Promise} - The promise object.
 */
function CreateTimeoutPromise(timespan, value) {
    return new Promise(function(resolve) {
        XRTLibTimer.SetTimeout(function() {
            resolve(value);
        }, timespan);
    });
}

/**
 *  Create a timeout promise which resolves after specific duration (timespan) with a cancellable mechanism.
 * 
 *  Exception(s):
 *    [1] TimeoutPromiseOperationCancelledError: Raised when the cancellator was activated.
 * 
 *  @param {Number} timespan - The duration (timespan).
 *  @param {ConditionalSynchronizer} cancellator - The cancellator.
 *  @param {*} [value] - (Optional) The resolve value.
 *  @return {Promise} - The promise object (reject when cancelled).
 */
async function CreateTimeoutPromiseEx(timespan, cancellator, value) {
    //  Check the cancellator.
    if (cancellator.isFullfilled()) {
        throw new TimeoutPromiseOperationCancelledError("The cancellator was already activated.");
    }

    //  Create a timer.
    var timerSync = new ConditionalSynchronizer();
    var timer = XRTLibTimer.SetTimeout(function() {
        timer = null;
        timerSync.fullfill();
    }, timespan);

    //  Wait for signals.
    var cts = new ConditionalSynchronizer();
    var wh1 = timerSync.waitWithCancellator(cts);
    var wh2 = cancellator.waitWithCancellator(cts);
    var rsv = await CrAsyncPreempt.CreatePreemptivePromise([wh1, wh2]);

    //  Handle different signals.
    cts.fullfill();
    if (timer !== null) {
        //  Stop the timer.
        XRTLibTimer.ClearTimeout(timer);
        timer = null;
    }
    var wh = rsv.getPromiseObject();
    if (wh == wh1) {
        return value;
    } else if (wh == wh2) {
        throw new TimeoutPromiseOperationCancelledError("The cancellator was activated.");
    } else {
        throw new TimeoutPromiseError("BUG: Invalid wait handler.");
    }
}

//
//  Inheritances.
//
Util.inherits(TimeoutPromiseError, Error);
Util.inherits(TimeoutPromiseOperationCancelledError, TimeoutPromiseError);

//  Export public APIs.
module.exports = {
    "TimeoutPromiseError": TimeoutPromiseError,
    "TimeoutPromiseOperationCancelledError": TimeoutPromiseOperationCancelledError,
    "CreateTimeoutPromise": CreateTimeoutPromise,
    "CreateTimeoutPromiseEx": CreateTimeoutPromiseEx
};