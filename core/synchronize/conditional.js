//
//  Copyright 2017 - 2019 The XRT Authors. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Imports.
//

//  Imported modules.
var Util = require("util");

//
//  Classes.
//

/**
 *  Conditional synchronizer error.
 * 
 *  @constructor
 *  @param {String} [message] - The message.
 */
function ConditionalSynchronizerError(message) {
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
 *  Conditional synchronizer operation cancelled error.
 * 
 *  @constructor
 *  @extends {ConditionalSynchronizerError}
 *  @param {String} [message] - The message.
 */
function ConditionalSynchronizerOperationCancelledError(message) {
    //  Let parent class initialize.
    ConditionalSynchronizerError.apply(this, arguments);
}

/**
 *  Conditional synchronizer invalid operation error.
 * 
 *  @constructor
 *  @extends {ConditionalSynchronizerError}
 *  @param {String} [message] - The message.
 */
function ConditionalSynchronizerInvalidOperationError(message) {
    //  Let parent class initialize.
    ConditionalSynchronizerError.apply(this, arguments);
}

/**
 *  Conditional synchronizer index out of range error.
 * 
 *  @constructor
 *  @extends {ConditionalSynchronizerError}
 *  @param {String} [message] - The message.
 */
function ConditionalSynchronizerIndexOutOfRangeError(message) {
    //  Let parent class initialize.
    ConditionalSynchronizerError.apply(this, arguments);
}

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
     *  Exception(s):
     *    [1] ConditionalSynchronizer.OperationCancelledError: Raised when the the cancellator 
     *                                                         was activated.
     * 
     *  @param {ConditionalSynchronizer} cancellator - The cancellator.
     *  @return {Promise<T>} - The promise object (reject when cancelled before fullfilled).
     */
    this.waitWithCancellator = function(cancellator) {
        return new Promise(function(resolve, reject) {
            if (cancellator.isFullfilled()) {
                reject(new ConditionalSynchronizerOperationCancelledError("The cancellator was already activated."));
                return;
            }
            if (fullfilled) {
                resolve(fullfillData);
            } else {
                cancellator.wait().then(function() {
                    if (waiting.has(resolve)) {
                        waiting.delete(resolve);
                        reject(new ConditionalSynchronizerOperationCancelledError("The cancellator was activated."));
                    }
                });
                waiting.add(resolve);
            }
        });
    };

    /**
     *  Mark the condition as fullfilled.
     * 
     *  Note(s):
     *    [1] If the synchronizer has already been fullfilled, calling to this method would be 
     *        ignored.
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
     * 
     *  Note(s):
     *    [1] If the synchronizer is not fullfilled, calling to this method would be ignored.
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
     *  Exception(s):
     *    [1] ConditionalSynchronizer.InvalidOperationError: Raised when the synchronizer 
     *                                                       is not fullfilled.
     * 
     *  @return {T} - The data (throw an error if not fullfilled).
     */
    this.getFullfilledData = function() {
        //  Check fullfilled.
        if (!fullfilled) {
            throw new ConditionalSynchronizerInvalidOperationError("Not fullfilled yet.");
        }

        return fullfillData;
    };
}
ConditionalSynchronizer.Error = ConditionalSynchronizerError;
ConditionalSynchronizer.OperationCancelledError = ConditionalSynchronizerOperationCancelledError;
ConditionalSynchronizer.InvalidOperationError = ConditionalSynchronizerInvalidOperationError;
ConditionalSynchronizer.IndexOutOfRangeError = ConditionalSynchronizerIndexOutOfRangeError;

/**
 *  Wait for all conditional synchronizers to be fullfilled.
 * 
 *  @param {ConditionalSynchronizer[]} synchronizers - The synchronizers.
 *  @return {Promise<Array>} - The promise object.
 */
ConditionalSynchronizer.waitAll = async function(synchronizers) {
    var values = [];
    for (var i = 0; i < synchronizers.length; ++i) {
        values.push(await (synchronizers[i].wait()));
    }
    return values;
};

/**
 *  Wait for all conditional synchronizers to be fullfilled with a cancellable mechanism.
 * 
 *  Exception(s):
 *    [1] ConditionalSynchronizer.OperationCancelledError: Raised when the the cancellator 
 *                                                         was activated.
 * 
 *  @param {ConditionalSynchronizer[]} synchronizers - The synchronizers.
 *  @param {ConditionalSynchronizer} cancellator - The cancellator.
 *  @return {Promise<Array>} - The promise object (reject if cancelled).
 */
ConditionalSynchronizer.waitAllWithCancellator = async function(synchronizers, cancellator) {
    if (cancellator.isFullfilled()) {
        throw new ConditionalSynchronizerOperationCancelledError("The cancellator has already been activated.");
    }
    var values = [];
    for (var i = 0; i < synchronizers.length; ++i) {
        values.push(await (synchronizers[i].waitWithCancellator(cancellator)));
    }
    return values;
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
     *  Exception(s):
     *    [1] ConditionalSynchronizer.IndexOutOfRangeError: Raised when the index is out 
     *                                                      of range.
     * 
     *  @param {Number} index - The index.
     */
    function _AssertIndexWithinRange(index) {
        if (index < 0 || index >= total) {
            throw new ConditionalSynchronizerIndexOutOfRangeError("Index out of range.");
        }
    }

    //
    //  Public methods.
    //

    /**
     *  Wait for specific condition.
     * 
     *  Exception(s):
     *    [1] ConditionalSynchronizer.IndexOutOfRangeError: Raised when the index is out 
     *                                                      of range.
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
     *  Exception(s):
     *    [1] ConditionalSynchronizer.IndexOutOfRangeError: Raised when the index is out of range.
     *    [2] ConditionalSynchronizer.OperationCancelledError: Raised when the the cancellator was 
     *                                                         activated.
     * 
     *  @param {Number} index - The condition index.
     *  @param {ConditionalSynchronizer} cancellator - The cancellator.
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
     *  Exception(s):
     *    [1] ConditionalSynchronizer.IndexOutOfRangeError: Raised when the index is out of range.
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
            throw new ConditionalSynchronizerIndexOutOfRangeError("Invalid initial index.");
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
     *  Exception(s):
     *    [1] ConditionalSynchronizer.OperationCancelledError: Raised when the the cancellator 
     *                                                         was activated.
     * 
     *  @param {ConditionalSynchronizer} cancellator - The cancellator.
     *  @return {Promise<T>} - The promise object (reject when cancelled before fullfilled).
     */
    this.waitWithCancellator = function(cancellator) {
        return new Promise(function(resolve, reject) {
            if (cancellator.isFullfilled()) {
                reject(new ConditionalSynchronizerOperationCancelledError("The cancellator was already activated."));
                return;
            }
            cancellator.wait().then(function() {
                if (waiting.has(resolve)) {
                    waiting.delete(resolve);
                    reject(new ConditionalSynchronizerOperationCancelledError("The cancellator was activated."));
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

//
//  Inheritances.
//
Util.inherits(ConditionalSynchronizerError, Error);
Util.inherits(ConditionalSynchronizerOperationCancelledError, ConditionalSynchronizerError);
Util.inherits(ConditionalSynchronizerInvalidOperationError, ConditionalSynchronizerError);
Util.inherits(ConditionalSynchronizerIndexOutOfRangeError, ConditionalSynchronizerError);

//  Export public APIs.
module.exports = {
    "ConditionalSynchronizer": ConditionalSynchronizer,
    "MultiConditionalSynchronzier": MultiConditionalSynchronzier,
    "AutomateUnlockConditionalSynchronizer": AutomateUnlockConditionalSynchronizer
};