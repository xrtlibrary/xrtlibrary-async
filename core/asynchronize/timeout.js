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

//  Imported classes.
var ConditionalSynchronizer = CrSyncConditional.ConditionalSynchronizer;

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
 *  @param {Number} timespan - The duration (timespan).
 *  @param {ConditionalSynchronizer} cancellator - The cancellator.
 *  @param {*} [value] - (Optional) The resolve value.
 *  @return {Promise} - The promise object (reject when cancelled).
 */
async function CreateTimeoutPromiseEx(timespan, cancellator, value) {
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
        throw new Error("The cancellator was activated.");
    } else {
        throw new Error("BUG: Invalid wait handler.");
    }
}

//  Export public APIs.
module.exports = {
    "CreateTimeoutPromise": CreateTimeoutPromise,
    "CreateTimeoutPromiseEx": CreateTimeoutPromiseEx
};