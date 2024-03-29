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
    const BIT3 = (1 << 2);

    //  Create an event flag object.
    let flags = new EventFlags();

    //  Set BIT1 and BIT2 after 1 second.
    setTimeout(function() {
        flags.post(BIT1 + BIT2, EventFlags.POST_FLAG_SET);
    }, 1000);

    //  Clear BIT1 and BIT2 after 2 seconds.
    setTimeout(function() {
        flags.post(BIT1 + BIT2, EventFlags.POST_FLAG_CLR);
    }, 2000);

    //  Wait for any of 3 bits to be set.
    console.log("Awaiting...");
    let affected = await flags.pend(
        BIT1 + BIT2 + BIT3, 
        EventFlags.PEND_FLAG_SET_ANY
    );
    console.log("Affected bit(s) mask: " + affected.toString());  //  => 3

    //  Wait for the affected bit(s) to be cleared.
    console.log("Awaiting...");
    await flags.pend(
        affected,
        EventFlags.PEND_FLAG_CLR_ALL
    );
})().then(function() {
    console.log("Finished.");
}).catch(function(error) {
    console.error("Thrown:");
    console.error(error);
});