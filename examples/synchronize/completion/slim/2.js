//
//  Copyright 2017 - 2020 The XRT Authors. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Note(s):
//    [1] This example demostrates how to cancel a slim completion source wait 
//        handle.
//

//
//  Imports.
//

//  Imported modules.
const XRTLibAsync = 
    require("./../../../../");

//  Imported classes.
const SlimCompletion = 
    XRTLibAsync.Synchronize.Completion.SlimCompletion;

//
//  Main.
//
(async function() {
    let cp = new SlimCompletion();

    //  Do blocked waiting.
    let wh = cp.wait();
    wh.handle.then(function() {
        if (wh.status == SlimCompletion.STATUS_CANCELLED) {
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