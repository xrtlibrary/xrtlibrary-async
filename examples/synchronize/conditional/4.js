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
    let sync = new XRTLibAsync.Synchronize.Conditional.ConditionalSynchronizer();
    sync.fullfill();
    sync.wait().then(function() {
        console.log("This message should be displayed immediately after startup.");
        sync.unfullfill();
        return sync.wait();
    }).then(function() {
        console.log("This message should be displayed 1 second later.");
    });
    setTimeout(function() {
        sync.fullfill();
    }, 1000);
})();