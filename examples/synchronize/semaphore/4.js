//
//  Copyright 2017 - 2020 The XRT Authors. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Note(s):
//    [1] In this demostration, we simulate a connection pool with size 10 and 
//        100 parallel connections.
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
    //  Create a semaphore.
    let sem = new XRTLibAsync.Synchronize.Semaphore.SemaphoreSynchronizer(0);

    //  See the acquiring order.
    for (let i = 1; i <= 10; ++i) {
        sem.wait().then(function() {
            console.log(i.toString() + " acquired.");
        });
    }

    //  Give 10 tokens.
    (async function() {
        for (let i = 0; i < 10; ++i) {
            await XRTLibAsync.Asynchronize.Timeout.CreateTimeoutPromise(500);
            sem.signal();
        }
    })();
})();