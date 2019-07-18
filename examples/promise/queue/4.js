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
    //  Create a queue.
    let queue = new XRTLibAsync.Promise.PromiseQueue();

    //  Bind queue events.
    queue.on("change", function(type, item) {
        if (type == XRTLibAsync.Promise.PROMISEQUEUEOP_PUSH) {
            console.log("Event: Push, " + JSON.stringify(item));
        } else if (type == XRTLibAsync.Promise.PROMISEQUEUEOP_POP) {
            console.log("Event: Pop, " + JSON.stringify(item));
        } else {
            throw new Error("Unknown operation type.");
        }
    });

    //  Read the queue asynchronously.
    (async function() {
        while(true) {
            await XRTLibAsync.Asynchronize.Timeout.CreateTimeoutPromise(1000);
            let item = await queue.get();
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

    //  Write 5 numbers to the queue.
    for (let i = 1; i <= 5; ++i) {
        queue.put(i);
    }
    queue.put(null);
})();