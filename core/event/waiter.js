//
//  Copyright 2017 - 2019 The XRT Authors. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Introduction:
//    This module implements several functions that helps you handle events.
//

//
//  Imports.
//

//  Imported modules.
const CrAsyncPreempt = require("./../asynchronize/preempt");
const CrSyncConditional = require("./../synchronize/conditional");
const XRTLibBugHandler = require("xrtlibrary-bughandler");
const Events = require("events");
const Util = require("util");

//  Imported classes.
const ConditionalSynchronizer = CrSyncConditional.ConditionalSynchronizer;
const EventEmitter = Events.EventEmitter;
const ReportBug = XRTLibBugHandler.ReportBug;

//
//  Classes.
//

/**
 *  Event waiter error.
 * 
 *  @constructor
 *  @extends {Error}
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
    let result = [];
    for (let i = 0; i < args.length; ++i) {
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
 *    [1] EventWaiterOperationCancelledError:
 *        Raised when the cancellator was activated.
 * 
 *  @param {EventEmitter} handler - The event handler.
 *  @param {String} name - The event name.
 *  @param {ConditionalSynchronizer} [cancellator] - The cancellator.
 *  @return {Promise<Array>} - The promise object (resolves with the event 
 *                             arguments if succeed, rejects if error occurred).
 */
async function WaitEvent(
    handler, 
    name, 
    cancellator = new ConditionalSynchronizer()
) {
    //  Check the cancellator state.
    if (cancellator.isFullfilled()) {
        throw new EventWaiterOperationCancelledError(
            "The cancellator was already activated."
        );
    }

    //  Create synchronizers.
    let syncEvent = new ConditionalSynchronizer();

    /**
     *  Handle the event.
     */
    function _HandleEvent() {
        syncEvent.fullfill(CopyArguments(arguments));
    }

    //  Wait for the event.
    handler.once(name, _HandleEvent);

    //  Wait for signals.
    let cts = new ConditionalSynchronizer();
    let wh1 = cancellator.waitWithCancellator(cts);
    let wh2 = syncEvent.waitWithCancellator(cts);
    let rsv = await CrAsyncPreempt.CreatePreemptivePromise([wh1, wh2]);

    //  Handle different signals.
    cts.fullfill();
    let wh = rsv.getPromiseObject();
    if (wh == wh1) {
        handler.removeListener(name, _HandleEvent);
        throw new EventWaiterOperationCancelledError(
            "The cancellator was activated."
        );
    } else if (wh == wh2) {
        return rsv.getValue();
    } else {
        ReportBug("Invalid wait handler.", true, EventWaiterError);
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