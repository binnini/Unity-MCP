# Windows Handoff Prompt — `game-pipeline-specialists-v1`

Unity-MCP 저장소의 `codex/game-pipeline-specialists-v1` 브랜치를 최신화한 뒤, **이 브랜치의 목표와 현재 Windows 실행 blocker를 기준으로** 후속 작업을 이어가주세요.

## 이 브랜치의 목표
이 브랜치는 **Unity-MCP를 게임 제작 파이프라인 specialist 구조로 확장하는 1차 기반 작업**을 담고 있습니다. 지금까지의 합의 범위는 아래와 같습니다.

1. **specialist 아키텍처/계약/로드맵 문서화**
   - specialist contract
   - animator reference specialist
   - feedback protocol
   - migration roadmap
2. **specialist contract validator와 fixture 기반 검증**
3. **Animator read-only resource surface 추가**
   - `animation://controllers`
   - `animation://controller/{path}`
   - `animation://clips`
   - `animation://clip/{path}`
   - `animation://character/{id}`
   - `review://animation/pending`
4. **root default development baseline을 Unity `6000.3.1f1`로 승격**
   - 단, package compatibility floor는 계속 `2022.3`
   - installer / release baseline은 계속 `2022.3.62f3`

즉, 이 브랜치의 핵심 목적은:

> **게임 파이프라인 specialist 확장의 첫 reference slice를 만들고, 그중 Animator specialist의 read-only inspection surface를 Unity에서 실제로 동작 가능한 상태로 만드는 것**

입니다.

## 배경
- 이전 fallback `6000.3.6f1` 검증에서 MCP plugin startup 중 아래 오류가 있었습니다.
  - `System.InvalidOperationException: Method com.IvanMurzak.Unity.MCP.Editor.API.Resource_Animation not found in type Resource_Animation`
- 이번 수정은 Animation resource를 단일 `Resource_Animation` 타입에서 여러 resource type으로 분리해, MCP builder의 resource discovery shape에 맞추는 것입니다.
- exact baseline `6000.3.1f1`가 있으면 그 버전으로, 없으면 `6000.3.x` fallback evidence로만 검증해주세요.

## 현재 Windows 실행 blocker
현재 가장 중요한 blocker는 baseline patch mismatch 자체보다, **Animator resource registration failure가 MCP plugin startup을 깨뜨리는지 여부**입니다.

따라서 현재 lane의 우선순위는:
1. animation resource registration failure 제거
2. compile / startup 안정화
3. 그 다음 EditMode failure shape 재평가
4. 마지막에 baseline exact validation 재판정

입니다.

## 목표
1. `Resource_Animation not found` startup error가 사라졌는지 확인
2. `commands/run-unity-tests.ps1 -TestMode compile`가 더 이상 자체 포맷 오류 없이 동작하는지 확인
3. fallback `6000.3.x`에서 root project import / compile 결과가 이전보다 개선됐는지 확인
4. 가능하면 EditMode도 다시 실행해 failure shape가 바뀌었는지 확인

## 준비
1. 브랜치 최신화
   ```bash
   git fetch origin
   git checkout codex/game-pipeline-specialists-v1
   git pull --ff-only
   ```

2. 확인할 핵심 커밋
   - `2b1ae526` — PowerShell compile-mode duration formatting fix
   - `cf1a0e56` — animation resource type split for MCP resource scanning compatibility

3. 확인할 파일
   - `docs/specialists/architecture-v1.md`
   - `docs/specialists/animator-specialist-v1.md`
   - `commands/run-unity-tests.ps1`
   - `Unity-MCP-Plugin/Packages/com.ivanmurzak.unity.mcp/Editor/Scripts/API/Resource/Animation.cs`
   - `cli/tests/animator-readonly-resources.test.ts`

## 변경 금지 / 주의 경계
- `Unity-MCP-Plugin/Packages/com.ivanmurzak.unity.mcp/package.json`의 `"unity": "2022.3"`는 이번 lane에서 올리지 않습니다.
- `Installer/ProjectSettings/ProjectVersion.txt`의 `2022.3.62f3` baseline은 이번 lane에서 바꾸지 않습니다.
- specialist bus / mailbox / scheduler / dispatch runtime은 이번 lane 범위가 아닙니다.
- Animator resource는 계속 **read-only**여야 하며, write tool/draft workflow는 아직 후속 slice입니다.
- Unity가 자동 생성한 churn(`ProjectSettings`, `Packages/manifest.json`, `UserSettings`)은 의도한 코드 변경과 분리해 보고해주세요.

## 기대 코드 상태
- `commands/run-unity-tests.ps1:239` 부근 duration 출력은 `mm\:ss`
- `Animation.cs`에는 route 6개가 유지됨:
  - `animation://controllers`
  - `animation://controller/{path}`
  - `animation://clips`
  - `animation://clip/{path}`
  - `animation://character/{id}`
  - `review://animation/pending`
- 하지만 이제 각 MCP resource type은 분리된 class 형태여야 함
- 한 resource type에 여러 `[McpPluginResource]` entry point를 몰아넣지 않아야 함

## 실행
### A. exact baseline이 설치된 경우
Unity `6000.3.1f1`가 설치돼 있으면 아래를 실행:
```powershell
.\commands\run-unity-tests.ps1 -UnityPath "C:\Program Files\Unity\Hub\Editor\6000.3.1f1\Editor\Unity.exe" -TestMode compile
.\commands\run-unity-tests.ps1 -UnityPath "C:\Program Files\Unity\Hub\Editor\6000.3.1f1\Editor\Unity.exe" -TestMode editmode
```

### B. exact baseline이 없으면 fallback evidence only
설치된 가장 가까운 `6000.3.x`(예: `6000.3.6f1`)에서만 참고용으로 실행:
```powershell
.\commands\run-unity-tests.ps1 -UnityPath "C:\Program Files\Unity\Hub\Editor\6000.3.6f1\Editor\Unity.exe" -TestMode compile
.\commands\run-unity-tests.ps1 -UnityPath "C:\Program Files\Unity\Hub\Editor\6000.3.6f1\Editor\Unity.exe" -TestMode editmode
```

### 추가 batchmode 확인(선택)
```powershell
& "C:\Program Files\Unity\Hub\Editor\6000.3.6f1\Editor\Unity.exe" `
  -batchmode `
  -quit `
  -projectPath "<repo>\\Unity-MCP-Plugin" `
  -logFile "<temp>\\unity-mcp-root-6000-compile.log"
```

## 중점 확인
1. **startup exception 변화**
   - 이전의
     - `Method ... Resource_Animation not found in type Resource_Animation`
   - 가 사라졌는지
2. **run-unity-tests.ps1 자체 오류**
   - 이전의
     - `ToString(...) Input string was not in a correct format.`
   - 가 사라졌는지
3. **compile-only 결과**
   - Unity exit code
   - 첫 compile/startup error
   - root project import 완료 여부
4. **EditMode 결과**
   - exit code
   - 총 passed / failed
   - 첫 실패 메시지
   - 여전히 `Reflector cannot be null` 계열인지, 아니면 failure shape가 바뀌었는지
5. **Unity-generated diff**
   - `ProjectSettings.asset`
   - `ProjectVersion.txt`
   - `Packages/manifest.json`
   - `ProjectSettings/Packages/`
   - `UserSettings/...`
   등 추가 churn이 생기는지

## 리포트에 포함
- Windows 버전
- 사용한 Unity 버전과 설치 경로
- exact baseline 설치 여부
- compile-only 성공/실패
- EditMode 성공/실패
- `Resource_Animation not found` 오류의 재현 여부
- PowerShell formatting error 재현 여부
- 첫 startup/compile error 전문
- 첫 EditMode failure 전문
- Unity-generated diff 파일 목록
- exact baseline이 아니면 반드시 `fallback evidence only`라고 명시

## 최종 판정 문구
- Success:
  - `animation resource registration fix validated on Windows`
- Failure:
  - `animation resource registration fix not validated on Windows`
- Inconclusive:
  - `animation resource registration fix validation inconclusive on Windows`

## 작업 종료 시 함께 알려줄 것
- 현재 branch 목적 대비 남은 blocker 한 줄 요약
- 다음으로 Windows에서 계속 진행해야 할 가장 작은 다음 실험 1~2개
