//
//  Copyright 2017 - 2020 The XRT Authors. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Note(s):
//    [1] This example demostrates non-block mode and blocking mode operation of
//        the slim semaphore.
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
    let sem = new SlimSemaphoreSynchronizer(2);

    //  Do non-block waiting.
    for (let i = 1; ; ++i) {
        let wh = sem.wait(true);
        if (wh == null) {
            console.log("Non-block wait failed.");
            break;
        }
        console.log("Non-block wait succeed, " + i.toString() + " trial.");
    }

    //  Do blocked waiting.
    sem.wait().handle.then(function() {
        console.log("Blocked wait succeed.");
    });
    setTimeout(function() {
        sem.signal();
    }, 1000);
})().catch(function(error) {
    console.log(error);
});