//
//  Copyright 2017 - 2019 The XRT Authors. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Imports.
//

//  Imported modules.
var XRTLibAsync = require("./../../../");

//
//  Main entry.
//
(function() {
    //  Initialize the variable to be polled.
    var pollVar = 0;

    //  Set the variable to 1 after one second.
    setTimeout(function() {
        pollVar = 1;
    }, 1000);

    //  Start polling.
    XRTLibAsync.Synchronize.Poll.PollForEx(
        function() {
            console.log("Polling...");
            return pollVar == 1;
        },
        "OK!",
        1,
        50,
        1.25
    ).then(function(value) {
        console.log(value);
    });
})();