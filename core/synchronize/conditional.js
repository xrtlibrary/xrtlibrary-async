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

//
//  Classes.
//

/**
 *  Conditional-based synchronizer.
 * 
 *  @template T
 *  @constructor
 */
function ConditionalSynchronizer() {
    //
    //  Members.
    //

    //  Fullfilled flag.
    var fullfilled = false;

    /**
     *  Fullfilled data.
     * 
     *  @type {?T}
     */
    var fullfillData = null;

    /**
     *  Resolvers of waiting requests.
     * 
     *  @type {Set<(value: ?T) => void>}
     */
    var waiting = new Set();

    //
    //  Public methods.
    //

    /**
     *  Wait for the condition to be fullfilled.
     * 
     *  @return {Promise<T>} - The promise object (never raise error).
     */
    this.wait = function() {
        return new Promise(function(resolve) {
            if (fullfilled) {
                resolve(fullfillData);
            } else {
                waiting.add(resolve);
            }
        });
    };

    /**
     *  Wait for the condition to be fullfilled with a cancellable mechanism.
     * 
     *  Note(s):
     *    [1] Once you called this method, a wait handle will be allocated inside the 
     *        cancellator. It's highly recommended to declare the cancellator as a l-
     *        ocal variable to avoid memory leak.
     * 
     *  @param {ConditionalSynchronizer} cancellator - The cancellator.
     *  @return {Promise<T>} - The promise object (reject when cancelled before fullfilled).
     */
    this.waitWithCancellator = function(cancellator) {
        return new Promise(function(resolve, reject) {
            if (cancellator.isFullfilled()) {
                reject(new Error("The cancellator was already activated."));
                return;
            }
            if (fullfilled) {
                resolve(fullfillData);
            } else {
                cancellator.wait().then(function() {
                    if (waiting.has(resolve)) {
                        waiting.delete(resolve);
                        reject(new Error("The cancellator was activated."));
                    }
                });
                waiting.add(resolve);
            }
        });
    };

    /**
     *  Mark the condition as fullfilled.
     * 
     *  @param {T} [data] - (Optional) The data.
     */
    this.fullfill = function(data) {
        //  Skip if the condition has already been fullfilled.
        if (fullfilled) {
            return;
        }

        //  Mark as fullfilled and save the data.
        fullfilled = true;
        fullfillData = data;

        //  Fork and clear the waiting queue.
        /**
         *  @type {Set<(value: ?T) => void>}
         */
        var execution = ForkSet(waiting);
        waiting.clear();

        //  Call all waiting resolvers.
        execution.forEach(function(callback) {
            callback.call(this, fullfillData);
        });
    };

    /**
     *  Mark the condition as unfullfilled.
     */
    this.unfullfill = function() {
        fullfilled = false;
        fullfillData = null;
    };

    /**
     *  Get whether the condition was fullfilled.
     * 
     *  @return {Boolean} - True if so.
     */
    this.isFullfilled = function() {
        return fullfilled;
    };

    /**
     *  Get the fullfilled data.
     * 
     *  @return {T} - The data (throw an error if not fullfilled).
     */
    this.getFullfilledData = function() {
        //  Check fullfilled.
        if (!fullfilled) {
            throw new Error("Not fullfilled yet.");
        }

        return fullfillData;
    };
}

/**
 *  Wait for all conditional synchronizers to be fullfilled.
 * 
 *  @param {ConditionalSynchronizer[]} synchronizers - The synchronizers.
 *  @return {Promise<Array>} - The promise object.
 */
ConditionalSynchronizer.waitAll = function(synchronizers) {
    return ConditionalSynchronizer.waitAllWithCancellator(synchronizers, new ConditionalSynchronizer());
};

/**
 *  Wait for all conditional synchronizers to be fullfilled with a cancellable mechanism.
 * 
 *  @param {ConditionalSynchronizer[]} synchronizers - The synchronizers.
 *  @param {ConditionalSynchronizer} cancellator - The cancellator.
 *  @return {Promise<Array>} - The promise object (reject if cancelled).
 */
ConditionalSynchronizer.waitAllWithCancellator = function(synchronizers, cancellator) {
    if (cancellator.isFullfilled()) {
        return Promise.reject(new Error("The cancellator has already been activated."));
    }
    if (synchronizers.length == 0) {
        return Promise.resolve([]);
    }
    return new Promise(function(resolve, reject) {
        var current = 0;
        var values = [];
        function _Next() {
            var cts = new ConditionalSynchronizer();
            var wh1 = synchronizers[current].waitWithCancellator(cts);
            var wh2 = cancellator.waitWithCancellator(cts);
            CrAsyncPreempt.CreatePreemptivePromise([wh1, wh2]).then(function(rsv) {
                cts.fullfill();
                var wh = rsv.getPromiseObject();
                if (wh == wh1) {
                    values.push(rsv.getValue());
                    if (++current >= synchronizers.length) {
                        resolve(values);
                    } else {
                        _Next();
                    }
                } else if (wh == wh2) {
                    reject(new Error("The cancellator was activated."));
                } else {
                    reject(new Error("BUG: Invalid wait handle."));
                }
            });
        }
        _Next();
    });
};

/**
 *  Switchable multi-conditions synchronizer.
 * 
 *  @template T
 *  @constructor
 *  @param {Number} total - The condition count.
 *  @param {Number} initial - The initial condition index.
 *  @param {T} [initialData] - The initial promise data.
 */
function MultiConditionalSynchronzier(total, initial, initialData) {
    //
    //  Members.
    //

    /**
     *  Conditional synchronizers.
     * 
     *  @type {Array<ConditionalSynchronizer<T>>}
     */
    var conditionals = [];

    //  Current condition index.
    var current = initial;

    //
    //  Private methods.
    //

    /**
     *  Assert the correction range of specific index.
     * 
     *  @param {Number} index - The index.
     */
    function _AssertIndexWithinRange(index) {
        if (index < 0 || index >= total) {
            throw new Error("Index out of range.");
        }
    }

    //
    //  Public methods.
    //

    /**
     *  Wait for specific condition.
     * 
     *  @param {Number} index - The condition index.
     *  @return {Promise<T>} - The promise object (never raise error.).
     */
    this.wait = function(index) {
        //  Check the index.
        _AssertIndexWithinRange(index);

        //  Wait for specific condition.
        return conditionals[index].wait();
    };

    /**
     *  Wait for specific condition with a cancellable mechanism.
     * 
     *  Note(s):
     *    [1] Once you called this method, a wait handle will be allocated inside the 
     *        cancellator. It's highly recommended to declare the cancellator as a l-
     *        ocal variable to avoid memory leak.
     * 
     *  @param {Number} index - The condition index.
     *  @param {ConditionalSynchronizer} [cancellator] - The cancellator.
     *  @return {Promise<T>} - The promise object (reject when cancelled before fullfilled).
     */
    this.waitWithCancellator = function(index, cancellator) {
        //  Check the index.
        _AssertIndexWithinRange(index);

        //  Wait for specific condition.
        return conditionals[index].waitWithCancellator(cancellator);
    }

    /**
     *  Switch to specific condition.
     * 
     *  @param {Number} - The condition index.
     *  @param {T} [data] - The promise data.
     */
    this.switch = function(index, data) {
        //  Check the index.
        _AssertIndexWithinRange(index);

        if (current == index) {
            //  Nothing to be switched.
            return;
        } else {
            //  Switch the another condition.
            conditionals[current].unfullfill();
            current = index;
            conditionals[current].fullfill(data);
        }
    }

    /**
     *  Get current condition.
     * 
     *  @return {Number} - The condition index.
     */
    this.getCurrent = function() {
        return current;
    };

    /**
     *  Get total conditions.
     * 
     *  @return {Number} - The condition count.
     */
    this.getTotal = function() {
        return total;
    };

    //
    //  Initializer.
    //
    (function() {
        //  Check the input.
        if (total < 0 || initial >= total) {
            throw new Error("Invalid construct parameters.");
        }

        //  Create conditionals.
        for (var i = 0; i < total; ++i) {
            var conditional = new ConditionalSynchronizer();
            if (i == initial) {
                conditional.fullfill(initialData);
            }
            conditionals.push(conditional);
        }
    })();
}

/**
 *  Conditional synchronizer with automatic unlock functionality.
 * 
 *  @template T
 *  @constructor
 */
function AutomateUnlockConditionalSynchronizer() {
    //
    //  Members.
    //

    /**
     *  Resolvers of waiting requests.
     * 
     *  @type {Set<(value: ?T) => void>}
     */
    var waiting = new Set();

    //
    //  Public methods.
    //

    /**
     *  Wait for the condition to be fullfilled.
     * 
     *  @return {Promise<T>} - The promise object (never raise error).
     */
    this.wait = function() {
        return new Promise(function(resolve) {
            waiting.add(resolve);
        });
    };

    /**
     *  Wait for the condition to be fullfilled with a cancellable mechanism.
     * 
     *  Note(s):
     *    [1] Once you called this method, a wait handle will be allocated inside the 
     *        cancellator. It's highly recommended to declare the cancellator as a l-
     *        ocal variable to avoid memory leak.
     * 
     *  @param {ConditionalSynchronizer} cancellator - The cancellator.
     *  @return {Promise<T>} - The promise object (reject when cancelled before fullfilled).
     */
    this.waitWithCancellator = function(cancellator) {
        return new Promise(function(resolve, reject) {
            if (cancellator.isFullfilled()) {
                reject(new Error("The cancellator was already activated."));
                return;
            }
            cancellator.wait().then(function() {
                if (waiting.has(resolve)) {
                    waiting.delete(resolve);
                    reject(new Error("The cancellator was activated."));
                }
            });
            waiting.add(resolve);
        });
    };

    /**
     *  Mark the condition as fullfilled.
     * 
     *  @param {T} [data] - (Optional) The data.
     */
    this.fullfill = function(data) {
        //  Fork and clear the waiting queue.
        /**
         *  @type {Set<(value: ?T) => void>}
         */
        var execution = ForkSet(waiting);
        waiting.clear();

        //  Call all waiting resolvers.
        execution.forEach(function(callback) {
            callback.call(this, data);
        });
    };
}

//
//  Private functions.
//

/**
 *  Fork a set.
 * 
 *  @template T
 *  @param {Set<T>} origin - The origin set.
 *  @return {Set<T>} - The forked set.
 */
function ForkSet(origin) {
    var forked = new Set();
    origin.forEach(function(item) {
        forked.add(item);
    });
    return forked;
}

//  Export public APIs.
module.exports = {
    "ConditionalSynchronizer": ConditionalSynchronizer,
    "MultiConditionalSynchronzier": MultiConditionalSynchronzier,
    "AutomateUnlockConditionalSynchronizer": AutomateUnlockConditionalSynchronizer
};