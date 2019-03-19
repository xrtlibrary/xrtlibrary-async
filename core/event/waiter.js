//
//  Copyright 2017 - 2019 The XRT Authors. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Imports.
//

//  Imported modules.
var CrAsyncPreempt = require("./../asynchronize/preempt");
var CrSyncConditional = require("./../synchronize/conditional");
var Events = require("events");
var Util = require("util");

//  Imported classes.
var ConditionalSynchronizer = CrSyncConditional.ConditionalSynchronizer;
var EventEmitter = Events.EventEmitter;

//
//  Classes.
//

/**
 *  Event waiter error.
 * 
 *  @constructor
 *  @param {String} [message] - The message.
 */
function EventWaiterError(message) {
    //  Let parent class initialize.
    if (arguments.length > 0) {
        Error.call(this, message);
        this.message = message;
    } else {
        Error.call(this);
        this.message = "Unknown error.";
    }
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
}

/**
 *  Event waiter operation cancelled error.
 * 
 *  @constructor
 *  @extends {EventWaiterError}
 *  @param {String} [message] - The message.
 */
function EventWaiterOperationCancelledError(message) {
    //  Let parent class initialize.
    EventWaiterError.apply(this, arguments);
}

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
 *  Exception(s):
 *    [1] EventWaiterOperationCancelledError - Raised when the cancellator was activated.
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
            throw new EventWaiterOperationCancelledError("The cancellator was already activated.");
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
            throw new EventWaiterOperationCancelledError("The cancellator was activated.");
        } else if (wh == wh2) {
            return rsv.getValue();
        } else {
            throw new EventWaiterError("BUG: Invalid wait handler.");
        }
    } else {
        return await new Promise(function(resolve) {
            handler.once(name, function() {
                resolve(CopyArguments(arguments));
            });
        });
    }
}

//
//  Inheritances.
//
Util.inherits(EventWaiterError, Error);
Util.inherits(EventWaiterOperationCancelledError, EventWaiterError);

//  Export public APIs.
module.exports = {
    "EventWaiterError": EventWaiterError,
    "EventWaiterOperationCancelledError": EventWaiterOperationCancelledError,
    "WaitEvent": WaitEvent
};