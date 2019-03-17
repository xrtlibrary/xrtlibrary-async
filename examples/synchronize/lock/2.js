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

    //  See the acquiring order.
    for (var i = 1; i <= 10; ++i) {
        (async function(_i) {
            var releaser = await lock.acquire();
            console.log(_i.toString() + " acquired.");
            await XRTLibAsync.Asynchronize.Timeout.CreateTimeoutPromise(500);
            console.log(_i.toString() + " released.");
            releaser.fullfill();
        })(i);
    }
})();