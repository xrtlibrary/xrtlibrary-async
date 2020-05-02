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
const Events = require("events");

//
//  Main entry.
//
(async function() {
    let events = new Events.EventEmitter();
    let cancellator = new XRTLibAsync.Synchronize.Conditional.ConditionalSynchronizer();
    setTimeout(function() {
        events.emit("hello", "Javascript", "is", "good!");
    }, 2000);
    setTimeout(function() {
        cancellator.fullfill();
    }, 1000);
    console.log("Started!");    
    console.log(await XRTLibAsync.Event.WaitEvent(events, "hello", cancellator));
})().catch(function(error) {
    console.log(error.message);
});