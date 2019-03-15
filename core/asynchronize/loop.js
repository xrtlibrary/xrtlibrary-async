//
//  Copyright 2017 - 2019 The XRT Authors. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Imports
//

//  Imported modules.
var CrAsyncWaterfall = require("./waterfall");

//
//  Public functions.
//

/**
 *  Run a loop asynchronously.
 * 
 *  @deprecated Use JavaScript's native async/await mechanism instead.
 *  @param {function(): Promise} fn - The loop function.
 *  @return {Promise} - The promise object.
 */
function RunAsynchronousLoop(fn) {
    return new Promise(function(_resolve, _reject) {
        /**
         *  Loop cycle.
         */
        function _Cycle() {
            var cycle = fn();
            if (!(cycle instanceof Promise)) {
                _reject("The loop function didn't return a Promise object.");
                return;
            }
            cycle.then(function() {
                //  Run the next cycle.
                _Cycle();
            }, function(reason) {
                //  Break the loop.
                _reject(reason);
            });
        }

        //  Run the first cycle.
        _Cycle();
    });
}

/**
 *  Run a for-next statement asynchronously.
 * 
 *  @deprecated Use JavaScript's native async/await mechanism instead.
 *  @param {() => Boolean} fnCondition - The condition function.
 *  @param {() => void} fnNext - The next function.
 *  @param {() => Promise} fnBody - The body function.
 *  @return {Promise} - The promise object.
 */
function RunAsynchronousForNext(fnCondition, fnNext, fnBody) {
    return new Promise(function(forNextResolve, forNextReject) {
        RunAsynchronousLoop(function() {
            return CrAsyncWaterfall.CreateWaterfallPromise([
                function() {
                    try {
                        if (!fnCondition()) {
                            return Promise.reject(null);
                        }
                        var body = fnBody();
                    } catch(error) {
                        return Promise.reject(error);
                    }
                    if (typeof(body) == "undefined" || body === null) {
                        return Promise.resolve();
                    } else if (body instanceof Promise) {
                        return body;
                    } else {
                        return Promise.reject(new Error("Body function returned an invalid object."));
                    }
                },
                function() {
                    try {
                        fnNext();
                    } catch(error) {
                        return Promise.reject(error);
                    }
                    return Promise.resolve();
                }
            ]);
        }).catch(function(error) {
            if (error !== null) {
                forNextReject(error);
                return;
            }
            forNextResolve();
        });
    });
}

/**
 *  Run a do-while statement asynchronously.
 * 
 *  @deprecated Use JavaScript's native async/await mechanism instead.
 *  @param {() => Boolean} fnCondition - The condition function.
 *  @param {() => Promise} fnBody - The body function.
 *  @return {Promise} - The promise object.
 */
function RunAsynchronousDoWhile(fnCondition, fnBody) {
    return new Promise(function(wwNextResolve, wwReject) {
        RunAsynchronousLoop(function() {
            return CrAsyncWaterfall.CreateWaterfallPromise([
                function() {
                    try {
                        var body = fnBody();
                    } catch(error) {
                        return Promise.reject(error);
                    }
                    if (typeof(body) == "undefined" || body === null) {
                        return Promise.resolve();
                    } else if (body instanceof Promise) {
                        return body;
                    } else {
                        return Promise.reject(new Error("Body function returned an invalid object."));
                    }
                },
                function() {
                    try {
                        if (!fnCondition()) {
                            return Promise.reject(null);
                        }
                    } catch(error) {
                        return Promise.reject(error);
                    }
                    return Promise.resolve();
                }
            ]);
        }).catch(function(error) {
            if (error !== null) {
                wwReject(error);
                return;
            }
            wwNextResolve();
        });
    });
}

//  Export public APIs.
module.exports = {
    "RunAsynchronousLoop": RunAsynchronousLoop,
    "RunAsynchronousForNext": RunAsynchronousForNext,
    "RunAsynchronousDoWhile": RunAsynchronousDoWhile
};