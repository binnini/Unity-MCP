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
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;
using com.IvanMurzak.McpPlugin;
using com.IvanMurzak.McpPlugin.Common;
using com.IvanMurzak.McpPlugin.Common.Model;
using com.IvanMurzak.Unity.MCP.Runtime.Utils;
using com.IvanMurzak.Unity.MCP.Utils;
using UnityEditor;
using UnityEditor.Animations;
using UnityEngine;
using MainThread = com.IvanMurzak.ReflectorNet.Utils.MainThread;

namespace com.IvanMurzak.Unity.MCP.Editor.API
{
    using Consts = McpPlugin.Common.Consts;

    [McpPluginResourceType]
    public partial class Resource_Animation
    {
        static readonly JsonSerializerOptions JsonOptions = new()
        {
            DefaultIgnoreCondition = JsonIgnoreCondition.Never,
            WriteIndented = false
        };

        [McpPluginResource
        (
            Name = "Animation Controllers",
            Route = "animation://controllers",
            MimeType = Consts.MimeType.TextJson,
            ListResources = nameof(AnimationControllersAll),
            Description = "List Animator Controller assets with compact read-only summary data."
        )]
        public ResponseResourceContent[] Controllers(string uri)
            => CreateJsonContent(uri, MainThread.Instance.Run(() => ListControllersPayload()));

        [McpPluginResource
        (
            Name = "Animation Controller by Path",
            Route = "animation://controller/{path}",
            MimeType = Consts.MimeType.TextJson,
            ListResources = nameof(AnimationControllersAll),
            Description = "Get a read-only Animator Controller summary by URL-escaped AssetDatabase path."
        )]
        public ResponseResourceContent[] Controller(string uri, string path)
            => CreateJsonContent(uri, MainThread.Instance.Run(() => ControllerPayload(path)));

        [McpPluginResource
        (
            Name = "Animation Clips",
            Route = "animation://clips",
            MimeType = Consts.MimeType.TextJson,
            ListResources = nameof(AnimationClipsAll),
            Description = "List AnimationClip assets with compact read-only summary data."
        )]
        public ResponseResourceContent[] Clips(string uri)
            => CreateJsonContent(uri, MainThread.Instance.Run(() => ListClipsPayload()));

        [McpPluginResource
        (
            Name = "Animation Clip by Path",
            Route = "animation://clip/{path}",
            MimeType = Consts.MimeType.TextJson,
            ListResources = nameof(AnimationClipsAll),
            Description = "Get a read-only AnimationClip summary by URL-escaped AssetDatabase path."
        )]
        public ResponseResourceContent[] Clip(string uri, string path)
            => CreateJsonContent(uri, MainThread.Instance.Run(() => ClipPayload(path)));

        [McpPluginResource
        (
            Name = "Animation Character by Current Scene Path",
            Route = "animation://character/{id}",
            MimeType = Consts.MimeType.TextJson,
            Description = "Get a read-only Animator binding summary by URL-escaped current-scene GameObject path."
        )]
        public ResponseResourceContent[] Character(string uri, string id)
            => CreateJsonContent(uri, MainThread.Instance.Run(() => CharacterPayload(id)));

        [McpPluginResource
        (
            Name = "Pending Animation Review Sessions",
            Route = "review://animation/pending",
            MimeType = Consts.MimeType.TextJson,
            Description = "Return the static read-only pending animation review placeholder for Slice 3."
        )]
        public ResponseResourceContent[] PendingReviews(string uri)
            => CreateJsonContent(uri, MainThread.Instance.Run(PendingReviewsPayload));

        public ResponseListResource[] AnimationControllersAll() => MainThread.Instance.Run(() =>
            FindAssetPaths("t:AnimatorController")
                .Select(path => new ResponseListResource(
                    uri: $"animation://controller/{Uri.EscapeDataString(path)}",
                    name: System.IO.Path.GetFileNameWithoutExtension(path),
                    enabled: true,
                    mimeType: Consts.MimeType.TextJson))
                .ToArray());

        public ResponseListResource[] AnimationClipsAll() => MainThread.Instance.Run(() =>
            FindAssetPaths("t:AnimationClip")
                .Select(path => new ResponseListResource(
                    uri: $"animation://clip/{Uri.EscapeDataString(path)}",
                    name: System.IO.Path.GetFileNameWithoutExtension(path),
                    enabled: true,
                    mimeType: Consts.MimeType.TextJson))
                .ToArray());

        static ResponseResourceContent[] CreateJsonContent(string uri, object payload)
            => ResponseResourceContent.CreateText(
                uri: uri,
                mimeType: Consts.MimeType.TextJson,
                text: JsonSerializer.Serialize(payload, JsonOptions)
            ).MakeArray();

        static ListPayload<ControllerListItem> ListControllersPayload()
            => new()
            {
                Items = FindAssetPaths("t:AnimatorController")
                    .Select(path => SummarizeControllerListItem(path))
                    .ToArray(),
                Warnings = Array.Empty<string>()
            };

        static DetailPayload<ControllerDetailItem> ControllerPayload(string encodedPath)
        {
            var (path, error) = DecodeAssetPath(encodedPath, "INVALID_CONTROLLER_PATH");
            if (error != null)
                return DetailPayload<ControllerDetailItem>.Failure(error);

            var controller = AssetDatabase.LoadAssetAtPath<AnimatorController>(path!);
            if (controller == null)
            {
                return DetailPayload<ControllerDetailItem>.Failure(new ResourceError
                {
                    Code = "CONTROLLER_NOT_FOUND",
                    Message = $"Animator Controller not found at '{path}'."
                });
            }

            return new DetailPayload<ControllerDetailItem>
            {
                Item = SummarizeControllerDetail(path!, controller),
                Warnings = BuildControllerWarnings(controller).ToArray(),
                Error = null
            };
        }

        static ListPayload<ClipListItem> ListClipsPayload()
            => new()
            {
                Items = FindAssetPaths("t:AnimationClip")
                    .Select(path => SummarizeClipListItem(path))
                    .ToArray(),
                Warnings = Array.Empty<string>()
            };

        static DetailPayload<ClipDetailItem> ClipPayload(string encodedPath)
        {
            var (path, error) = DecodeAssetPath(encodedPath, "INVALID_CLIP_PATH");
            if (error != null)
                return DetailPayload<ClipDetailItem>.Failure(error);

            var clip = AssetDatabase.LoadAssetAtPath<AnimationClip>(path!);
            if (clip == null)
            {
                return DetailPayload<ClipDetailItem>.Failure(new ResourceError
                {
                    Code = "CLIP_NOT_FOUND",
                    Message = $"AnimationClip not found at '{path}'."
                });
            }

            return new DetailPayload<ClipDetailItem>
            {
                Item = SummarizeClipDetail(path!, clip),
                Warnings = Array.Empty<string>(),
                Error = null
            };
        }

        static DetailPayload<CharacterDetailItem> CharacterPayload(string encodedId)
        {
            var id = Uri.UnescapeDataString(encodedId ?? string.Empty);
            if (string.IsNullOrWhiteSpace(id))
            {
                return DetailPayload<CharacterDetailItem>.Failure(new ResourceError
                {
                    Code = "INVALID_CHARACTER_PATH",
                    Message = "Character id must be a URL-escaped current-scene GameObject path."
                });
            }

            if (int.TryParse(id, out _) || LooksLikeGuid(id))
            {
                return DetailPayload<CharacterDetailItem>.Failure(new ResourceError
                {
                    Code = "UNSUPPORTED_CHARACTER_ID",
                    Message = "Character id must be a current-scene GameObject path, not an InstanceID, GUID, or transient handle."
                });
            }

            var go = GameObjectUtils.FindByPath(id);
            if (go == null)
            {
                return DetailPayload<CharacterDetailItem>.Failure(new ResourceError
                {
                    Code = "CHARACTER_NOT_FOUND",
                    Message = $"GameObject path '{id}' was not found in the current scene."
                });
            }

            var animator = go.GetComponent<Animator>();
            var warnings = new List<string>();
            if (animator == null)
                warnings.Add("Animator component is missing.");
            else
            {
                if (animator.runtimeAnimatorController == null)
                    warnings.Add("Runtime Animator Controller is missing.");
                if (animator.avatar == null)
                    warnings.Add("Avatar is missing.");
            }

            return new DetailPayload<CharacterDetailItem>
            {
                Item = SummarizeCharacter(id, go, animator),
                Warnings = warnings.ToArray(),
                Error = null
            };
        }

        static ReviewPendingPayload PendingReviewsPayload()
            => new()
            {
                Sessions = Array.Empty<object>(),
                Warnings = Array.Empty<string>()
            };

        static string[] FindAssetPaths(string filter)
            => AssetDatabase.FindAssets(filter)
                .Select(AssetDatabase.GUIDToAssetPath)
                .Where(path => !string.IsNullOrWhiteSpace(path))
                .OrderBy(path => path, StringComparer.Ordinal)
                .ToArray();

        static (string? Path, ResourceError? Error) DecodeAssetPath(string encodedPath, string code)
        {
            var path = Uri.UnescapeDataString(encodedPath ?? string.Empty);
            if (string.IsNullOrWhiteSpace(path))
            {
                return (null, new ResourceError
                {
                    Code = code,
                    Message = "Asset path must be a URL-escaped project-relative AssetDatabase path."
                });
            }

            if (!path.StartsWith("Assets/", StringComparison.Ordinal))
            {
                return (null, new ResourceError
                {
                    Code = code,
                    Message = $"Asset path '{path}' must start with 'Assets/'."
                });
            }

            return (path, null);
        }

        static bool LooksLikeGuid(string value)
            => value.Length == 32 && value.All(Uri.IsHexDigit);

        static ControllerListItem SummarizeControllerListItem(string path)
        {
            var controller = AssetDatabase.LoadAssetAtPath<AnimatorController>(path);
            if (controller == null)
            {
                return new ControllerListItem
                {
                    Path = path,
                    Name = System.IO.Path.GetFileNameWithoutExtension(path),
                    LayerCount = 0,
                    ParameterCount = 0,
                    StateCount = 0,
                    ClipCount = 0
                };
            }

            return new ControllerListItem
            {
                Path = path,
                Name = controller.name,
                LayerCount = controller.layers?.Length ?? 0,
                ParameterCount = controller.parameters?.Length ?? 0,
                StateCount = CollectStates(controller).Length,
                ClipCount = CollectLinkedClips(controller).Length
            };
        }

        static ControllerDetailItem SummarizeControllerDetail(string path, AnimatorController controller)
        {
            var layers = (controller.layers ?? Array.Empty<AnimatorControllerLayer>())
                .Select(layer => new ControllerLayerItem
                {
                    Name = layer.name ?? string.Empty,
                    StateCount = CountStates(layer.stateMachine),
                    TransitionCount = CountTransitions(layer.stateMachine),
                    DefaultState = layer.stateMachine?.defaultState?.name ?? string.Empty
                })
                .ToArray();

            var parameters = (controller.parameters ?? Array.Empty<AnimatorControllerParameter>())
                .Select(parameter => new ControllerParameterItem
                {
                    Name = parameter.name ?? string.Empty,
                    Type = parameter.type.ToString(),
                    DefaultBool = parameter.defaultBool,
                    DefaultFloat = parameter.defaultFloat,
                    DefaultInt = parameter.defaultInt
                })
                .OrderBy(parameter => parameter.Name, StringComparer.Ordinal)
                .ToArray();

            var states = CollectStates(controller)
                .Select(tuple => new ControllerStateItem
                {
                    Layer = tuple.Layer,
                    Name = tuple.State.name ?? string.Empty,
                    MotionName = tuple.State.motion != null ? tuple.State.motion.name : string.Empty,
                    MotionPath = tuple.State.motion != null ? AssetDatabase.GetAssetPath(tuple.State.motion) : string.Empty,
                    Speed = tuple.State.speed,
                    Tag = tuple.State.tag ?? string.Empty,
                    TransitionCount = tuple.State.transitions?.Length ?? 0
                })
                .ToArray();

            return new ControllerDetailItem
            {
                Path = path,
                Name = controller.name,
                Layers = layers,
                Parameters = parameters,
                States = states,
                LinkedClips = CollectLinkedClips(controller)
                    .Select(clip => SummarizeClipListItem(AssetDatabase.GetAssetPath(clip)))
                    .ToArray()
            };
        }

        static string[] BuildControllerWarnings(AnimatorController controller)
        {
            var warnings = new List<string>();
            foreach (var state in CollectStates(controller))
            {
                if (state.State.motion == null)
                    warnings.Add($"State '{state.State.name}' in layer '{state.Layer}' has no motion.");
            }
            return warnings.OrderBy(warning => warning, StringComparer.Ordinal).ToArray();
        }

        static (string Layer, AnimatorState State)[] CollectStates(AnimatorController controller)
            => (controller.layers ?? Array.Empty<AnimatorControllerLayer>())
                .SelectMany(layer => CollectStates(layer.name ?? string.Empty, layer.stateMachine))
                .ToArray();

        static IEnumerable<(string Layer, AnimatorState State)> CollectStates(string layer, AnimatorStateMachine? stateMachine)
        {
            if (stateMachine == null)
                yield break;

            foreach (var childState in stateMachine.states)
                if (childState.state != null)
                    yield return (layer, childState.state);

            foreach (var childStateMachine in stateMachine.stateMachines)
                foreach (var state in CollectStates(layer, childStateMachine.stateMachine))
                    yield return state;
        }

        static int CountStates(AnimatorStateMachine? stateMachine)
            => stateMachine == null ? 0 : CollectStates(string.Empty, stateMachine).Count();

        static int CountTransitions(AnimatorStateMachine? stateMachine)
        {
            if (stateMachine == null)
                return 0;

            var count = stateMachine.anyStateTransitions?.Length ?? 0;
            count += stateMachine.entryTransitions?.Length ?? 0;
            count += stateMachine.states.Sum(child => child.state?.transitions?.Length ?? 0);
            count += stateMachine.stateMachines.Sum(child => CountTransitions(child.stateMachine));
            return count;
        }

        static AnimationClip[] CollectLinkedClips(AnimatorController controller)
        {
            var clips = new Dictionary<string, AnimationClip>(StringComparer.Ordinal);
            foreach (var state in CollectStates(controller))
                CollectClips(state.State.motion, clips);

            return clips.Values
                .OrderBy(clip => AssetDatabase.GetAssetPath(clip), StringComparer.Ordinal)
                .ToArray();
        }

        static void CollectClips(Motion? motion, Dictionary<string, AnimationClip> clips)
        {
            if (motion == null)
                return;

            if (motion is AnimationClip clip)
            {
                var path = AssetDatabase.GetAssetPath(clip);
                if (!string.IsNullOrWhiteSpace(path))
                    clips[path] = clip;
                return;
            }

            if (motion is BlendTree blendTree)
            {
                foreach (var child in blendTree.children)
                    CollectClips(child.motion, clips);
            }
        }

        static ClipListItem SummarizeClipListItem(string path)
        {
            var clip = AssetDatabase.LoadAssetAtPath<AnimationClip>(path);
            if (clip == null)
            {
                return new ClipListItem
                {
                    Path = path,
                    Name = System.IO.Path.GetFileNameWithoutExtension(path),
                    Length = 0f,
                    FrameRate = 0f,
                    WrapMode = string.Empty,
                    EventCount = 0,
                    Legacy = false,
                    HumanMotion = false
                };
            }

            return new ClipListItem
            {
                Path = path,
                Name = clip.name,
                Length = clip.length,
                FrameRate = clip.frameRate,
                WrapMode = clip.wrapMode.ToString(),
                EventCount = AnimationUtility.GetAnimationEvents(clip).Length,
                Legacy = clip.legacy,
                HumanMotion = clip.humanMotion
            };
        }

        static ClipDetailItem SummarizeClipDetail(string path, AnimationClip clip)
            => new()
            {
                Path = path,
                Name = clip.name,
                Length = clip.length,
                FrameRate = clip.frameRate,
                WrapMode = clip.wrapMode.ToString(),
                EventCount = AnimationUtility.GetAnimationEvents(clip).Length,
                Legacy = clip.legacy,
                HumanMotion = clip.humanMotion,
                Events = AnimationUtility.GetAnimationEvents(clip)
                    .OrderBy(evt => evt.time)
                    .ThenBy(evt => evt.functionName, StringComparer.Ordinal)
                    .Select(evt => new ClipEventItem
                    {
                        FunctionName = evt.functionName ?? string.Empty,
                        Time = evt.time,
                        StringParameter = evt.stringParameter ?? string.Empty,
                        FloatParameter = evt.floatParameter,
                        IntParameter = evt.intParameter
                    })
                    .ToArray(),
                CurveBindings = AnimationUtility.GetCurveBindings(clip)
                    .OrderBy(binding => binding.path, StringComparer.Ordinal)
                    .ThenBy(binding => binding.propertyName, StringComparer.Ordinal)
                    .Select(ToBindingItem)
                    .ToArray(),
                ObjectReferenceCurveBindings = AnimationUtility.GetObjectReferenceCurveBindings(clip)
                    .OrderBy(binding => binding.path, StringComparer.Ordinal)
                    .ThenBy(binding => binding.propertyName, StringComparer.Ordinal)
                    .Select(ToBindingItem)
                    .ToArray()
            };

        static CurveBindingItem ToBindingItem(EditorCurveBinding binding)
            => new()
            {
                Path = binding.path ?? string.Empty,
                PropertyName = binding.propertyName ?? string.Empty,
                TypeName = binding.type != null ? binding.type.FullName ?? binding.type.Name : string.Empty
            };

        static CharacterDetailItem SummarizeCharacter(string id, GameObject go, Animator? animator)
        {
            var controller = animator != null ? animator.runtimeAnimatorController : null;
            var controllerPath = controller != null ? AssetDatabase.GetAssetPath(controller) : string.Empty;
            var avatar = animator != null ? animator.avatar : null;
            var avatarPath = avatar != null ? AssetDatabase.GetAssetPath(avatar) : string.Empty;
            var linkedClips = controller != null
                ? controller.animationClips
                    .Where(clip => clip != null)
                    .OrderBy(clip => AssetDatabase.GetAssetPath(clip), StringComparer.Ordinal)
                    .Select(clip => SummarizeClipListItem(AssetDatabase.GetAssetPath(clip)))
                    .ToArray()
                : Array.Empty<ClipListItem>();

            return new CharacterDetailItem
            {
                Id = id,
                GameObjectPath = id,
                GameObjectName = go.name,
                AnimatorPresent = animator != null,
                AnimatorEnabled = animator != null && animator.enabled,
                ControllerPath = controllerPath,
                ControllerName = controller != null ? controller.name : string.Empty,
                AvatarPath = avatarPath,
                AvatarName = avatar != null ? avatar.name : string.Empty,
                AvatarIsHuman = avatar != null && avatar.isHuman,
                AvatarIsValid = avatar != null && avatar.isValid,
                LinkedClips = linkedClips
            };
        }

        public class ListPayload<T>
        {
            [JsonPropertyName("items")]
            public T[] Items { get; set; } = Array.Empty<T>();

            [JsonPropertyName("warnings")]
            public string[] Warnings { get; set; } = Array.Empty<string>();

            [JsonPropertyName("error")]
            [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
            public ResourceError? Error { get; set; }
        }

        public class DetailPayload<T>
        {
            [JsonPropertyName("item")]
            public T? Item { get; set; }

            [JsonPropertyName("warnings")]
            public string[] Warnings { get; set; } = Array.Empty<string>();

            [JsonPropertyName("error")]
            [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
            public ResourceError? Error { get; set; }

            public static DetailPayload<T> Failure(ResourceError error)
                => new()
                {
                    Item = default,
                    Warnings = new[] { error.Message },
                    Error = error
                };
        }

        public class ResourceError
        {
            [JsonPropertyName("code")]
            public string Code { get; set; } = string.Empty;

            [JsonPropertyName("message")]
            public string Message { get; set; } = string.Empty;
        }

        public class ReviewPendingPayload
        {
            [JsonPropertyName("sessions")]
            public object[] Sessions { get; set; } = Array.Empty<object>();

            [JsonPropertyName("warnings")]
            public string[] Warnings { get; set; } = Array.Empty<string>();
        }

        public class ControllerListItem
        {
            [JsonPropertyName("path")]
            public string Path { get; set; } = string.Empty;
            [JsonPropertyName("name")]
            public string Name { get; set; } = string.Empty;
            [JsonPropertyName("layerCount")]
            public int LayerCount { get; set; }
            [JsonPropertyName("parameterCount")]
            public int ParameterCount { get; set; }
            [JsonPropertyName("stateCount")]
            public int StateCount { get; set; }
            [JsonPropertyName("clipCount")]
            public int ClipCount { get; set; }
        }

        public class ControllerDetailItem
        {
            [JsonPropertyName("path")]
            public string Path { get; set; } = string.Empty;
            [JsonPropertyName("name")]
            public string Name { get; set; } = string.Empty;
            [JsonPropertyName("layers")]
            public ControllerLayerItem[] Layers { get; set; } = Array.Empty<ControllerLayerItem>();
            [JsonPropertyName("parameters")]
            public ControllerParameterItem[] Parameters { get; set; } = Array.Empty<ControllerParameterItem>();
            [JsonPropertyName("states")]
            public ControllerStateItem[] States { get; set; } = Array.Empty<ControllerStateItem>();
            [JsonPropertyName("linkedClips")]
            public ClipListItem[] LinkedClips { get; set; } = Array.Empty<ClipListItem>();
        }

        public class ControllerLayerItem
        {
            [JsonPropertyName("name")]
            public string Name { get; set; } = string.Empty;
            [JsonPropertyName("stateCount")]
            public int StateCount { get; set; }
            [JsonPropertyName("transitionCount")]
            public int TransitionCount { get; set; }
            [JsonPropertyName("defaultState")]
            public string DefaultState { get; set; } = string.Empty;
        }

        public class ControllerParameterItem
        {
            [JsonPropertyName("name")]
            public string Name { get; set; } = string.Empty;
            [JsonPropertyName("type")]
            public string Type { get; set; } = string.Empty;
            [JsonPropertyName("defaultBool")]
            public bool DefaultBool { get; set; }
            [JsonPropertyName("defaultFloat")]
            public float DefaultFloat { get; set; }
            [JsonPropertyName("defaultInt")]
            public int DefaultInt { get; set; }
        }

        public class ControllerStateItem
        {
            [JsonPropertyName("layer")]
            public string Layer { get; set; } = string.Empty;
            [JsonPropertyName("name")]
            public string Name { get; set; } = string.Empty;
            [JsonPropertyName("motionName")]
            public string MotionName { get; set; } = string.Empty;
            [JsonPropertyName("motionPath")]
            public string MotionPath { get; set; } = string.Empty;
            [JsonPropertyName("speed")]
            public float Speed { get; set; }
            [JsonPropertyName("tag")]
            public string Tag { get; set; } = string.Empty;
            [JsonPropertyName("transitionCount")]
            public int TransitionCount { get; set; }
        }

        public class ClipListItem
        {
            [JsonPropertyName("path")]
            public string Path { get; set; } = string.Empty;
            [JsonPropertyName("name")]
            public string Name { get; set; } = string.Empty;
            [JsonPropertyName("length")]
            public float Length { get; set; }
            [JsonPropertyName("frameRate")]
            public float FrameRate { get; set; }
            [JsonPropertyName("wrapMode")]
            public string WrapMode { get; set; } = string.Empty;
            [JsonPropertyName("eventCount")]
            public int EventCount { get; set; }
            [JsonPropertyName("legacy")]
            public bool Legacy { get; set; }
            [JsonPropertyName("humanMotion")]
            public bool HumanMotion { get; set; }
        }

        public class ClipDetailItem
        {
            [JsonPropertyName("path")]
            public string Path { get; set; } = string.Empty;
            [JsonPropertyName("name")]
            public string Name { get; set; } = string.Empty;
            [JsonPropertyName("length")]
            public float Length { get; set; }
            [JsonPropertyName("frameRate")]
            public float FrameRate { get; set; }
            [JsonPropertyName("wrapMode")]
            public string WrapMode { get; set; } = string.Empty;
            [JsonPropertyName("eventCount")]
            public int EventCount { get; set; }
            [JsonPropertyName("legacy")]
            public bool Legacy { get; set; }
            [JsonPropertyName("humanMotion")]
            public bool HumanMotion { get; set; }
            [JsonPropertyName("events")]
            public ClipEventItem[] Events { get; set; } = Array.Empty<ClipEventItem>();
            [JsonPropertyName("curveBindings")]
            public CurveBindingItem[] CurveBindings { get; set; } = Array.Empty<CurveBindingItem>();
            [JsonPropertyName("objectReferenceCurveBindings")]
            public CurveBindingItem[] ObjectReferenceCurveBindings { get; set; } = Array.Empty<CurveBindingItem>();
        }

        public class ClipEventItem
        {
            [JsonPropertyName("functionName")]
            public string FunctionName { get; set; } = string.Empty;
            [JsonPropertyName("time")]
            public float Time { get; set; }
            [JsonPropertyName("stringParameter")]
            public string StringParameter { get; set; } = string.Empty;
            [JsonPropertyName("floatParameter")]
            public float FloatParameter { get; set; }
            [JsonPropertyName("intParameter")]
            public int IntParameter { get; set; }
        }

        public class CurveBindingItem
        {
            [JsonPropertyName("path")]
            public string Path { get; set; } = string.Empty;
            [JsonPropertyName("propertyName")]
            public string PropertyName { get; set; } = string.Empty;
            [JsonPropertyName("typeName")]
            public string TypeName { get; set; } = string.Empty;
        }

        public class CharacterDetailItem
        {
            [JsonPropertyName("id")]
            public string Id { get; set; } = string.Empty;
            [JsonPropertyName("gameObjectPath")]
            public string GameObjectPath { get; set; } = string.Empty;
            [JsonPropertyName("gameObjectName")]
            public string GameObjectName { get; set; } = string.Empty;
            [JsonPropertyName("animatorPresent")]
            public bool AnimatorPresent { get; set; }
            [JsonPropertyName("animatorEnabled")]
            public bool AnimatorEnabled { get; set; }
            [JsonPropertyName("controllerPath")]
            public string ControllerPath { get; set; } = string.Empty;
            [JsonPropertyName("controllerName")]
            public string ControllerName { get; set; } = string.Empty;
            [JsonPropertyName("avatarPath")]
            public string AvatarPath { get; set; } = string.Empty;
            [JsonPropertyName("avatarName")]
            public string AvatarName { get; set; } = string.Empty;
            [JsonPropertyName("avatarIsHuman")]
            public bool AvatarIsHuman { get; set; }
            [JsonPropertyName("avatarIsValid")]
            public bool AvatarIsValid { get; set; }
            [JsonPropertyName("linkedClips")]
            public ClipListItem[] LinkedClips { get; set; } = Array.Empty<ClipListItem>();
        }
    }
}
