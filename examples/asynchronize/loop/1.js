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
    let counter = 1;
    XRTLibAsync.Asynchronize.Loop.RunAsynchronousLoop(function() {
        console.log("Loop entered: " + counter.toString() + " times.");
        if (counter == 5) {
            //  Stop the loop.
            return Promise.reject(null);
        } else {
            //  Delay one second and enter the next loop cycle.
            return new Promise(function(resolve) {
                setTimeout(function() {
                    ++counter;
                    resolve();
                }, 1000);
            });
        }
    }).catch(function() {
        console.log("Loop ended.");
    });
})();