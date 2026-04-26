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
using System.Collections;
using System.IO;
using System.Linq;
using com.IvanMurzak.Unity.MCP.Editor.API;
using NUnit.Framework;
using UnityEngine.TestTools;

namespace com.IvanMurzak.Unity.MCP.Editor.Tests
{
    [TestFixture]
    public class SkillsGenerateSurvivalTests : BaseTest
    {
        const string RelativeSkillsPath = "Temp/SkillSurvival/.claude/skills";
        const string ArtifactRelativePath = "unity-mcp-specialists-v2/SKILL.md";
        const string OwnershipMarker = "<!-- GENERATED: unity-mcp-cli setup-skills specialists-v2 orchestration; CLI-owned temporary artifact; do not hand-edit. -->";

        string? _originalSkillsPath;

        string TempSkillsRootAbsolutePath => Path.Combine(
            UnityMcpPluginEditor.ProjectRootPath,
            RelativeSkillsPath.Replace('/', Path.DirectorySeparatorChar));

        string ArtifactAbsolutePath => Path.Combine(
            TempSkillsRootAbsolutePath,
            ArtifactRelativePath.Replace('/', Path.DirectorySeparatorChar));

        [UnitySetUp]
        public override IEnumerator SetUp()
        {
            yield return base.SetUp();

            CleanupTempTree();

            _originalSkillsPath = UnityMcpPluginEditor.SkillsPath;
        }

        [UnityTearDown]
        public override IEnumerator TearDown()
        {
            if (_originalSkillsPath != null)
            {
                UnityMcpPluginEditor.SkillsPath = _originalSkillsPath;
            }

            CleanupTempTree();

            yield return base.TearDown();
        }

        [UnityTest]
        public IEnumerator GenerateAll_PreservesCliOwnedArtifact_AndRestoresSkillsPath()
        {
            yield return null;

            Directory.CreateDirectory(Path.GetDirectoryName(ArtifactAbsolutePath)!);
            var sentinel = $"{OwnershipMarker}\n# sentinel\npreserve-me\n";
            File.WriteAllText(ArtifactAbsolutePath, sentinel);

            var originalSkillsPath = UnityMcpPluginEditor.SkillsPath;

            var skillsTool = new Tool_Skills();
            skillsTool.GenerateAll(RelativeSkillsPath.Replace("\\", "/"));

            Assert.AreEqual(originalSkillsPath, UnityMcpPluginEditor.SkillsPath,
                "unity-skill-generate should restore UnityMcpPluginEditor.SkillsPath after generation");

            var generatedSkillFiles = Directory
                .GetFiles(TempSkillsRootAbsolutePath, "SKILL.md", SearchOption.AllDirectories)
                .Select(path => path.Replace('\\', '/'))
                .ToArray();

            Assert.That(generatedSkillFiles.Any(path => !path.EndsWith($"/{ArtifactRelativePath}", System.StringComparison.Ordinal)),
                "Expected at least one Unity-generated skill file besides the CLI-owned artifact");

            Assert.That(File.Exists(ArtifactAbsolutePath), Is.True,
                "CLI-owned artifact should still exist after generator-seam execution");
            Assert.That(File.ReadAllText(ArtifactAbsolutePath), Is.EqualTo(sentinel),
                "Generator seam should preserve the CLI-owned artifact byte-for-byte in the parity-like temp subtree");
        }

        void CleanupTempTree()
        {
            if (Directory.Exists(TempSkillsRootAbsolutePath))
                Directory.Delete(TempSkillsRootAbsolutePath, recursive: true);
        }
    }
}
