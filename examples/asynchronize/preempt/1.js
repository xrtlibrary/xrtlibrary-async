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
    let tasks = [];
    for (let i = 0; i < 5; ++i) {
        tasks.push(XRTLibAsync.Asynchronize.Timeout.CreateTimeoutPromise(Math.random() * 1000, i));
    }
    XRTLibAsync.Asynchronize.Preempt.CreatePreemptivePromise(tasks).then(function(preempted) {
        console.log("Task " + preempted.getValue().toString() + " preempted.");
        if (preempted.getPromiseObject() !== tasks[preempted.getValue()]) {
            //  Never goes here.
            console.log("... oops ...");
        }
    });
})();