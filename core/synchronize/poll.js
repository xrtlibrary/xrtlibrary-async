//
//  Copyright 2017 - 2019 The XRT Authors. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Imports.
//

//  Imported modules.
var CrAsyncTimeout = require("./../asynchronize/timeout");
var CrSyncConditional = require("./conditional");

//  Imported classes.
var ConditionalSynchronizer = CrSyncConditional.ConditionalSynchronizer;

//
//  Public functions.
//

/**
 *  Poll for a customized condition to be fullfilled.
 * 
 *  @param {function(): Boolean} detector - The condition detector (return True when the condition was fullfilled).
 *  @param {Number} delayMin - The minimum detect interval (must larger than 0).
 *  @param {Number} delayMax - The maximum detect interval.
 *  @param {Number} delayIncreaseRatio - The increase ratio of the detect interval.
 *  @param {ConditionalSynchronizer} [cancellator] - The cancellator.
 *  @return {Promise} - The promise object.
 */
function PollFor(detector, delayMin, delayMax, delayIncreaseRatio, cancellator) {
    if (arguments.length > 4) {
        return PollForEx(detector, null, delayMin, delayMax, delayIncreaseRatio, cancellator);
    } else {
        return PollForEx(detector, null, delayMin, delayMax, delayIncreaseRatio);
    }
}

/**
 *  (Extend) Poll for a customized condition to be fullfilled.
 * 
 *  @template T
 *  @param {function(): Boolean} detector - The condition detector (return True when the condition was fullfilled).
 *  @param {T} resvData - The data passed to Promise.resolve() method.
 *  @param {Number} delayMin - The minimum detect interval (must larger than 0).
 *  @param {Number} delayMax - The maximum detect interval.
 *  @param {Number} delayIncreaseRatio - The increase ratio of the detect interval.
 *  @param {ConditionalSynchronizer} [cancellator] - The cancellator.
 *  @return {Promise<T>} - The promise object.
 */
async function PollForEx(detector, resvData, delayMin, delayMax, delayIncreaseRatio, cancellator) {
    if (arguments.length > 5) {
        //  Check the initial state of the cancellator.
        if (cancellator.isFullfilled()) {
            throw new Error("The cancellator was already activated.");
        }
    } else {
        //  Create a cancellator if not set.
        cancellator = new ConditionalSynchronizer();
    }

    //  Configure the initial delay.
    var delay = delayMin;

    //  Wait.
    while(true) {
        await CrAsyncTimeout.CreateTimeoutPromiseEx(delay, cancellator);
        if (detector.call(this)) {
            return resvData;
        }
        delay = Math.min(delay * delayIncreaseRatio, delayMax);
    }
}

//  Export public APIs.
module.exports = {
    "PollFor": PollFor,
    "PollForEx": PollForEx
};