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
using System.Reflection;
using com.IvanMurzak.McpPlugin;
using com.IvanMurzak.Unity.MCP.Editor.API;
using NUnit.Framework;

namespace com.IvanMurzak.Unity.MCP.Editor.Tests
{
    [TestFixture]
    public class SystemToolExposureTests : BaseTest
    {
        [Test]
        public void ToolManagerCatalog_DoesNotExpose_UnitySkillGenerate()
        {
            var toolManager = UnityMcpPluginEditor.Instance.Tools;
            Assert.IsNotNull(toolManager, "ToolManager should not be null");

            var toolNames = toolManager!.GetAllTools().Select(tool => tool.Name).ToArray();

            Assert.That(toolNames, Does.Not.Contain(Tool_Skills.SkillsGenerateToolId),
                "unity-skill-generate is currently not exposed through the ToolManager catalog used by BaseTest.RunTool");
        }

        [Test]
        public void ToolSkillsType_StillDeclares_UnitySkillGenerate_Metadata()
        {
            var type = typeof(Tool_Skills);
            var toolTypeAttribute = type.GetCustomAttribute<McpPluginToolTypeAttribute>();
            Assert.IsNotNull(toolTypeAttribute, "Tool_Skills should remain a declared MCP tool type");

            var generateMethod = type.GetMethod(nameof(Tool_Skills.GenerateAll));
            Assert.IsNotNull(generateMethod, "Tool_Skills.GenerateAll should exist");

            var toolAttribute = generateMethod!.GetCustomAttribute<McpPluginToolAttribute>();
            Assert.IsNotNull(toolAttribute, "GenerateAll should remain decorated as an MCP tool");
            Assert.AreEqual(Tool_Skills.SkillsGenerateToolId, toolAttribute!.Name);
            Assert.AreEqual(McpToolType.System, toolAttribute.ToolType);
        }
    }
}
