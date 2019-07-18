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
    let tasks = [];
    for (let i = 0; i < 5; ++i) {
        tasks.push(XRTLibAsync.Asynchronize.Timeout.CreateTimeoutPromise((0.5 + Math.random()) * 1000, i));
    }
    tasks.push(Promise.reject(new Error("This is an error.")));
    XRTLibAsync.Asynchronize.Preempt.CreatePreemptivePromise(tasks).then(function() {
        //  Never goes here.
        console.log("... oops ...");
    }).catch(function(preempted) {
        if (preempted.getPromiseObject() === tasks[tasks.length - 1]) {
            console.log("OK, the rejected promise preempted!");
        }
    });
})();