//
//  Copyright 2017 - 2019 The XRT Authors. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Imports.
//

//  Imported modules.
var CrSyncConditional = require("./conditional");
var XRTLibTimer = require("xrtlibrary-timer");

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
    return PollForEx(detector, null, delayMin, delayMax, delayIncreaseRatio, cancellator);
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
function PollForEx(detector, resvData, delayMin, delayMax, delayIncreaseRatio, cancellator) {
    if (!(cancellator instanceof ConditionalSynchronizer)) {
        cancellator = new ConditionalSynchronizer();
    }
    if (cancellator.isFullfilled()) {
        return Promise.reject(new Error("The cancellator was already activated."));
    }
    return new Promise(function(_resolve, _reject) {
        //  Configure the initial delay..
        var delay = delayMin;

        /**
         *  Timer tick.
         */
        function _Tick() {
            if (cancellator.isFullfilled()) {
                _reject(new Error("The cancellator was activated."));
                return;
            }
            try {
                if (detector.call(this)) {
                    _resolve(resvData);
                } else {
                    delay = Math.min(delay * delayIncreaseRatio, delayMax);
                    XRTLibTimer.SetTimeout(_Tick, delay);
                }
            } catch(_error) {
                _reject(_error);
            }
        }

        //  Start polling.
        XRTLibTimer.SetTimeout(_Tick, delay);
    });
}

//  Export public APIs.
module.exports = {
    "PollFor": PollFor,
    "PollForEx": PollForEx
};