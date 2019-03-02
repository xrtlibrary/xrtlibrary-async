//
//  Copyright 2017 - 2019 The XRT Authors. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Reference(s):
//    [1] https://github.com/tomasbruckner/minimalSemaphoreDemo
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
    //  Create two semaphores.
    var sem1 = new XRTLibAsync.Synchronize.Semaphore.SemaphoreSynchronizer(0);
    var sem2 = new XRTLibAsync.Synchronize.Semaphore.SemaphoreSynchronizer(0);

    //  Thread 1.
    setTimeout(function() {
        console.log("Thread 1 started.");
        var i = 0;
        var counter = 1;
        XRTLibAsync.Asynchronize.Loop.RunAsynchronousForNext(
            function() { return i < 5; },
            function() { ++i; },
            function() {
                return XRTLibAsync.Asynchronize.Waterfall.CreateWaterfallPromise([
                    function() {
                        return sem1.wait();
                    },
                    function() {
                        console.log("Thread 1: " + (counter++).toString() + ".");
                        sem2.signal();
                        return Promise.resolve();
                    }
                ]);
            }
        ).then(function() {
            console.log("Thread 1 exited.");
        });
    }, Math.random() * 1000);

    //  Thread 2.
    setTimeout(function() {
        console.log("Thread 2 started.");
        var i = 0;
        var counter = 1;
        XRTLibAsync.Asynchronize.Loop.RunAsynchronousForNext(
            function() { return i < 5; },
            function() { ++i; },
            function() {
                return XRTLibAsync.Asynchronize.Waterfall.CreateWaterfallPromise([
                    function() {
                        sem1.signal();
                        return sem2.wait();
                    },
                    function() {
                        console.log("Thread 2: " + (counter++).toString() + ".");
                        return Promise.resolve();
                    }
                ]);
            }
        ).then(function() {
            console.log("Thread 2 exited.");
        });
    }, Math.random() * 1000);
})();