//
//  Copyright 2017 - 2019 The XRT Authors. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Imports.
//

//  Imported modules.
var XRTLibAsync = require("./../../../");

//
//  Main entry.
//
(function() {
    //  Create a lock.
    var lock = new XRTLibAsync.Synchronize.Lock.LockSynchronizer();

    //  Create 3 tasks.
    for (var i = 1; i <= 3; ++i) {
        (function(_i) {
            lock.acquire().then(function(releaser) {
                console.log("Task " + _i.toString() + " acquired the lock.");
                setTimeout(function() {
                    console.log("Task " + _i.toString() + " released the lock.");
                    releaser.fullfill();
                }, 1000);
            });
        })(i);
    }
})();