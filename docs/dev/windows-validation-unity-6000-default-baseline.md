# Unity 6000.3.1f1 Default Development Baseline Validation Prompt

다음 브리프에 따라 `codex/game-pipeline-specialists-v1` 브랜치의 Unity 6000 기본 개발 버전 전환을 검증해주세요.

## 목표
- `Unity-MCP-Plugin/ProjectSettings/ProjectVersion.txt`가 가리키는 root development baseline이 Unity `6000.3.1f1`에서 정상 import / compile 되는지 확인
- `commands/run-unity-tests.ps1 -TestMode compile`가 정상 동작하는지 확인
- package floor(`2022.3`)와 installer / release baseline(`2022.3.62f3`)이 그대로 유지되는지 확인

## 준비
1. 브랜치 최신화
   ```bash
   git fetch origin
   git checkout codex/game-pipeline-specialists-v1
   git pull --ff-only
   ```
2. 확인 대상 파일
   - `Unity-MCP-Plugin/ProjectSettings/ProjectVersion.txt`
   - `Installer/ProjectSettings/ProjectVersion.txt`
   - `Unity-MCP-Plugin/Packages/com.ivanmurzak.unity.mcp/package.json`
   - `commands/run-unity-tests.ps1`
   - `docs/dev/Development.md`
3. 기대 상태
   - root dev baseline: `6000.3.1f1`
   - installer baseline: `2022.3.62f3`
   - package floor: `2022.3`

## 실행
1. PowerShell helper compile-only 검증
   ```powershell
   .\commands\run-unity-tests.ps1 -UnityPath "C:\Program Files\Unity\Hub\Editor\6000.3.1f1\Editor\Unity.exe" -TestMode compile
   ```
2. 가능하면 추가 EditMode 검증
   ```powershell
   .\commands\run-unity-tests.ps1 -UnityPath "C:\Program Files\Unity\Hub\Editor\6000.3.1f1\Editor\Unity.exe" -TestMode editmode
   ```
3. 필요 시 직접 batchmode로 root project 확인
   ```powershell
   & "C:\Program Files\Unity\Hub\Editor\6000.3.1f1\Editor\Unity.exe" `
     -batchmode `
     -quit `
     -projectPath "<repo>\\Unity-MCP-Plugin" `
     -logFile "<temp>\\unity-mcp-root-6000-compile.log"
   ```

## exact baseline 미설치 시 fallback
- `6000.3.1f1`가 설치되어 있지 않으면, 그 사실을 먼저 명시하고 판정은 `inconclusive`로 유지해주세요.
- 그 다음 참고용으로만 설치된 가장 가까운 `6000.3.x`(예: `6000.3.6f1`)에서 아래를 추가 실행해주세요.
  ```powershell
  .\commands\run-unity-tests.ps1 -UnityPath "C:\Program Files\Unity\Hub\Editor\6000.3.6f1\Editor\Unity.exe" -TestMode compile
  .\commands\run-unity-tests.ps1 -UnityPath "C:\Program Files\Unity\Hub\Editor\6000.3.6f1\Editor\Unity.exe" -TestMode editmode
  ```
- fallback 결과는 **exact baseline validation의 대체 판정**이 아니라, **근접 버전 참고 evidence**로만 적어주세요.

## 리포트에 포함할 것
- Windows 버전
- Unity `6000.3.1f1` 설치 경로
- exact baseline 설치 여부
- compile-only 성공 / 실패
- EditMode 성공 / 실패
- 첫 compile error가 있으면 전체 에러 로그
- `run-unity-tests.ps1` 자체 실행 오류가 있으면 그 오류
- root project open 후 추가로 생긴 Unity-generated project setting diff가 있다면 파일 목록
- fallback `6000.3.x`를 썼다면 그 버전과 결과를 분리해 기록

## 기대 판정 문구
- Success: `default-dev baseline 6000.3.1f1 validated on Windows`
- Failure: `default-dev baseline 6000.3.1f1 not validated on Windows`
- Inconclusive: `default-dev baseline 6000.3.1f1 validation inconclusive on Windows`
