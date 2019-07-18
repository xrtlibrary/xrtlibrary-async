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
    //  Create an automate-unlock conditional synchronizer.
    let sync = new XRTLibAsync.Synchronize.Conditional.AutomateUnlockConditionalSynchronizer();

    //  Wait...
    sync.wait().then(function() {
        console.log("This message should be displayed immediately after startup.");
        return sync.wait();
    }).then(function() {
        //  The conditional was unfullfilled automatically immediately after we fullfilled it, 
        //  so this message can only be displayed when we re-fullfill it (on the second fullfill).
        console.log("This message should be displayed 1 second later.");
    });

    //  The first fullfill.
    sync.fullfill();

    //  The second fullfill.
    setTimeout(function() {
        sync.fullfill();
    }, 1000);
})();