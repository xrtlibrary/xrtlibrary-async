//
//  Copyright 2017 - 2020 The XRT Authors. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Note(s):
//    [1] This example demostrates how to cancel a slim event flags wait handle.
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

    //  Do blocked waiting.
    let wh = ev.wait(0x00000001);
    wh.handle.then(function() {
        if (wh.status == SlimEventFlags.STATUS_CANCELLED) {
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