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
    let queue = new XRTLibAsync.Promise.PromiseQueue2();

    //  Read the queue asynchronously.
    (async function() {
        let receipt = new XRTLibAsync.Promise.PromiseQueue2.Receipt();
        console.log(await queue.popWithReceipt(receipt));
        setTimeout(function() {
            console.log("Accepted the receipt.");
            receipt.getAcceptSynchronizer().fullfill();
        }, 1000);
        await receipt.getAcceptSynchronizer().wait();
        receipt = new XRTLibAsync.Promise.PromiseQueue2.Receipt();
        console.log(await queue.popWithReceipt(receipt));
        setTimeout(function() {
            console.log("Rejected the receipt.");
            receipt.getDeclineSynchronizer().fullfill();
        }, 1000);
        console.log(await queue.pop());
    })().catch(function(error) {
        if (error) {
            console.log(error);
        }
    });

    //  Write several numbers to the queue.
    queue.push(1);
    queue.push(2);
})();