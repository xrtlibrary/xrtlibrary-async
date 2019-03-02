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
    var cancellator = new XRTLibAsync.Synchronize.Conditional.ConditionalSynchronizer();
    var sync = new XRTLibAsync.Synchronize.Conditional.ConditionalSynchronizer();
    sync.waitWithCancellator(cancellator).then(function() {
        //  Never goes here.
        console.log("... oops ...");
    }).catch(function(error) {
        console.log(error.message);
    });
    setTimeout(function() {
        cancellator.fullfill();
    }, 1000);
    setTimeout(function() {
        sync.fullfill();
    }, 2000);
})();