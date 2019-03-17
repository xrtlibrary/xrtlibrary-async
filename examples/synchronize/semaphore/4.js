//
//  Copyright 2017 - 2019 The XRT Authors. All rights reserved.
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
var XRTLibAsync = require("./../../../");

//
//  Main entry.
//
(function() {
    //  Create a semaphore.
    var sem = new XRTLibAsync.Synchronize.Semaphore.SemaphoreSynchronizer(0);

    //  See the acquiring order.
    for (var i = 1; i <= 10; ++i) {
        (function(_i) {
            sem.wait().then(function() {
                console.log(_i.toString() + " acquired.");
            });
        })(i);
    }

    //  Give 10 tokens.
    (async function() {
        for (var i = 0; i < 10; ++i) {
            await XRTLibAsync.Asynchronize.Timeout.CreateTimeoutPromise(500);
            sem.signal();
        }
    })();
})();