//
//  Copyright 2017 - 2019 The XRT Authors. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Classes.
//

/**
 *  Preempt resolve container.
 * 
 *  @param {*} value - The value.
 *  @param {Promise} promise - The promise object.
 */
function PreemptResolve(value, promise) {
    //
    //  Public methods.
    //

    /**
     *  Get the value.
     * 
     *  @return {*} - The value.
     */
    this.getValue = function() {
        return value;
    };

    /**
     *  Get the promise object.
     * 
     *  @return {Promise} - The promise object.
     */
    this.getPromiseObject = function() {
        return promise;
    };
}

/**
 *  Preempt reject container.
 * 
 *  @param {*} reason - The reason.
 *  @param {Promise} promise - The promise object.
 */
function PreemptReject(reason, promise) {
    //
    //  Public methods.
    //

    /**
     *  Get the reason.
     * 
     *  @return {*} - The reason.
     */
    this.getReason = function() {
        return reason;
    };

    /**
     *  Get the promise object.
     * 
     *  @return {Promise} - The promise object.
     */
    this.getPromiseObject = function() {
        return promise;
    };
}

//
//  Public functions.
//

/**
 *  Create a preemptive promise (the first finish/failed task will take over the promise).
 * 
 *  @param {Promise[]} tasks - The tasks.
 *  @return {Promise<PreemptResolve>} - The waterfall promise.
 */
function CreatePreemptivePromise(tasks) {
    return new Promise(function(resolve, reject) {
        var preempted = false;
        for (var i = 0; i < tasks.length; ++i) {
            (function(_i) {
                var task = tasks[_i];
                task.then(function(_value) {
                    if (preempted) {
                        return;
                    }
                    preempted = true;
                    resolve(new PreemptResolve(_value, task));
                }, function(_error) {
                    if (preempted) {
                        return;
                    }
                    preempted = true;
                    reject(new PreemptReject(_error, task));
                });
            })(i);
        }
    });
}

//  Export public APIs.
module.exports = {
    "PreemptResolve": PreemptResolve,
    "PreemptReject": PreemptReject,
    "CreatePreemptivePromise": CreatePreemptivePromise
};