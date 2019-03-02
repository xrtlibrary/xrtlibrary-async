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
    //  Create the waterfall.
    var waterfall = [
        function() {
            return Promise.resolve();
        },
        function() {
            //  By default (in non-strict mode), a task function without returning 
            //  anything is allowed, the next task will just be executed immediately 
            //  after current task function returns.
            //  But in the strict mode, this is not allowed.
        },
        function() {
            return Promise.resolve();
        }
    ];

    //  First, run in non-strict mode.
    XRTLibAsync.Asynchronize.Waterfall.CreateWaterfallPromise(waterfall).then(function() {
        console.log("Waterfall promise resolved in non-strict mode.");
    });

    //  Second, run in strict mode.
    XRTLibAsync.Asynchronize.Waterfall.CreateWaterfallPromise(waterfall, true).catch(function(error) {
        console.log("Waterfall promise rejected in strict mode.");
        console.log(error);
    });
})();