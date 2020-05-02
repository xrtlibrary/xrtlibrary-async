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
    //  Create a queue.
    let queue = new XRTLibAsync.Promise.PromiseQueue();

    //  Read the queue asynchronously.
    (async function() {
        while(true) {
            await queue.wait();
            let item = queue.getSync();
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
    let current = 1;
    let timer = setInterval(function() {
        queue.put(current);
        if (current < 5) {
            ++current;
        } else {
            queue.put(null);
            clearInterval(timer);
        }
    }, 1000);
})();