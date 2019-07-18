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
    console.log("Hello ");
    let sync = new XRTLibAsync.Synchronize.Conditional.ConditionalSynchronizer();
    sync.wait().then(function() {
        console.log("World!");
    });
    setTimeout(function() {
       sync.fullfill();
    }, 1000);
    setTimeout(function() {
        //  The condition was fullfilled one second before, so
        //  the message should be displayed immediately.
        sync.wait().then(function() {
            console.log("JavaScript is good!");
        });
    }, 2000);
})();