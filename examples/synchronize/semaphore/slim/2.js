//
//  Copyright 2017 - 2020 The XRT Authors. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Note(s):
//    [1] This example demostrates releasing a slim semaphore forever.
//

//
//  Imports.
//

//  Imported modules.
const XRTLibAsync = 
    require("./../../../../");

//  Imported classes.
const SlimSemaphoreSynchronizer = 
    XRTLibAsync.Synchronize.Semaphore.SlimSemaphoreSynchronizer;

//
//  Main.
//
(async function() {
    let sem = new SlimSemaphoreSynchronizer(0);

    //  Give 2 signals at 1s.
    setTimeout(function() {
        sem.signal();
        sem.signal();
    }, 1000);

    //  Release forever at 2s.
    setTimeout(function() {
        sem.forever();
    }, 2000);

    //  Wait a lot of times.
    for (let i = 1; i <= 10; ++i) {
        await sem.wait().handle;
        console.log("Got " + i.toString() + " signal.");
    }
})().catch(function(error) {
    console.log(error);
});