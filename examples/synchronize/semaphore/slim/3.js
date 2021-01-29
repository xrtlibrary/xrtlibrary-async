//
//  Copyright 2017 - 2020 The XRT Authors. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Note(s):
//    [1] This example demostrates how to cancel a slim semaphore wait handle.
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

    //  Do blocked waiting.
    let wh = sem.wait();
    wh.handle.then(function() {
        if (wh.status == SlimSemaphoreSynchronizer.STATUS_CANCELLED) {
            console.log("Operation cancelled.");
        }
    });

    //  Cancel at 1s.
    setTimeout(function() {
        wh.cancel();
    }, 1000);
})().catch(function(error) {
    console.log(error);
});