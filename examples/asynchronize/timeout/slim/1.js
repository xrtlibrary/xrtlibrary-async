//
//  Copyright 2017 - 2020 The XRT Authors. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Note(s):
//    [1] This example demostrates how to create and wait for a slim timeout 
//        wait handle.
//

//
//  Imports.
//

//  Imported modules.
const XRTLibAsync = 
    require("./../../../../");

//  Imported functions.
const WaitTimeoutSlim = 
    XRTLibAsync.Asynchronize.Timeout.WaitTimeoutSlim;

//
//  Main entry.
//
(function() {
    let startupTime = Date.now();
    WaitTimeoutSlim(1000).handle.then(function() {
        console.log(
            "Elapsed " + 
            (Date.now() - startupTime).toString() + 
            " milliseconds."
        );
    });
})();