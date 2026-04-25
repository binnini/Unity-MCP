# Unity 6000.3.6f1 Default Development Baseline Validation Prompt

?ㅼ쓬 釉뚮━?꾩뿉 ?곕씪 `codex/game-pipeline-specialists-v1` 釉뚮옖移섏쓽 Unity 6000 湲곕낯 媛쒕컻 踰꾩쟾 ?꾪솚??寃利앺빐二쇱꽭??

## 紐⑺몴
- `Unity-MCP-Plugin/ProjectSettings/ProjectVersion.txt`媛 媛由ы궎??root development baseline??Unity `6000.3.6f1`?먯꽌 ?뺤긽 import / compile ?섎뒗吏 ?뺤씤
- `commands/run-unity-tests.ps1 -TestMode compile`媛 ?뺤긽 ?숈옉?섎뒗吏 ?뺤씤
- package floor(`2022.3`)? installer / release baseline(`2022.3.62f3`)??洹몃?濡??좎??섎뒗吏 ?뺤씤

## 以鍮?
1. 釉뚮옖移?理쒖떊??
   ```bash
   git fetch origin
   git checkout codex/game-pipeline-specialists-v1
   git pull --ff-only
   ```
2. ?뺤씤 ????뚯씪
   - `Unity-MCP-Plugin/ProjectSettings/ProjectVersion.txt`
   - `Installer/ProjectSettings/ProjectVersion.txt`
   - `Unity-MCP-Plugin/Packages/com.ivanmurzak.unity.mcp/package.json`
   - `commands/run-unity-tests.ps1`
   - `docs/dev/Development.md`
3. 湲곕? ?곹깭
   - root dev baseline: `6000.3.6f1`
   - installer baseline: `2022.3.62f3`
   - package floor: `2022.3`

## ?ㅽ뻾
1. PowerShell helper compile-only 寃利?
   ```powershell
   .\commands\run-unity-tests.ps1 -UnityPath "C:\Program Files\Unity\Hub\Editor\6000.3.6f1\Editor\Unity.exe" -TestMode compile
   ```
2. 媛?ν븯硫?異붽? EditMode 寃利?
   ```powershell
   .\commands\run-unity-tests.ps1 -UnityPath "C:\Program Files\Unity\Hub\Editor\6000.3.6f1\Editor\Unity.exe" -TestMode editmode
   ```
3. ?꾩슂 ??吏곸젒 batchmode濡?root project ?뺤씤
   ```powershell
   & "C:\Program Files\Unity\Hub\Editor\6000.3.6f1\Editor\Unity.exe" `
     -batchmode `
     -quit `
     -projectPath "<repo>\\Unity-MCP-Plugin" `
     -logFile "<temp>\\unity-mcp-root-6000-compile.log"
   ```

## exact baseline 誘몄꽕移???fallback
- `6000.3.6f1`媛 ?ㅼ튂?섏뼱 ?덉? ?딆쑝硫? 洹??ъ떎??癒쇱? 紐낆떆?섍퀬 ?먯젙? `inconclusive`濡??좎??댁＜?몄슂.
- 洹??ㅼ쓬 李멸퀬?⑹쑝濡쒕쭔 ?ㅼ튂??媛??媛源뚯슫 `6000.3.x`(?? `<closest-6000.3.x>`)?먯꽌 ?꾨옒瑜?異붽? ?ㅽ뻾?댁＜?몄슂.
  ```powershell
  .\commands\run-unity-tests.ps1 -UnityPath "C:\Program Files\Unity\Hub\Editor\<closest-6000.3.x>\Editor\Unity.exe" -TestMode compile
  .\commands\run-unity-tests.ps1 -UnityPath "C:\Program Files\Unity\Hub\Editor\<closest-6000.3.x>\Editor\Unity.exe" -TestMode editmode
  ```
- fallback 寃곌낵??**exact baseline validation???泥??먯젙**???꾨땲?? **洹쇱젒 踰꾩쟾 李멸퀬 evidence**濡쒕쭔 ?곸뼱二쇱꽭??

## 由ы룷?몄뿉 ?ы븿??寃?
- Windows 踰꾩쟾
- Unity `6000.3.6f1` ?ㅼ튂 寃쎈줈
- exact baseline ?ㅼ튂 ?щ?
- compile-only ?깃났 / ?ㅽ뙣
- EditMode ?깃났 / ?ㅽ뙣
- 泥?compile error媛 ?덉쑝硫??꾩껜 ?먮윭 濡쒓렇
- `run-unity-tests.ps1` ?먯껜 ?ㅽ뻾 ?ㅻ쪟媛 ?덉쑝硫?洹??ㅻ쪟
- root project open ??異붽?濡??앷릿 Unity-generated project setting diff媛 ?덈떎硫??뚯씪 紐⑸줉
- fallback `6000.3.x`瑜??쇰떎硫?洹?踰꾩쟾怨?寃곌낵瑜?遺꾨━??湲곕줉

## 湲곕? ?먯젙 臾멸뎄
- Success: `default-dev baseline 6000.3.6f1 validated on Windows`
- Failure: `default-dev baseline 6000.3.6f1 not validated on Windows`
- Inconclusive: `default-dev baseline 6000.3.6f1 validation inconclusive on Windows`
