//
//  Copyright 2017 - 2020 The XRT Authors. All rights reserved.
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
(async function() {
    //  Create a lock.
    let lock = new XRTLibAsync.Synchronize.Lock.LockSynchronizer();

    //  See the acquiring order.
    for (let i = 1; i <= 10; ++i) {
        let releaser = await lock.acquire();
        console.log(i.toString() + " acquired.");
        await XRTLibAsync.Asynchronize.Timeout.CreateTimeoutPromise(500);
        console.log(i.toString() + " released.");
        releaser.fullfill();
    }
})();