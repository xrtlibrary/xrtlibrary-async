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
    var queue = new XRTLibAsync.Promise.PromiseQueue();

    //  Create 5 get request.
    for (var i = 1; i <= 5; ++i) {
        (function(_i) {
            var cancellator = new XRTLibAsync.Synchronize.Conditional.ConditionalSynchronizer();
            setTimeout(function() {
                cancellator.fullfill();
            }, i * 1000);
            queue.get(cancellator).then(function(item) {
                console.log("Operation " + _i.toString() + " finished, text: \"" + item + "\".");
            }, function() {
                console.log("Operation " + _i.toString() + " has been cancelled.");
            });
        })(i);
    }

    //  But only put 2 items.
    setTimeout(function() {
        queue.put("This item is for operation 3");
    }, 2500);
    setTimeout(function() {
        queue.put("This item is for operation 5");
    }, 4500);
})();