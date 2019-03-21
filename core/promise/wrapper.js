//
//  Copyright 2017 - 2019 The XRT Authors. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Introduction:
//    This module implements a wrapper to wrap the resolve/reject functions of a
//    Promise object.
//

//
//  Classes.
//

/**
 *  Promise context wrapper.
 * 
 *  @constructor
 *  @template T
 *  @param {(value: T) => void} resolve - The resolve function.
 *  @param {(reason: *) => void} reject - The reject function.
 */
function PromiseWrapper(resolve, reject) {
    //
    //  Public methods.
    //

    /**
     *  Get the resolve function.
     * 
     *  @return {(value: T) => void} - The resolve function.
     */
    this.getResolveFunction = function() {
        return resolve;
    };

    /**
     *  Get the reject function.
     * 
     *  @return {(reason: *) => void} - The reject function.
     */
    this.getRejectFunction = function() {
        return reject;
    };
}

//  Export public APIs.
module.exports = {
    "PromiseWrapper": PromiseWrapper
};