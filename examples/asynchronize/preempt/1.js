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
    var tasks = [];
    for (var i = 0; i < 5; ++i) {
        tasks.push(XRTLibAsync.Asynchronize.Timeout.CreateTimeoutPromise(Math.random(), i));
    }
    XRTLibAsync.Asynchronize.Preempt.CreatePreemptivePromise(tasks).then(function(preempted) {
        console.log("Task " + preempted.getValue().toString() + " preempted.");
        if (preempted.getPromiseObject() !== tasks[preempted.getValue()]) {
            //  Never goes here.
            console.log("... oops ...");
        }
    });
})();