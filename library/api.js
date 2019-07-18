//
//  Copyright 2017 - 2019 The XRT Authors. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE.md file.
//

//
//  Imports.
//

//  Imported modules.
const CrAsyncLoop = require("./../core/asynchronize/loop");
const CrAsyncPreempt = require("./../core/asynchronize/preempt");
const CrAsyncTimeout = require("./../core/asynchronize/timeout");
const CrAsyncWaterfall = require("./../core/asynchronize/waterfall");
const CrEventWaiter = require("./../core/event/waiter");
const CrPromiseQueue = require("./../core/promise/queue");
const CrPromiseQueue2 = require("./../core/promise/queue2");
const CrPromiseWrapper = require("./../core/promise/wrapper");
const CrSyncConditional = require("./../core/synchronize/conditional");
const CrSyncLock = require("./../core/synchronize/lock");
const CrSyncNotify = require("./../core/synchronize/notify");
const CrSyncPoll = require("../core/synchronize/poll");
const CrSyncSemaphore = require("./../core/synchronize/semaphore");

//  Export public APIs.
module.exports = {
    "Asynchronize": {
        "Loop": {
            "RunAsynchronousLoop": CrAsyncLoop.RunAsynchronousLoop,
            "RunAsynchronousForNext": CrAsyncLoop.RunAsynchronousForNext,
            "RunAsynchronousDoWhile": CrAsyncLoop.RunAsynchronousDoWhile
        },
        "Preempt": {
            "PreemptResolve": CrAsyncPreempt.PreemptResolve,
            "PreemptReject": CrAsyncPreempt.PreemptReject,
            "CreatePreemptivePromise": CrAsyncPreempt.CreatePreemptivePromise
        },
        "Timeout": {
            "TimeoutPromiseError": CrAsyncTimeout.TimeoutPromiseError,
            "TimeoutPromiseOperationCancelledError": CrAsyncTimeout.TimeoutPromiseOperationCancelledError,
            "CreateTimeoutPromise": CrAsyncTimeout.CreateTimeoutPromise,
            "CreateTimeoutPromiseEx": CrAsyncTimeout.CreateTimeoutPromiseEx
        },
        "Waterfall": {
            "CreateWaterfallPromise": CrAsyncWaterfall.CreateWaterfallPromise
        }
    },
    "Event": {
        "EventWaiterError": CrEventWaiter.EventWaiterError,
        "EventWaiterOperationCancelledError": CrEventWaiter.EventWaiterOperationCancelledError,
        "WaitEvent": CrEventWaiter.WaitEvent
    },
    "Promise": {
        "PROMISEQUEUEOP_POP": CrPromiseQueue.PROMISEQUEUEOP_POP,
        "PROMISEQUEUEOP_PUSH": CrPromiseQueue.PROMISEQUEUEOP_PUSH,
        "PromiseQueue": CrPromiseQueue.PromiseQueue,
        "PromiseQueue2": CrPromiseQueue2.PromiseQueue,
        "PromiseWrapper": CrPromiseWrapper.PromiseWrapper
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
            "PollError": CrSyncPoll.PollError,
            "PollOperationCancelledError": CrSyncPoll.PollOperationCancelledError,
            "PollFor": CrSyncPoll.PollFor,
            "PollForEx": CrSyncPoll.PollForEx
        }
    }
};