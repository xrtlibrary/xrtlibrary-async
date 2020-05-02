//
//  Copyright 2017 - 2020 The XRT Authors. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Introduction:
//    This module contains several functions that can help you create asynchron-
//    ous program flows, including:
//
//      - for statement.
//      - while statement.
//      - do...while statement.
//
//  Warning(s):
//    [1] This module has been deprecated.
//    [2] The existence of this module is ONLY for compatible. You shall NOT use
//        any API of this module in new application.
//    [3] Use JavaScript's native async/await mechanism to replace this module.
//

//
//  Public functions.
//

/**
 *  Run a loop asynchronously.
 * 
 *  @deprecated Use JavaScript's native async/await mechanism instead.
 *  @param {() => Promise} fn - The loop function.
 *  @return {Promise} - The promise object.
 */
async function RunAsynchronousLoop(fn) {
    while(true) {
        let cycle = fn();
        if (!(cycle instanceof Promise)) {
            throw new Error(
                "The loop function didn't return a Promise object."
            );
        }
        await cycle;
    }
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
async function RunAsynchronousForNext(fnCondition, fnNext, fnBody) {
    while(fnCondition()) {
        let body = fnBody();
        if (typeof(body) == "undefined" || body === null) {
            //  Do nothing.
        } else if (body instanceof Promise) {
            await body;
        } else {
            throw new Error("Body function returned an invalid object.");
        }
        fnNext();
    }
}

/**
 *  Run a do-while statement asynchronously.
 * 
 *  @deprecated Use JavaScript's native async/await mechanism instead.
 *  @param {() => Boolean} fnCondition - The condition function.
 *  @param {() => Promise} fnBody - The body function.
 *  @return {Promise} - The promise object.
 */
async function RunAsynchronousDoWhile(fnCondition, fnBody) {
    do {
        let body = fnBody();
        if (typeof(body) == "undefined" || body === null) {
            //  Do nothing.
        } else if (body instanceof Promise) {
            await body;
        } else {
            throw new Error("Body function returned an invalid object.");
        }
    } while(fnCondition());
}

//  Export public APIs.
module.exports = {
    "RunAsynchronousLoop": RunAsynchronousLoop,
    "RunAsynchronousForNext": RunAsynchronousForNext,
    "RunAsynchronousDoWhile": RunAsynchronousDoWhile
};