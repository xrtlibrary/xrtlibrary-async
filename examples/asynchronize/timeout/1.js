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
    let startupTime = Date.now();
    XRTLibAsync.Asynchronize.Timeout.CreateTimeoutPromise(1000).then(function() {
        console.log("Elapsed " + (Date.now() - startupTime).toString() + " milliseconds.");
    });
})();