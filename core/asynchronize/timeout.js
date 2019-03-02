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
function CreateTimeoutPromiseEx(timespan, cancellator, value) {
    return new Promise(function(resolve, reject) {
        var cts = new ConditionalSynchronizer();
        var timerSync = new ConditionalSynchronizer();
        var timer = XRTLibTimer.SetTimeout(function() {
            timer = null;
            timerSync.fullfill();
        }, timespan);
        var wh1 = timerSync.waitWithCancellator(cts);
        var wh2 = cancellator.waitWithCancellator(cts);
        CrAsyncPreempt.CreatePreemptivePromise([wh1, wh2]).then(function(rsv) {
            cts.fullfill();
            if (timer !== null) {
                XRTLibTimer.ClearTimeout(timer);
                timer = null;
            }
            var wh = rsv.getPromiseObject();
            if (wh == wh1) {
                resolve(value);
            } else if (wh == wh2) {
                reject(new Error("The cancellator was activated."));
            } else {
                reject(new Error("BUG: Invalid wait handler."));
            }
        });
    });
}

//  Export public APIs.
module.exports = {
    "CreateTimeoutPromise": CreateTimeoutPromise,
    "CreateTimeoutPromiseEx": CreateTimeoutPromiseEx
};