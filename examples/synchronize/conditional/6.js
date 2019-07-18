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
    let cancellator = new XRTLibAsync.Synchronize.Conditional.ConditionalSynchronizer();
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
    XRTLibAsync.Synchronize.Conditional.ConditionalSynchronizer.waitAllWithCancellator([sync1, sync2, sync3], cancellator).then(function() {
        //  Never goes here.
        console.log("...oops...");
    }).catch(function(error) {
        console.log(error.message);
        console.log("May be you are too busy to receive our wishes...");
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

    //  Trigger the cancellator after one second.
    setTimeout(function() {
        cancellator.fullfill();
    }, 1000);
})();