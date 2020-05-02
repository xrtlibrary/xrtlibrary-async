//
//  Copyright 2017 - 2020 The XRT Authors. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Imports.
//

//  Imported modules.
const XRTLibAsync = require("./../../../");

//  Imported classes.
const EventFlags = XRTLibAsync.Synchronize.Event.EventFlags;

//
//  Main entry.
//
(async function() {
    //  Define bits.
    const BIT1 = (1 << 0);
    const BIT2 = (1 << 1);

    //  Create an event flag object.
    let flags = new EventFlags(BIT2);

    //  Set BIT1 after 1 second.
    setTimeout(function() {
        flags.post(BIT1, EventFlags.POST_FLAG_SET);
    }, 1000);

    //  Wait for BIT1 to be set and consume the bit.
    console.log("Before value: " + flags.value.toString());  //  => 2
    console.log("Awaiting...");
    let affected = await flags.pend(
        BIT1, 
        EventFlags.PEND_FLAG_SET_ALL + EventFlags.PEND_FLAG_CONSUME
    );
    console.log("Affected bit(s) mask: " + affected.toString());
    console.log("After value: " + flags.value.toString());  //  => 2
})().then(function() {
    console.log("Finished.");
}).catch(function(error) {
    console.error("Thrown:");
    console.error(error);
});