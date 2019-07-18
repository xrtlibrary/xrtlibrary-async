//
//  Copyright 2017 - 2019 The XRT Authors. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Introduction:
//    This module implements asynchronous lock (mutex).
//

//
//  Imports.
//

//  Imported modules.
const CrSyncSemaphore = require("./semaphore");
const CrSyncConditional = require("./conditional");
const Util = require("util");

//  Imported classes.
const ConditionalSynchronizer = CrSyncConditional.ConditionalSynchronizer;
const SemaphoreSynchronizer = CrSyncSemaphore.SemaphoreSynchronizer;

//
//  Classes.
//

/**
 *  Lock synchronizer error.
 * 
 *  @constructor
 *  @extends {Error}
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
 *    [2] The order of acquiring the lock depends on the order of lock-acquire 
 *        operations.
 *    [3] The earlier the lock-acquire operation requests, the earlier the 
 *        lock-acquire operation acquires the lock.
 *    [4] The implementation promises that the order of acquiring the lock is 
 *        highly reliable and the behavior won't be changed in future releases 
 *        of this library.
 * 
 *  @constructor
 */
function LockSynchronizer() {
    //
    //  Members.
    //

    //  Lock semaphore.
    let semaphore = new SemaphoreSynchronizer(1);

    //
    //  Public methods.
    //

    /**
     *  Acquire the lock.
     * 
     *  Exception(s):
     *    [1] LockSynchronizer.OperationCancelledError: 
     *        Raised when the cancellator was activated.
     * 
     *  @param {ConditionalSynchronizer} [cancellator] - The cancellator.
     *  @return {Promise<ConditionalSynchronizer>} - The promise object (
     *                                               resolves with the release 
     *                                               synchronizer if succeed, 
     *                                               rejects if error occurred).
     */
    this.acquire = async function(
        cancellator = new ConditionalSynchronizer()
    ) {
        try {
            await semaphore.wait(cancellator);
        } catch(error) {
            if (
                error instanceof SemaphoreSynchronizer.OperationCancelledError
            ) {
                throw new LockSynchronizerOperationCancelledError(
                    error.message || "The cancellator was activated."
                );
            } else {
                //  Generally this won't happen.
                throw new LockSynchronizerError(
                    error.message || "Unknown error."
                );
            }
        }
        let releaser = new ConditionalSynchronizer();
        releaser.wait().then(function() {
            semaphore.signal();
        });
        return releaser;
    };
}
LockSynchronizer.Error = 
    LockSynchronizerError;
LockSynchronizer.OperationCancelledError = 
    LockSynchronizerOperationCancelledError;

//
//  Inheritances.
//
Util.inherits(LockSynchronizerError, Error);
Util.inherits(LockSynchronizerOperationCancelledError, LockSynchronizerError);

//  Export public APIs.
module.exports = {
    "LockSynchronizer": LockSynchronizer
};