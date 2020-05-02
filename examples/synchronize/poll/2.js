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

//
//  Main entry.
//
(function() {
    //  Initialize the variable to be polled.
    let pollVar = 0;

    //  Create a cancellator.
    let cancellator = new XRTLibAsync.Synchronize.Conditional.ConditionalSynchronizer();

    //  Set the variable to 1 after one second.
    setTimeout(function() {
        pollVar = 1;
    }, 1000);

    //  Cancel polling after 500 milliseconds.
    setTimeout(function() {
        cancellator.fullfill();
    }, 500);

    //  Start polling.
    XRTLibAsync.Synchronize.Poll.PollFor(
        function() {
            console.log("Polling...");
            return pollVar == 1;
        },
        1,
        50,
        1.25,
        cancellator
    ).then(function() {
        console.log("OK!");
    }).catch(function(error) {
        console.log(error.message);
    });
})();