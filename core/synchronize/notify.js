//
//  Copyright 2017 - 2020 The XRT Authors. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Introduction:
//    This module implements a notification synchronizer.
//
//  Warning(s):
//    [1] This module has been deprecated.
//    [2] The existence of this module is ONLY for compatible. You shall NOT use
//        any API of this module in new application.
//

//
//  Classes.
//

/**
 *  Notification synchronizer.
 * 
 *  @deprecated - Use EventEmitter instead.
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
    let targets = new Set();

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
    this.notify = function(...args) {
        targets.forEach(function(fn) {
            fn.apply(this, args);
        });
    };
}

//  Export public APIs.
module.exports = {
    "NotificationSynchronizer": NotificationSynchronizer
};