//
//  Copyright 2017 - 2019 The XRT Authors. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Imports.
//

//  Imported modules.
const XRTLibAsync = require("./../../../");

//
//  Main entry.
//
(function() {
    //  Create a lock.
    let lock = new XRTLibAsync.Synchronize.Lock.LockSynchronizer();

    //  Create 3 tasks.
    for (let i = 1; i <= 3; ++i) {
        lock.acquire().then(function(releaser) {
            console.log("Task " + i.toString() + " acquired the lock.");
            setTimeout(function() {
                console.log("Task " + i.toString() + " released the lock.");
                releaser.fullfill();
            }, 1000);
        });
    }
})();