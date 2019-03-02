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
    XRTLibAsync.Asynchronize.Loop.RunAsynchronousLoop(function() {
        //  Reject with an error here.
        return Promise.reject(new Error("This is an error."));
    }).catch(function(error) {
        console.error(error);
    });
})();