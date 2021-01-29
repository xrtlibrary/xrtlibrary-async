//
//  Copyright 2017 - 2020 The XRT Authors. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Note(s):
//    [1] This example demostrates how to customize slim event flags wait 
//        condition.
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

    //  Assign higher 16 bits at 1s.
    setTimeout(function() {
        ev.modify(0x12340000);
    }, 1000);

    //  Assign lower 16 bits at 2s.
    setTimeout(function() {
        ev.modify(0x00005678);
    }, 2000);

    //  Do blocked waiting.
    console.log("Waiting...");
    let value = (await ev.customWait(function(flag) {
        return flag == 0x12345678;
    }).handle).value;
    console.log("OK, value = 0x" + value.toString(16) + ".");
})().catch(function(error) {
    console.log(error);
});