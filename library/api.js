//
//  Copyright 2017 - 2019 The XRT Authors. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Imports.
//

//  Imported modules.
var CrAsyncLoop = require("./../core/asynchronize/loop");
var CrAsyncPreempt = require("./../core/asynchronize/preempt");
var CrAsyncTimeout = require("./../core/asynchronize/timeout");
var CrAsyncWaterfall = require("./../core/asynchronize/waterfall");
var CrPromiseQueue = require("./../core/promise/queue");
var CrSyncConditional = require("./../core/synchronize/conditional");
var CrSyncLock = require("./../core/synchronize/lock");
var CrSyncNotify = require("./../core/synchronize/notify");
var CrSyncPoll = require("../core/synchronize/poll");
var CrSyncSemaphore = require("./../core/synchronize/semaphore");

//  Export public APIs.
module.exports = {
    "Asynchronize": {
        "Loop": {
            "RunAsynchronousLoop": CrAsyncLoop.RunAsynchronousLoop
        },
        "Preempt": {
            "PreemptResolve": CrAsyncPreempt.PreemptResolve,
            "PreemptReject": CrAsyncPreempt.PreemptReject,
            "CreatePreemptivePromise": CrAsyncPreempt.CreatePreemptivePromise
        },
        "Timeout": {
            "CreateTimeoutPromise": CrAsyncTimeout.CreateTimeoutPromise,
            "CreateTimeoutPromiseEx": CrAsyncTimeout.CreateTimeoutPromiseEx
        },
        "Waterfall": {
            "CreateWaterfallPromise": CrAsyncWaterfall.CreateWaterfallPromise
        }
    },
    "Promise": {
        "PROMISEQUEUEOP_POP": CrPromiseQueue.PROMISEQUEUEOP_POP,
        "PROMISEQUEUEOP_PUSH": CrPromiseQueue.PROMISEQUEUEOP_PUSH,
        "PromiseQueue": CrPromiseQueue.PromiseQueue
    },
    "Synchronize": {
        "Conditional": {
            "ConditionalSynchronizer": CrSyncConditional.ConditionalSynchronizer,
            "AutomateUnlockConditionalSynchronizer": CrSyncConditional.AutomateUnlockConditionalSynchronizer,
            "MultiConditionalSynchronzier": CrSyncConditional.MultiConditionalSynchronzier
        },
        "Lock": {
            "LockSynchronizer": CrSyncLock.LockSynchronizer
        },
        "Notify": {
            "NotificationSynchronizer": CrSyncNotify.NotificationSynchronizer
        },
        "Semaphore": {
            "SemaphoreSynchronizer": CrSyncSemaphore.SemaphoreSynchronizer
        },
        "Poll": {
            "PollFor": CrSyncPoll.PollFor,
            "PollForEx": CrSyncPoll.PollForEx
        }
    }
};