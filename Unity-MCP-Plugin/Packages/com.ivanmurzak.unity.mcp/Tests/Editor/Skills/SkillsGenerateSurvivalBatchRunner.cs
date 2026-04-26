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
    /// Batch-friendly executeMethod harness for the generator-seam survival regression.
    /// This avoids depending on Unity's -runTests XML output path in environments where
    /// the focused test is observable via TestRunnerApi but no XML result file is emitted.
    /// </summary>
    public static class SkillsGenerateSurvivalBatchRunner
    {
        static Callback? _callback;

        class Callback : ICallbacks
        {
            public bool Done;
            public int ExitCode = 1;

            public void RunStarted(ITestAdaptor testsToRun)
            {
                Debug.Log($"[SkillsGenerateSurvivalBatchRunner] RunStarted total={Count(testsToRun)}");
            }

            public void RunFinished(ITestResultAdaptor result)
            {
                Debug.Log($"[SkillsGenerateSurvivalBatchRunner] RunFinished status={result.TestStatus} total={Count(result.Test)} failCount={result.FailCount}");
                ExitCode = result.FailCount > 0 ? 2 : 0;
                Done = true;
            }

            public void TestStarted(ITestAdaptor test)
            {
                if (!test.IsSuite)
                    Debug.Log($"[SkillsGenerateSurvivalBatchRunner] TestStarted {test.FullName}");
            }

            public void TestFinished(ITestResultAdaptor result)
            {
                if (!result.Test.IsSuite)
                    Debug.Log($"[SkillsGenerateSurvivalBatchRunner] TestFinished {result.Test.FullName} => {result.TestStatus}");
            }

            static int Count(ITestAdaptor test)
                => test == null ? 0 : (!test.IsSuite ? 1 : test.Children.Sum(Count));
        }

        public static void Run()
        {
            Debug.Log("[SkillsGenerateSurvivalBatchRunner] Starting executeMethod runner");

            _callback = new Callback();
            var api = ScriptableObject.CreateInstance<TestRunnerApi>();
            api.RegisterCallbacks(_callback);
            api.Execute(new ExecutionSettings(new Filter
            {
                testMode = TestMode.EditMode,
                groupNames = new[] { "^.*\\.SkillsGenerateSurvivalTests\\.[^\\.]+$" }
            }));

            EditorApplication.update += WaitForDone;
        }

        static void WaitForDone()
        {
            if (_callback == null || !_callback.Done)
                return;

            EditorApplication.update -= WaitForDone;
            Debug.Log($"[SkillsGenerateSurvivalBatchRunner] Exiting with {_callback.ExitCode}");
            EditorApplication.Exit(_callback.ExitCode);
        }
    }
}
