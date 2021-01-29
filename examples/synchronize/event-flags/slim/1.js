//
//  Copyright 2017 - 2020 The XRT Authors. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Note(s):
//    [1] This example demostrates non-block mode and blocking mode operation of
//        the slim event flags.
//

//
//  Imports.
//

//  Imported modules.
const XRTLibAsync = 
    require("./../../../../");

//  Imported classes.
const SlimEventFlags = 
    XRTLibAsync.Synchronize.Event.SlimEventFlags;

//
//  Main.
//
(async function() {
    let ev = new SlimEventFlags(0x00000000);

    //  Non-block wait success example.
    let wh = ev.wait(0x00000000, 0xFFFFFFFF, true);
    if (wh !== null) {
        console.log("Non-block wait succeed.");
    }

    //  Non-block wait failure example.
    wh = ev.wait(0x00000001, 0x00000000, true);
    if (wh === null) {
        console.log("Non-block wait failed.");
    }

    //  Blocked wait example.
    ev.wait(0x00000001, 0x00000000).handle.then(function() {
        console.log("Blocked wait succeed.");
    });
    setTimeout(function() {
        ev.modify(0xFFFFFFFF);
    }, 1000);
})().catch(function(error) {
    console.log(error);
});