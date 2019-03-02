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
    var sem = new XRTLibAsync.Synchronize.Semaphore.SemaphoreSynchronizer(10);

    //  Open 100 connections.
    for (var i = 1; i <= 100; ++i) {
        (function(connectionID) {
            sem.wait().then(function() {
                console.log("Connection " + connectionID.toString() + " opened (remaining " + sem.getCount().toString() + ").");
                return XRTLibAsync.Asynchronize.Timeout.CreateTimeoutPromise(Math.random() * 5000);
            }).then(function() {
                console.log("Connection " + connectionID.toString() + " closed.");
                sem.signal();
            });
        })(i);
    }
})();