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
var FS = require("fs");
var Path = require("path");

//
//  Main entry.
//
(function() {
    XRTLibAsync.Asynchronize.Waterfall.CreateWaterfallPromise([
        function() {
            return new Promise(function(resolve, reject) {
                FS.readFile(Path.join(__dirname, "1.txt"), function(error, data) {
                    if (error) {
                        reject(error);
                        return;
                    }
                    resolve(data);
                });
            });
        },
        function(data) {
            //  The result of previous task will be passed to the first parameter 
            //  of this task.
            return Promise.resolve(parseInt(data.toString()));
        }
    ]).then(function(value) {
        //  The result of the last task will become the resolve value of the 
        //  waterfall promise.
        console.log(value);
    }).catch(function(error) {
        console.log(error);
    });
})();