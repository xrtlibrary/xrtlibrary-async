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
    XRTLibAsync.Asynchronize.Loop.RunAsynchronousDoWhile(
        function() { return false; },
        function() {
            console.log("Loop body.");
            return XRTLibAsync.Asynchronize.Timeout.CreateTimeoutPromise(1000);
        }
    ).then(function() {
        console.log("OK!");
    });
})();