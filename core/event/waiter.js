//
//  Copyright 2017 - 2019 The XRT Authors. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Imports.
//

//  Imported modules.
var Events = require("events");
var CrAsyncPreempt = require("./../asynchronize/preempt");
var CrSyncConditional = require("./../synchronize/conditional");

//  Imported classes.
var ConditionalSynchronizer = CrSyncConditional.ConditionalSynchronizer;
var EventEmitter = Events.EventEmitter;

//
//  Private functions.
//

/**
 *  Copy arguments.
 * 
 *  @param {Array} args - The arguments to be copied.
 *  @return {Array} - The copied arguments.
 */
function CopyArguments(args) {
    var result = [];
    for (var i = 0; i < args.length; ++i) {
        result.push(args[i]);
    }
    return result;
}

//
//  Public functions.
//

/**
 *  Wait for an event.
 * 
 *  @param {EventEmitter} handler - The event handler.
 *  @param {String} name - The event name.
 *  @param {ConditionalSynchronizer} [cancellator] - The cancellator.
 *  @return {Promise<Array>} - The promise object (resolves with the event arguments if succeed, rejects when cancelled).
 */
async function WaitEvent(handler, name, cancellator) {
    if (arguments.length > 2) {
        //  Check the cancellator state.
        if (cancellator.isFullfilled()) {
            throw new Error("The cancellator was already activated.");
        }

        //  Create synchronizers.
        var syncEvent = new ConditionalSynchronizer();

        /**
         *  Handle the event.
         */
        function _HandleEvent() {
            syncEvent.fullfill(CopyArguments(arguments));
        }

        //  Wait for the event.
        handler.once(name, _HandleEvent);

        //  Wait for signals.
        var cts = new ConditionalSynchronizer();
        var wh1 = cancellator.waitWithCancellator(cts);
        var wh2 = syncEvent.waitWithCancellator(cts);
        var rsv = await CrAsyncPreempt.CreatePreemptivePromise([wh1, wh2]);

        //  Handle different signals.
        cts.fullfill();
        var wh = rsv.getPromiseObject();
        if (wh == wh1) {
            handler.removeListener(name, _HandleEvent);
            throw new Error("The cancellator was activated.");
        } else if (wh == wh2) {
            return rsv.getValue();
        } else {
            throw new Error("BUG: Invalid wait handler.");
        }
    } else {
        return await new Promise(function(resolve) {
            handler.once(name, function() {
                resolve(CopyArguments(arguments));
            });
        });
    }
}

//  Export public APIs.
module.exports = {
    "WaitEvent": WaitEvent
};