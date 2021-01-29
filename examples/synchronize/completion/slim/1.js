//
//  Copyright 2017 - 2020 The XRT Authors. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Note(s):
//    [1] This example demostrates non-block mode and blocking mode operation of
//        the slim completion source.
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

    //  Non-block wait failure example.
    let wh = cp.wait(true);
    if (wh === null) {
        console.log("Non-block wait failed.");
    }

    //  Blocked wait example.
    cp.wait().handle.then(function() {
        console.log("Blocked wait succeed.");

        //  Non-block wait success example.
        wh = cp.wait(true);
        if (wh !== null) {
            console.log("Non-block wait succeed.");
        }
    });

    //  Complete at 1s.
    setTimeout(function() {
        cp.complete();
    }, 1000);
})().catch(function(error) {
    console.log(error);
});