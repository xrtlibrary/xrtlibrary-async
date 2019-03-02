//
//  Copyright 2017 - 2019 The XRT Authors. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Classes.
//

/**
 *  Notification synchronizer.
 * 
 *  @template T
 *  @constructor
 */
function NotificationSynchronizer() {
    //
    //  Members.
    //

    /**
     *  Registered targets.
     * 
     *  @type {Set<((value: T) => void)>}
     */
    var targets = new Set();

    //
    //  Public methods.
    //

    /**
     *  Register a callback.
     * 
     *  @param {(value: T) => void} - The callback.
     */
    this.register = function(cb) {
        targets.add(cb);
    };

    /**
     *  Unregister a callback.
     * 
     *  @param {(value: T) => void} - The callback.
     */
    this.unregister = function(cb) {
        return targets.delete(cb);
    };

    /**
     *  Notify all callbacks.
     */
    this.notify = function() {
        var args = arguments;
        targets.forEach(function(fn) {
            fn.apply(this, args);
        });
    };
}

//  Export public APIs.
module.exports = {
    "NotificationSynchronizer": NotificationSynchronizer
};