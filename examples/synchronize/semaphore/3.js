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
const XRTLibAsync = require("./../../../");

//
//  Main entry.
//
(function() {
    //  Create a semaphore.
    let sem = new XRTLibAsync.Synchronize.Semaphore.SemaphoreSynchronizer(1);

    //  Create task 1.
    {
        sem.wait().then(function() {
            console.log("Task 1 acquired the semaphore.");
            return XRTLibAsync.Asynchronize.Timeout.CreateTimeoutPromise(5000);
        }).then(function() {
            console.log("Task 1 released the semaphore.");
            sem.signal();
        });
    }

    //  Create task 2.
    {
        let cancellator = new XRTLibAsync.Synchronize.Conditional.ConditionalSynchronizer();
        sem.wait(cancellator).then(function() {
            //  Never goes here.
            console.log("Task 2 acquired the semaphore.");
            return XRTLibAsync.Asynchronize.Timeout.CreateTimeoutPromise(5000);
        }).then(function() {
            //  Never goes here.
            console.log("Task 2 released the semaphore.");
            sem.signal();
        }).catch(function() {
            console.log("Task 2 unable to acquire the semaphore.");
        });
        setTimeout(function() {
            cancellator.fullfill();
        }, 2500);
    }
})();