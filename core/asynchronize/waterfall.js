//
//  Copyright 2017 - 2020 The XRT Authors. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Introduction:
//    This module contains a helper function that can help you create generic a-
//    synchronous waterfall program flows.
//
//  Warning(s):
//    [1] This module has been deprecated.
//    [2] The existence of this module is ONLY for compatible. You shall NOT 
//        use any API of this module in new application.
//    [3] Use JavaScript's native async/await mechanism to replace this mod-
//        ule.
//

//
//  Public functions.
//

/**
 *  Create a waterfall promise.
 * 
 *  @deprecated Use JavaScript's native async/await mechanism instead.
 *  @param {(() => Promise)[]} tasks - The tasks.
 *  @param {Boolean} [strictMode] - True if a task function must return with a 
 *                                  Promise object.
 *  @return {Promise} - The waterfall promise (resolve with the the value of the
 *                      lastest task).
 */
async function CreateWaterfallPromise(tasks, strictMode) {
    let lastest = undefined;
    for (let i = 0; i < tasks.length; ++i) {
        let task = tasks[i](lastest);
        if (!strictMode) {
            if (typeof(task) == "undefined" || task === null) {
                lastest = undefined;
                continue;
            }
        }
        if (!(task instanceof Promise)) {
            throw new Error(
                "Task is neither a Promise object nor undefined/null."
            );
        }
        lastest = await task;
    }
    return lastest;
}

//  Export public APIs.
module.exports = {
    "CreateWaterfallPromise": CreateWaterfallPromise
};