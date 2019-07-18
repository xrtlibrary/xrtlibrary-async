//
//  Copyright 2017 - 2019 The XRT Authors. All rights reserved.
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
    setTimeout(function() {
        events.emit("hello", "Javascript", "is", "good!");
    }, 1000);
    console.log("Started!");    
    console.log(await XRTLibAsync.Event.WaitEvent(events, "hello"));
})();