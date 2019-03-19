//
//  Copyright 2017 - 2019 The XRT Authors. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Imports.
//

//  Imported modules.
var CrSyncSemaphore = require("./semaphore");
var CrSyncConditional = require("./conditional");
var Util = require("util");

//  Imported classes.
var ConditionalSynchronizer = CrSyncConditional.ConditionalSynchronizer;
var SemaphoreSynchronizer = CrSyncSemaphore.SemaphoreSynchronizer;

//
//  Classes.
//

/**
 *  Lock synchronizer error.
 * 
 *  @constructor
 *  @param {String} [message] - The message.
 */
function LockSynchronizerError(message) {
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
 *  Lock synchronizer operation cancelled error.
 * 
 *  @constructor
 *  @extends {LockSynchronizerError}
 *  @param {String} [message] - The message.
 */
function LockSynchronizerOperationCancelledError(message) {
    //  Let parent class initialize.
    LockSynchronizerError.apply(this, arguments);
}

/**
 *  Lock synchronizer.
 * 
 *  Note(s):
 *    [1] All lock-acquire request would be queued an processed one-by-one.
 *    [2] The order of acquiring the lock depends on the order of lock-acquire operations.
 *    [3] The earlier the lock-acquire operation requests, the earlier the lock-acquire 
 *        operation acquires the lock.
 *    [4] The implementation promises that the order of acquiring the lock is highly reli-
 *        able and the behavior won't be changed in future releases of this library.
 * 
 *  @constructor
 */
function LockSynchronizer() {
    //
    //  Members.
    //

    //  Lock semaphore.
    var semaphore = new SemaphoreSynchronizer(1);

    //
    //  Public methods.
    //

    /**
     *  Acquire the lock.
     * 
     *  Exception(s):
     *    [1] LockSynchronizer.OperationCancelledError: Raised when the cancellator was activated.
     * 
     *  @param {ConditionalSynchronizer} [cancellator] - The cancellator.
     *  @return {Promise<ConditionalSynchronizer>} - The promise object (release synchronizer will be passed).
     */
    this.acquire = async function(cancellator) {
        if (arguments.length > 0) {
            try {
                await semaphore.wait(cancellator);
            } catch(error) {
                if (error instanceof SemaphoreSynchronizer.OperationCancelledError) {
                    throw new LockSynchronizerOperationCancelledError(error.message || "The cancellator was activated.");
                } else {
                    //  Generally this won't happen.
                    throw new LockSynchronizerError(error.message || "Unknown error.");
                }
            }
        } else {
            await semaphore.wait();
        }
        var releaser = new ConditionalSynchronizer();
        releaser.wait().then(function() {
            semaphore.signal();
        });
        return releaser;
    };
}
LockSynchronizer.Error = LockSynchronizerError;
LockSynchronizer.OperationCancelledError = LockSynchronizerOperationCancelledError;

//
//  Inheritances.
//
Util.inherits(LockSynchronizerError, Error);
Util.inherits(LockSynchronizerOperationCancelledError, LockSynchronizerError);

//  Export public APIs.
module.exports = {
    "LockSynchronizer": LockSynchronizer
};