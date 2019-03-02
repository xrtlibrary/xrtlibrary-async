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
    var sync = new XRTLibAsync.Synchronize.Conditional.ConditionalSynchronizer();
    sync.fullfill(1000);
    sync.wait().then(function(value) {
        console.log(value);
    });
})();