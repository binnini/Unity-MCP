# Windows Handoff Prompt ??`game-pipeline-specialists-v1`

Unity-MCP ??μ냼??`codex/game-pipeline-specialists-v1` 釉뚮옖移섎? 理쒖떊?뷀븳 ?? **??釉뚮옖移섏쓽 紐⑺몴? ?꾩옱 Windows ?ㅽ뻾 blocker瑜?湲곗??쇰줈** ?꾩냽 ?묒뾽???댁뼱媛二쇱꽭??

## ??釉뚮옖移섏쓽 紐⑺몴
??釉뚮옖移섎뒗 **Unity-MCP瑜?寃뚯엫 ?쒖옉 ?뚯씠?꾨씪??specialist 援ъ“濡??뺤옣?섎뒗 1李?湲곕컲 ?묒뾽**???닿퀬 ?덉뒿?덈떎. 吏湲덇퉴吏???⑹쓽 踰붿쐞???꾨옒? 媛숈뒿?덈떎.

1. **specialist ?꾪궎?띿쿂/怨꾩빟/濡쒕뱶留?臾몄꽌??*
   - specialist contract
   - animator reference specialist
   - feedback protocol
   - migration roadmap
2. **specialist contract validator? fixture 湲곕컲 寃利?*
3. **Animator read-only resource surface 異붽?**
   - `animation://controllers`
   - `animation://controller/{path}`
   - `animation://clips`
   - `animation://clip/{path}`
   - `animation://character/{id}`
   - `review://animation/pending`
4. **root default development baseline??Unity `6000.3.6f1`濡??밴꺽**
   - ?? package compatibility floor??怨꾩냽 `2022.3`
   - installer / release baseline? 怨꾩냽 `2022.3.62f3`

利? ??釉뚮옖移섏쓽 ?듭떖 紐⑹쟻?:

> **寃뚯엫 ?뚯씠?꾨씪??specialist ?뺤옣??泥?reference slice瑜?留뚮뱾怨? 洹몄쨷 Animator specialist??read-only inspection surface瑜?Unity?먯꽌 ?ㅼ젣濡??숈옉 媛?ν븳 ?곹깭濡?留뚮뱶??寃?*

?낅땲??

## 諛곌꼍
- ?댁쟾 fallback `6000.3.6f1` 寃利앹뿉??MCP plugin startup 以??꾨옒 ?ㅻ쪟媛 ?덉뿀?듬땲??
  - `System.InvalidOperationException: Method com.IvanMurzak.Unity.MCP.Editor.API.Resource_Animation not found in type Resource_Animation`
- ?대쾲 ?섏젙? Animation resource瑜??⑥씪 `Resource_Animation` ??낆뿉???щ윭 resource type?쇰줈 遺꾨━?? MCP builder??resource discovery shape??留욎텛??寃껋엯?덈떎.
- exact baseline `6000.3.6f1`媛 ?덉쑝硫?洹?踰꾩쟾?쇰줈, ?놁쑝硫?`6000.3.x` fallback evidence濡쒕쭔 寃利앺빐二쇱꽭??

## ?꾩옱 Windows ?ㅽ뻾 blocker
?꾩옱 媛??以묒슂??blocker??baseline patch mismatch ?먯껜蹂대떎, **Animator resource registration failure媛 MCP plugin startup??源⑤쑉由щ뒗吏 ?щ?**?낅땲??

?곕씪???꾩옱 lane???곗꽑?쒖쐞??
1. animation resource registration failure ?쒓굅
2. compile / startup ?덉젙??
3. 洹??ㅼ쓬 EditMode failure shape ?ы룊媛
4. 留덉?留됱뿉 baseline exact validation ?ы뙋??

?낅땲??

## 紐⑺몴
1. `Resource_Animation not found` startup error媛 ?щ씪議뚮뒗吏 ?뺤씤
2. `commands/run-unity-tests.ps1 -TestMode compile`媛 ???댁긽 ?먯껜 ?щ㎎ ?ㅻ쪟 ?놁씠 ?숈옉?섎뒗吏 ?뺤씤
3. fallback `6000.3.x`?먯꽌 root project import / compile 寃곌낵媛 ?댁쟾蹂대떎 媛쒖꽑?먮뒗吏 ?뺤씤
4. 媛?ν븯硫?EditMode???ㅼ떆 ?ㅽ뻾??failure shape媛 諛붾뚯뿀?붿? ?뺤씤

## 以鍮?
1. 釉뚮옖移?理쒖떊??
   ```bash
   git fetch origin
   git checkout codex/game-pipeline-specialists-v1
   git pull --ff-only
   ```

2. ?뺤씤???듭떖 而ㅻ컠
   - `2b1ae526` ??PowerShell compile-mode duration formatting fix
   - `cf1a0e56` ??animation resource type split for MCP resource scanning compatibility

3. ?뺤씤???뚯씪
   - `docs/specialists/architecture-v1.md`
   - `docs/specialists/animator-specialist-v1.md`
   - `commands/run-unity-tests.ps1`
   - `Unity-MCP-Plugin/Packages/com.ivanmurzak.unity.mcp/Editor/Scripts/API/Resource/Animation.cs`
   - `cli/tests/animator-readonly-resources.test.ts`

## 蹂寃?湲덉? / 二쇱쓽 寃쎄퀎
- `Unity-MCP-Plugin/Packages/com.ivanmurzak.unity.mcp/package.json`??`"unity": "2022.3"`???대쾲 lane?먯꽌 ?щ━吏 ?딆뒿?덈떎.
- `Installer/ProjectSettings/ProjectVersion.txt`??`2022.3.62f3` baseline? ?대쾲 lane?먯꽌 諛붽씀吏 ?딆뒿?덈떎.
- specialist bus / mailbox / scheduler / dispatch runtime? ?대쾲 lane 踰붿쐞媛 ?꾨떃?덈떎.
- Animator resource??怨꾩냽 **read-only**?ъ빞 ?섎ŉ, write tool/draft workflow???꾩쭅 ?꾩냽 slice?낅땲??
- Unity媛 ?먮룞 ?앹꽦??churn(`ProjectSettings`, `Packages/manifest.json`, `UserSettings`)? ?섎룄??肄붾뱶 蹂寃쎄낵 遺꾨━??蹂닿퀬?댁＜?몄슂.

## 湲곕? 肄붾뱶 ?곹깭
- `commands/run-unity-tests.ps1:239` 遺洹?duration 異쒕젰? `mm\:ss`
- `Animation.cs`?먮뒗 route 6媛쒓? ?좎???
  - `animation://controllers`
  - `animation://controller/{path}`
  - `animation://clips`
  - `animation://clip/{path}`
  - `animation://character/{id}`
  - `review://animation/pending`
- ?섏?留??댁젣 媛?MCP resource type? 遺꾨━??class ?뺥깭?ъ빞 ??
- ??resource type???щ윭 `[McpPluginResource]` entry point瑜?紐곗븘?ｌ? ?딆븘????

## ?ㅽ뻾
### A. exact baseline???ㅼ튂??寃쎌슦
Unity `6000.3.6f1`媛 ?ㅼ튂???덉쑝硫??꾨옒瑜??ㅽ뻾:
```powershell
.\commands\run-unity-tests.ps1 -UnityPath "C:\Program Files\Unity\Hub\Editor\6000.3.6f1\Editor\Unity.exe" -TestMode compile
.\commands\run-unity-tests.ps1 -UnityPath "C:\Program Files\Unity\Hub\Editor\6000.3.6f1\Editor\Unity.exe" -TestMode editmode
```

### B. exact baseline???놁쑝硫?fallback evidence only
?ㅼ튂??媛??媛源뚯슫 `6000.3.x`(?? `<closest-6000.3.x>`)?먯꽌留?李멸퀬?⑹쑝濡??ㅽ뻾:
```powershell
.\commands\run-unity-tests.ps1 -UnityPath "C:\Program Files\Unity\Hub\Editor\<closest-6000.3.x>\Editor\Unity.exe" -TestMode compile
.\commands\run-unity-tests.ps1 -UnityPath "C:\Program Files\Unity\Hub\Editor\<closest-6000.3.x>\Editor\Unity.exe" -TestMode editmode
```

### 異붽? batchmode ?뺤씤(?좏깮)
```powershell
& "C:\Program Files\Unity\Hub\Editor\<closest-6000.3.x>\Editor\Unity.exe" `
  -batchmode `
  -quit `
  -projectPath "<repo>\\Unity-MCP-Plugin" `
  -logFile "<temp>\\unity-mcp-root-6000-compile.log"
```

## 以묒젏 ?뺤씤
1. **startup exception 蹂??*
   - ?댁쟾??
     - `Method ... Resource_Animation not found in type Resource_Animation`
   - 媛 ?щ씪議뚮뒗吏
2. **run-unity-tests.ps1 ?먯껜 ?ㅻ쪟**
   - ?댁쟾??
     - `ToString(...) Input string was not in a correct format.`
   - 媛 ?щ씪議뚮뒗吏
3. **compile-only 寃곌낵**
   - Unity exit code
   - 泥?compile/startup error
   - root project import ?꾨즺 ?щ?
4. **EditMode 寃곌낵**
   - exit code
   - 珥?passed / failed
   - 泥??ㅽ뙣 硫붿떆吏
   - ?ъ쟾??`Reflector cannot be null` 怨꾩뿴?몄?, ?꾨땲硫?failure shape媛 諛붾뚯뿀?붿?
5. **Unity-generated diff**
   - `ProjectSettings.asset`
   - `ProjectVersion.txt`
   - `Packages/manifest.json`
   - `ProjectSettings/Packages/`
   - `UserSettings/...`
   ??異붽? churn???앷린?붿?

## 由ы룷?몄뿉 ?ы븿
- Windows 踰꾩쟾
- ?ъ슜??Unity 踰꾩쟾怨??ㅼ튂 寃쎈줈
- exact baseline ?ㅼ튂 ?щ?
- compile-only ?깃났/?ㅽ뙣
- EditMode ?깃났/?ㅽ뙣
- `Resource_Animation not found` ?ㅻ쪟???ы쁽 ?щ?
- PowerShell formatting error ?ы쁽 ?щ?
- 泥?startup/compile error ?꾨Ц
- 泥?EditMode failure ?꾨Ц
- Unity-generated diff ?뚯씪 紐⑸줉
- exact baseline???꾨땲硫?諛섎뱶??`fallback evidence only`?쇨퀬 紐낆떆

## 理쒖쥌 ?먯젙 臾멸뎄
- Success:
  - `animation resource registration fix validated on Windows`
- Failure:
  - `animation resource registration fix not validated on Windows`
- Inconclusive:
  - `animation resource registration fix validation inconclusive on Windows`

## ?묒뾽 醫낅즺 ???④퍡 ?뚮젮以?寃?
- ?꾩옱 branch 紐⑹쟻 ?鍮??⑥? blocker ??以??붿빟
- ?ㅼ쓬?쇰줈 Windows?먯꽌 怨꾩냽 吏꾪뻾?댁빞 ??媛???묒? ?ㅼ쓬 ?ㅽ뿕 1~2媛?
## CI validation addendum (2026-04-25)

Use GitHub Actions run `24923766564` as the official validation evidence for this lane.

- Repository: `binnini/Unity-MCP`
- Branch: `codex/game-pipeline-specialists-v1`
- Commit: `a7c8b7d8a6604b4ea6f359feaafc3ca9623dfc66`
- Official evidence run: `24923766564`
- Duplicate non-blocking run: `24923772188`

Interpretation:
- Run `24923766564` completed successfully across the CLI matrix and the Unity validation matrix, including `6000.3.6f1` standalone/editmode on both `base` and `windows-mono`.
- Run `24923772188` should be treated as duplicate noise for final reporting. Its failure was a Unity license activation flake during `6000.3.6f1` standalone on `base`, not a code regression.

Reporting directive:
- Cite `24923766564` when describing official CI evidence for the `6000.3.6f1` baseline and the animation resource registration fix.
- Do not treat `24923772188` as blocking unless the same failure shape reproduces on a fresh non-duplicate run.
