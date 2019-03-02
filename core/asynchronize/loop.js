//
//  Copyright 2017 - 2019 The XRT Authors. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Public functions.
//

/**
 *  Run a loop asynchronously.
 * 
 *  @param {function(): Promise} fn - The loop function.
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

//  Export public APIs.
module.exports = {
    "RunAsynchronousLoop": RunAsynchronousLoop
};