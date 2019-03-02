//
//  Copyright 2017 - 2019 The XRT Authors. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Imports.
//

//  Imported modules.
var CrPromiseWrapper = require("./wrapper");
var Events = require("events");
var Util = require("util");

//  Imported classes.
var PromiseWrapper = CrPromiseWrapper.PromiseWrapper;
var EventEmitter = Events.EventEmitter;

//
//  Constants.
//

//  Promise queue operations.
var PROMISEQUEUEOP_PUSH = 0;
var PROMISEQUEUEOP_POP = 1;

//
//  Classes.
//

/**
 *  Promise queue.
 * 
 *  @template T
 *  @constructor
 *  @extends {EventEmitter}
 */
function PromiseQueue() {
    //  Let parent class initialize.
    EventEmitter.call(this);

    //
    //  Members.
    //

    /**
     *  Self reference.
     * 
     *  @type {PromiseQueue<T>}
     */
    var self = this;

    /**
     *  Waiting requests.
     * 
     *  @type {Array<PromiseWrapper<T>>}
     */
    var waiting = [];

    /**
     *  Pending items.
     * 
     *  @type {Array<T>}
     */
    var pending = [];

    //
    //  Public methods.
    //

    /**
     *  Put an item to the queue.
     * 
     *  @param {T} item - The item.
     */
    this.put = function(item) {
        self.emit("change", PROMISEQUEUEOP_PUSH, item);
        if (waiting.length != 0) {
            var pw = waiting.shift();
            pw.getResolveFunction().call(this, item);
            self.emit("change", PROMISEQUEUEOP_POP, item);
        } else {
            pending.push(item);
        }
    };

    /**
     *  Get an item from the queue.
     * 
     *  @return {Promise<T>} - The promise object (resolve with the item, never reject).
     */
    this.get = function() {
        return new Promise(function(resolve, reject) {
            if (pending.length != 0) {
                var item = pending.shift();
                resolve(item);
                self.emit("change", PROMISEQUEUEOP_POP, item);
            } else {
                waiting.push(new PromiseWrapper(resolve, reject));
            }
        });
    };

    /**
     *  Get the count of in-queue items (queue length).
     * 
     *  @return {Number} - The item count.
     */
    this.getLength = function() {
        return pending.length;
    };

    /**
     *  Clear all in-queue items.
     */
    this.clear = function() {
        while (pending.length != 0) {
            var item = pending.shift();
            self.emit("change", PROMISEQUEUEOP_POP, item);
        }
    };
}

//
//  Inheritances.
//
Util.inherits(PromiseQueue, EventEmitter);

//  Export public APIs.
module.exports = {
    "PromiseQueue": PromiseQueue,
    "PROMISEQUEUEOP_POP": PROMISEQUEUEOP_POP,
    "PROMISEQUEUEOP_PUSH": PROMISEQUEUEOP_PUSH
};