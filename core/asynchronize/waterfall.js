//
//  Copyright 2017 - 2019 The XRT Authors. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Public functions.
//

/**
 *  Create a waterfall promise.
 * 
 *  @deprecated Use JavaScript's native async/await mechanism instead.
 *  @param {(function(): Promise)[]} tasks - The tasks.
 *  @param {Boolean} [strictMode] - True if a task function must return with a Promise object.
 *  @return {Promise} - The waterfall promise (resolve with the the value of the lastest task).
 */
function CreateWaterfallPromise(tasks, strictMode) {
    //  No need to deal with anything if there's no task.
    if (tasks.length == 0) {
        return Promise.resolve();
    }

    //  Reset current task index.
    var current = 0;

    //  Previous task result.
    var previousResult = null;

    return new Promise(function(_resolve, _reject) {
        /**
         *  Execute current task.
         */
        function _ExecuteCurrentTask() {
            var task = tasks[current](previousResult);
            if (!strictMode) {
                if (typeof(task) == "undefined" || task === null) {
                    task = Promise.resolve();
                }
            }
            if (!(task instanceof Promise)) {
                _reject(new Error("Task is neither a Promise object nor undefined/null."));
                return;
            }
            task.then(function(_value) {
                //  Save the task result.
                previousResult = _value;

                if (current + 1 == tasks.length) {
                    //  All task executed successfully, now resolve with the lastest task result.
                    _resolve(previousResult);
                } else {
                    //  Execute the next task.
                    ++current;
                    _ExecuteCurrentTask();
                }
            }, function(_reason) {
                _reject(_reason);
            });
        }

        //  Execute the first task.
        _ExecuteCurrentTask();
    });
}

//  Export public APIs.
module.exports = {
    "CreateWaterfallPromise": CreateWaterfallPromise
};