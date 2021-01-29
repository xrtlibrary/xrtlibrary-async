//
//  Copyright 2017 - 2020 The XRT Authors. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Note(s):
//    [1] This example demostrates how to cancel a slim timeout wait handle.
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

//  Imported constants.
const SLIMTIMEOUT_STATUS_CANCELLED = 
    XRTLibAsync.Asynchronize.Timeout.SLIMTIMEOUT_STATUS_CANCELLED;

//
//  Main entry.
//
(function() {
    //  Do waiting.
    let wh = WaitTimeoutSlim(1000);
    wh.handle.then(function() {
        if (wh.status == SLIMTIMEOUT_STATUS_CANCELLED) {
            console.log("Operation cancelled.");
        }
    });

    //  Cancel at 0.5s.
    setTimeout(function() {
        wh.cancel();
    }, 500);
})();