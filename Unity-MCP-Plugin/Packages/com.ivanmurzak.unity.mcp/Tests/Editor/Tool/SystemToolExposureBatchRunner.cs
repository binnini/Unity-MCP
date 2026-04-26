/*
┌──────────────────────────────────────────────────────────────────┐
│  Author: Ivan Murzak (https://github.com/IvanMurzak)             │
│  Repository: GitHub (https://github.com/IvanMurzak/Unity-MCP)    │
│  Copyright (c) 2025 Ivan Murzak                                  │
│  Licensed under the Apache License, Version 2.0.                 │
│  See the LICENSE file in the project root for more information.  │
└──────────────────────────────────────────────────────────────────┘
*/

#nullable enable
using System.Linq;
using UnityEditor;
using UnityEditor.TestTools.TestRunner.Api;
using UnityEngine;

namespace com.IvanMurzak.Unity.MCP.Editor.Tests
{
    /// <summary>
    /// Batch-friendly executeMethod harness for the ToolManager/system-tool exposure contract.
    /// </summary>
    public static class SystemToolExposureBatchRunner
    {
        const string LogPrefix = "[SystemToolExposureBatchRunner]";

        static Callback? _callback;

        class Callback : ICallbacks
        {
            public bool Done;
            public int ExitCode = 1;
            public int ExpectedLeafTests;
            public int ObservedLeafStarts;
            public int ObservedLeafFinishes;

            public void RunStarted(ITestAdaptor testsToRun)
            {
                ExpectedLeafTests = Count(testsToRun);
                Debug.Log($"{LogPrefix} RunStarted total={ExpectedLeafTests}");
            }

            public void RunFinished(ITestResultAdaptor result)
            {
                Debug.Log(
                    $"{LogPrefix} RunFinished status={result.TestStatus} treeTotal={Count(result.Test)} failCount={result.FailCount} expected={ExpectedLeafTests} observedStarts={ObservedLeafStarts} observedFinishes={ObservedLeafFinishes}");

                if (ExpectedLeafTests <= 0)
                    ExitCode = 3;
                else if (ObservedLeafStarts < ExpectedLeafTests || ObservedLeafFinishes < ExpectedLeafTests)
                    ExitCode = 4;
                else
                    ExitCode = result.FailCount > 0 ? 2 : 0;

                Done = true;
            }

            public void TestStarted(ITestAdaptor test)
            {
                if (!test.IsSuite)
                {
                    ObservedLeafStarts++;
                    Debug.Log($"{LogPrefix} TestStarted {test.FullName}");
                }
            }

            public void TestFinished(ITestResultAdaptor result)
            {
                if (!result.Test.IsSuite)
                {
                    ObservedLeafFinishes++;
                    Debug.Log($"{LogPrefix} TestFinished {result.Test.FullName} => {result.TestStatus}");
                }
            }

            static int Count(ITestAdaptor test)
            {
                if (test == null)
                    return 0;

                if (!test.IsSuite)
                    return 1;

                return test.Children.Sum(Count);
            }
        }

        public static void Run()
        {
            Debug.Log($"{LogPrefix} Starting executeMethod runner");

            _callback = new Callback();
            var api = ScriptableObject.CreateInstance<TestRunnerApi>();
            api.RegisterCallbacks(_callback);
            api.Execute(new ExecutionSettings(new Filter
            {
                testMode = TestMode.EditMode,
                groupNames = new[] { "^.*\\.SystemToolExposureTests\\.[^\\.]+$" }
            }));

            EditorApplication.update += WaitForDone;
        }

        static void WaitForDone()
        {
            if (_callback == null || !_callback.Done)
                return;

            EditorApplication.update -= WaitForDone;
            Debug.Log($"{LogPrefix} Exiting with {_callback.ExitCode}");
            EditorApplication.Exit(_callback.ExitCode);
        }
    }
}
