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

//  Imported classes.
var ConditionalSynchronizer = CrSyncConditional.ConditionalSynchronizer;

//
//  Classes.
//

/**
 *  Lock synchronizer.
 * 
 *  @constructor
 */
function LockSynchronizer() {
    //
    //  Members.
    //

    //  Lock semaphore.
    var semaphore = new CrSyncSemaphore.SemaphoreSynchronizer(1);

    //
    //  Public methods.
    //

    /**
     *  Acquire the lock.
     * 
     *  @param {ConditionalSynchronizer} [cancellator] - The cancellator.
     *  @return {Promise<ConditionalSynchronizer>} - The promise object (release synchronizer will be passed).
     */
    this.acquire = async function(cancellator) {
        if (arguments.length > 0) {
            await semaphore.wait(cancellator);
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

//  Export public APIs.
module.exports = {
    "LockSynchronizer": LockSynchronizer
};