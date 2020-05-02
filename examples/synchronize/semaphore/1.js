//
//  Copyright 2017 - 2020 The XRT Authors. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Reference(s):
//    [1] https://github.com/tomasbruckner/minimalSemaphoreDemo
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
    //  Create two semaphores.
    let sem1 = new XRTLibAsync.Synchronize.Semaphore.SemaphoreSynchronizer(0);
    let sem2 = new XRTLibAsync.Synchronize.Semaphore.SemaphoreSynchronizer(0);

    //  Thread 1.
    setTimeout(async function() {
        console.log("Thread 1 started.");
        for (let i = 1; i <= 5; ++i) {
            await sem1.wait();
            console.log("Thread 1: " + i.toString() + ".");
            sem2.signal();
        }
        console.log("Thread 1 exited.");
    }, Math.random() * 1000);

    //  Thread 2.
    setTimeout(async function() {
        console.log("Thread 2 started.");
        for (let i = 1; i <= 5; ++i) {
            sem1.signal();
            await sem2.wait();
            console.log("Thread 2: " + i.toString() + ".");
        }
        console.log("Thread 2 exited.");
    }, Math.random() * 1000);
})();