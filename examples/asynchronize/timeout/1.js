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
    var startupTime = Date.now();
    XRTLibAsync.Asynchronize.Timeout.CreateTimeoutPromise(1000).then(function() {
        console.log("Elapsed " + (Date.now() - startupTime).toString() + " milliseconds.");
    });
})();