//
//  Copyright 2017 - 2019 The XRT Authors. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Introduction:
//    This module implements a poll-based event waiter.
//

//
//  Imports.
//

//  Imported modules.
var CrAsyncTimeout = require("./../asynchronize/timeout");
var CrSyncConditional = require("./conditional");
var Util = require("util");

//  Imported classes.
var ConditionalSynchronizer = CrSyncConditional.ConditionalSynchronizer;
var TimeoutPromiseOperationCancelledError = 
    CrAsyncTimeout.TimeoutPromiseOperationCancelledError;

//
//  Classes.
//

/**
 *  Poll error.
 * 
 *  @constructor
 *  @param {String} [message] - The message.
 */
function PollError(message) {
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
 *  Poll operation cancelled error.
 * 
 *  @constructor
 *  @extends {PollError}
 *  @param {String} [message] - The message.
 */
function PollOperationCancelledError(message) {
    //  Let parent class initialize.
    PollError.apply(this, arguments);
}

//
//  Public functions.
//

/**
 *  Poll for a customized condition to be fullfilled.
 * 
 *  @param {() => Boolean} detector - The condition detector (return True when 
 *                                    the condition was fullfilled).
 *  @param {Number} delayMin - The minimum detect interval (must larger than 0).
 *  @param {Number} delayMax - The maximum detect interval.
 *  @param {Number} delayIncreaseRatio - The increase ratio of the detect 
 *                                       interval.
 *  @param {ConditionalSynchronizer} [cancellator] - The cancellator.
 *  @return {Promise} - The promise object (resolves when the condition 
 *                      fullfilled, rejects if error occurred).
 */
function PollFor(
    detector, 
    delayMin, 
    delayMax, 
    delayIncreaseRatio, 
    cancellator = new ConditionalSynchronizer()
) {
    return PollForEx(
        detector, 
        null, 
        delayMin, 
        delayMax, 
        delayIncreaseRatio, 
        cancellator
    );
}

/**
 *  (Extend) Poll for a customized condition to be fullfilled.
 * 
 *  Exception(s):
 *    [1] PollOperationCancelledError: 
 *        Raised when the cancellator was activated.
 * 
 *  @template T
 *  @param {() => Boolean} detector - The condition detector (return True when 
 *                                    the condition was fullfilled).
 *  @param {T} resvData - The data passed to Promise.resolve() method.
 *  @param {Number} delayMin - The minimum detect interval (must larger than 0).
 *  @param {Number} delayMax - The maximum detect interval.
 *  @param {Number} delayIncreaseRatio - The increase ratio of the detect 
 *                                       interval.
 *  @param {ConditionalSynchronizer} [cancellator] - The cancellator.
 *  @return {Promise<T>} - The promise object (resolves when the condition 
 *                         fullfilled, rejects if error occurred).
 */
async function PollForEx(
    detector, 
    resvData, 
    delayMin, 
    delayMax, 
    delayIncreaseRatio, 
    cancellator = new ConditionalSynchronizer()
) {
    //  Check the initial state of the cancellator.
    if (cancellator.isFullfilled()) {
        throw new PollOperationCancelledError(
            "The cancellator was already activated."
        );
    }

    //  Configure the initial delay.
    var delay = delayMin;

    //  Wait.
    while(true) {
        try {
            await CrAsyncTimeout.CreateTimeoutPromiseEx(delay, cancellator);
        } catch(error) {
            if (error instanceof TimeoutPromiseOperationCancelledError) {
                throw new PollOperationCancelledError(
                    "The cancellator was activated."
                );
            } else {
                //  Generally this won't happen.
                throw new PollError(error.message || "Unknown error.");
            }
        }
        if (detector.call(this)) {
            return resvData;
        }
        delay = Math.min(delay * delayIncreaseRatio, delayMax);
    }
}

//
//  Inheritances.
//
Util.inherits(PollError, Error);
Util.inherits(PollOperationCancelledError, PollError);

//  Export public APIs.
module.exports = {
    "PollError": PollError,
    "PollOperationCancelledError": PollOperationCancelledError,
    "PollFor": PollFor,
    "PollForEx": PollForEx
};