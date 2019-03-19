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
    //  Create a queue.
    var queue = new XRTLibAsync.Promise.PromiseQueue2();

    //  Read the queue asynchronously.
    (async function() {
        while(true) {
            var item = await queue.pop();
            if (item !== null) {
                console.log(item);
            } else {
                break;
            }
        }
    })().catch(function(error) {
        if (error) {
            console.log(error);
        }
    });

    //  Write 5 numbers to the queue (1 number / second).
    var current = 1;
    var timer = setInterval(function() {
        queue.push(current);
        if (current < 5) {
            ++current;
        } else {
            queue.push(null);
            clearInterval(timer);
        }
    }, 1000);
})();