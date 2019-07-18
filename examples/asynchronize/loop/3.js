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
    let i = 1;
    XRTLibAsync.Asynchronize.Loop.RunAsynchronousForNext(
        function() { return i <= 5; },
        function() { ++i; },
        function() {
            console.log(i);
            return XRTLibAsync.Asynchronize.Timeout.CreateTimeoutPromise(1000);
        }
    ).then(function() {
        console.log("OK!");
    });
})();