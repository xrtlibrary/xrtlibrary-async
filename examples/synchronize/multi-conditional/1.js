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
//  Constants.
//

//  Switch states.
const SWITCH_ON = 0;
const SWITCH_OFF = 1;

//
//  Main entry.
//
(function() {
    //  Create a multi-conditional synchronizer (as a light switch).
    let sw = new XRTLibAsync.Synchronize.Conditional.MultiConditionalSynchronzier(2, SWITCH_OFF);

    //  Trigger the switch (simulate user turns on/off the switch).
    setInterval(function() {
        if (sw.getCurrent() == SWITCH_OFF) {
            sw.switch(SWITCH_ON);
        } else {
            sw.switch(SWITCH_OFF);
        }
    }, 1000);

    //  Monitor the switch.
    (async function() {
        while(true) {
            //  Wait for the switch to be turned ON.
            await sw.wait(SWITCH_ON);

            //  Maybe you can drive an Arduino board and a relay to turn on your light.
            console.log("Switch ON!");

            //  Wait for the switch to be turned OFF.
            await sw.wait(SWITCH_OFF);

            //  Now switch off the light.
            console.log("Switch OFF!");
        }
    })();
})();