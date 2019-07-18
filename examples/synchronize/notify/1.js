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
    //  Create a notifier.
    let notifier = new XRTLibAsync.Synchronize.Notify.NotificationSynchronizer();

    //  Register a callback.
    notifier.register(function(timestamp, message) {
        console.log(timestamp.toString() + " - " + message);
    });

    //  Notify every 1 second.
    setInterval(function() {
        notifier.notify(Date.now(), "Here is a message.");
    }, 1000);
})();