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

//
//  Main entry.
//
(function() {
    //  Create three conditions.
    let sync1 = new XRTLibAsync.Synchronize.Conditional.ConditionalSynchronizer();
    let sync2 = new XRTLibAsync.Synchronize.Conditional.ConditionalSynchronizer();
    let sync3 = new XRTLibAsync.Synchronize.Conditional.ConditionalSynchronizer();

    //  Monitor three conditions.
    sync1.wait().then(function() {
        console.log("Condition 1 was fullfilled.");
    });
    sync2.wait().then(function() {
        console.log("Condition 2 was fullfilled.");
    });
    sync3.wait().then(function() {
        console.log("Condition 3 was fullfilled.");
    });

    //  Display a message when all of them were fullfilled.
    XRTLibAsync.Synchronize.Conditional.ConditionalSynchronizer.waitAll([sync1, sync2, sync3]).then(function(values) {
        console.log("All three conditions were fullfilled.");
        console.log(values.join(" "));
    });

    //  Fullfill these conditions after some time...
    setTimeout(function() {
        sync1.fullfill("Best");
    }, 500);
    setTimeout(function() {
        sync2.fullfill("wishes");
    }, 1000);
    setTimeout(function() {
        sync3.fullfill("to you!");
    }, 1500);
})();