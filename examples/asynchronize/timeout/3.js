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
    let cancellator = new XRTLibAsync.Synchronize.Conditional.ConditionalSynchronizer();

    XRTLibAsync.Asynchronize.Timeout.CreateTimeoutPromiseEx(5000, cancellator).then(function() {
        //  Never goes here.
        console.log("... oops ...");
    }).catch(function(error) {
        console.log(error.message);
    });

    //  Cancel after 1 second.
    setTimeout(function() {
        cancellator.fullfill();
    }, 1000);
})();