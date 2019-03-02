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
//  Constants.
//

//  Switch states.
var SWITCH_ON = 0;
var SWITCH_OFF = 1;

//
//  Main entry.
//
(function() {
    //  Create a multi-conditional synchronizer (as a light switch).
    var sw = new XRTLibAsync.Synchronize.Conditional.MultiConditionalSynchronzier(2, SWITCH_OFF);

    //  Trigger the switch (simulate user turns on/off the switch).
    setInterval(function() {
        if (sw.getCurrent() == SWITCH_OFF) {
            sw.switch(SWITCH_ON);
        } else {
            sw.switch(SWITCH_OFF);
        }
    }, 1000);

    //  Monitor the switch.
    XRTLibAsync.Asynchronize.Loop.RunAsynchronousLoop(function() {
        return XRTLibAsync.Asynchronize.Waterfall.CreateWaterfallPromise([
            function() {
                return sw.wait(SWITCH_ON);
            },
            function() {
                //  Maybe you can drive an Arduino board and a relay to turn on your light.
                console.log("Switch ON!");
                return sw.wait(SWITCH_OFF);
            },
            function() {
                //  Now switch off the light.
                console.log("Switch OFF!");
                return Promise.resolve();
            }
        ]);
    });
})();