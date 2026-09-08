# Yohaku 技術設計

日期：2026-09-08  
狀態：MVP 技術方案；尚未實作。產品需求以 [DESIGN.md](DESIGN.md) 為準。

## 1. 技術方向

採用桌面優先的響應式 Web App，React 負責介面，C# 負責 API、背景分析及資料儲存。首次分析完成後才進入學習畫面；播放時按時間顯示已準備好的內容。

| 部分 | 選擇 | 職責 |
| --- | --- | --- |
| 前端 | React、TypeScript、Vite | 影片、雙語句子、累積式重點欄、Summary |
| UI | Tailwind CSS、shadcn/ui | 介面樣式及基本元件 |
| 後端 | ASP.NET Core Web API、C# | 請求驗證、分析流程、結果查詢 |
| 資料存取 | Entity Framework Core、Npgsql | PostgreSQL 查詢及 migration |
| 資料庫 | PostgreSQL | 字幕、分析結果、工作狀態及快取 |
| 背景工作 | Hangfire | 持久化工作、有限次重試及恢復 |
| AI | Gemini API、官方 Google.GenAI .NET SDK | 翻譯、重點分析及總結整理 |
| 播放器 | YouTube IFrame Player API | 播放、暫停、時間讀取及跳轉 |

套件及 .NET 版本在實作時鎖定相容的受支援穩定版本。Hangfire 的 PostgreSQL storage provider 屬獨立整合套件，需確認相容性；不是 EF Core 的工作佇列。

前後端保留在同一個 repository。初期 API 與 Hangfire worker 在同一個 ASP.NET Core 服務執行；不需要微服務、Redis、向量資料庫、SignalR 或 AI agent framework。

## 2. 系統分工

```text
React Web App
  ├─ YouTube IFrame：影片播放
  └─ ASP.NET Core API
       ├─ PostgreSQL：資料及持久化工作
       └─ Hangfire worker
            ├─ 字幕來源介面
            └─ Gemini API
```

Gemini key 只存在後端。瀏覽器透過 API 取得結果，沒有直接存取資料庫或呼叫 Gemini 的權限。

## 3. 完整處理流程

1. 用戶提交 YouTube URL 及 `zh-Hant` 或 `en`。
2. API 驗證支援的 YouTube 網址並解析影片 ID，不直接抓取任意用戶 URL。
3. 查詢可重用的字幕及同語言、同分析版本的結果。完成的結果直接回傳；進行中的工作回傳既有 analysis ID。
4. 建立 analysis 記錄及 Hangfire 工作。入列失敗要標示可重試錯誤，避免記錄永久停在等待中。
5. Worker 取得影片資料及帶時間的日文字幕，清理後整理成句子。
6. 將連續句子分批送至 Gemini，產生自然翻譯及每句 0–3 個學習重點。
7. 驗證並保存每批結果，再整理所有重點為 Summary。
8. 確認句子翻譯及 Summary 完整後標示 `ready`。
9. 前端等待期間每約 3 秒查詢狀態；完成或失敗後停止輪詢。
10. 進入學習畫面，取得完整結果。字幕及重點的播放同步由瀏覽器處理。

關閉瀏覽器不取消背景工作。應用程式停止時背景工作暫停，服務恢復後透過持久化狀態繼續；不承諾主機停止期間仍能分析。

## 4. YouTube 字幕來源

這是尚待驗證的外部依賴，不視為已解決。

- 官方 YouTube 字幕下載 API 要求具備影片編輯權限，不能假設可下載任何公開影片的字幕。
- 定義 `ITranscriptProvider`，隔離供應商 API 及其錯誤格式。
- 第三方供應商在確認日文支援、時間戳、穩定性、費用及使用條件後才選定。
- 優先使用人工日文字幕；自動字幕可作後備，保存來源類型並提示可能有辨識錯誤。
- 無字幕、非日文、私人／刪除影片、不可嵌入或供應商取得失敗，都回傳明確狀態。
- MVP 不加入音訊下載、語音轉錄或繞過影片存取限制。

開發可用固定字幕測試資料驗證流程，但這不代表真實 YouTube 輸入已經完成。

## 5. 句子與時間

保存原始字幕片段及其來源 ID、文字、開始與結束時間。清理滾動字幕的重複內容時，避免刪除說話者真正重複的語句。

按標點、停頓及字幕片段組合成閱讀單位。每個句子使用穩定 ID，並保留其來源片段 ID。時間統一保存為整數毫秒。

只有片段時間時，使用來源片段範圍，不要求 AI 猜測字詞時間。無法準確細分的句子保留為較大的閱讀單位；MVP 不承諾逐字同步。空白時段不沿用已結束的句子。

## 6. Gemini 分析及免費試驗

先使用帳戶可用且提供免費層的 Flash 系列模型，以設定值選擇 model ID，不在程式碼鎖死特定模型名稱。免費額度及模型可用性以 AI Studio 專案當時顯示為準。

初期測試建議使用 3–5 分鐘影片、一次一個分析工作，AI 請求依序執行。最長影片時間、字幕量、輸入／輸出 token 上限均設為可配置值；試驗期預設最多 5 分鐘。

### 輸入與輸出

- 每批以 token 預算分組，包含目標句子及少量前後文。前後文只供理解，不重複輸出分析。
- 同一批產生所選語言的翻譯及學習重點，普通句子允許空重點陣列。
- 回傳結構化 JSON：`sentenceId`、`translation`、`learningPoints`。
- 每個重點包含 `category`、`expression`、`shortExplanation`、`detailedExplanation`。
- 類別限定為 `vocabulary`、`grammar`、`expression`、`tone`、`context`。
- AI 不生成時間戳；時間由後端根據句子 ID 連結。
- 只根據字幕及提供的上下文分析；沒有影音輸入時，不聲稱看見畫面或聽出聲調。對不確定的意圖使用條件式解釋。

字幕是待分析資料，不是系統指令。後端驗證 JSON 結構、句子覆蓋、重複／未知 ID、欄位長度及每句重點數量；結構錯誤只作有限次修正重試。JSON 有效不等於語言解釋正確，仍須人工抽查。

### 用量控制

- 同影片、語言及分析版本重用已完成結果，播放及倒帶不呼叫 AI。
- 每批完成就保存，工作重試時跳過已驗證批次。
- 短暫限流、逾時及服務錯誤使用有限次延遲重試，遵從供應商重試提示。
- 每日額度耗盡時標示 `quota_exhausted` 並停止自動重試，不自動切換付費層。
- 記錄 model ID、分析版本、批次狀態及供應商可提供的 token 用量。
- 免費 API 不代表字幕服務或部署也免費。免費層內容可能用於改善 Google 產品；試驗使用公開、非敏感內容。

## 7. Summary

分析完成後就準備好 Summary，觀看後可直接回顧，不依賴影片播放結束事件才呼叫 AI。

以所有已驗證重點為輸入，分類並合併同義／重複項目。每個 Summary 項目保留來源 learning point IDs；原句、翻譯及時間從資料庫讀取，不由 AI 重寫。

驗證每個 learning point 都對應到 Summary 項目，且沒有未知 ID。若 AI 合併失敗，使用按類別及時間排序的完整重點清單作後備，確保沒有遺漏。不同語境的不同意思不應只因表面詞形相同而合併。

## 8. 前端播放行為

- 影片下方顯示日文及預設開啟的翻譯，可關閉翻譯。
- 播放時約每 250 毫秒讀取播放器時間，暫停及跳轉後亦更新。
- 右欄按時間累積已到達的重點，使用 ID 去重；倒帶不刪除已有項目。
- 簡化規則：跳到較後時間時，顯示截至該時間的全部重點；這不代表用戶已觀看或學會。
- 點擊重點暫停並展開詳解；點擊時間連結才跳到相應位置。
- 舊重點可手動捲動查看，新增內容不強制打斷手動閱讀。
- 切換語言時查詢或建立另一份分析，介面不混用兩種解釋語言。
- Summary 收錄整段影片全部重點，不受當前播放進度影響。

## 9. 主要資料結構

以下是邏輯模型；實作可將附屬集合保存為 JSONB，避免過早拆分過多資料表。

| 項目 | 主要資料 |
| --- | --- |
| Video | ID、YouTube ID、標題、時長 |
| Transcript | Video ID、來源、人工／自動類型、內容 hash、原始片段 |
| Sentence | Transcript ID、順序、日文、起迄毫秒、來源片段 IDs |
| Analysis | Transcript ID、語言、版本、model ID、狀態、階段、錯誤、批次進度 |
| SentenceAnalysis | Analysis ID、Sentence ID、翻譯 |
| LearningPoint | SentenceAnalysis ID、類別、表達、簡短及完整解釋 |
| Summary | Analysis ID、分類項目、來源 LearningPoint IDs |

結果唯一鍵包含 transcript hash、句子切分版本、目標語言及分析版本。分析版本代表 prompt、schema 及選定模型設定；其改變須產生新版本，避免混用舊結果。初次查詢可重用已保存的字幕版本；刷新字幕的期限及供應商保存限制待驗證後決定。

不同用戶同時請求相同結果時，以唯一約束及工作狀態防止重複分析。Hangfire 工作可能重跑，因此寫入須可重複執行而不產生重複記錄。播放進度不寫入共用分析資料；跨裝置歷史及帳戶功能尚未納入本輪範圍。

## 10. 初步 API

| 方法及路徑 | 用途 |
| --- | --- |
| `POST /api/analyses` | 提交 `{ youtubeUrl, language }`；回傳 analysis ID、狀態及是否命中快取 |
| `GET /api/analyses/{id}` | 查詢狀態、目前階段、已完成／總批次及安全的錯誤資訊 |
| `GET /api/analyses/{id}/result` | 完成後取得影片、句子、翻譯、重點及 Summary |
| `POST /api/analyses/{id}/retry` | 對可重試的失敗工作重新入列；保留已完成批次 |

新工作或進行中工作回傳 `202`；已完成快取回傳 `200`。尚未完成的 result 請求回傳明確的未就緒狀態。錯誤使用穩定 code，例如 `invalid_url`、`transcript_unavailable`、`video_not_embeddable`、`quota_exhausted`、`analysis_failed`。

工作生命週期為 `queued → processing → ready`，失敗為 `failed`；具體處理階段獨立保存。錯誤另有 `retryable` 屬性，不將每日額度耗盡當作立即可重試。

## 11. 本機開發與部署

建議目錄：

```text
src/
  Yohaku.Api/       # API、服務、EF Core、背景工作
  yohaku-web/       # React、TypeScript、Vite
tests/
  Yohaku.Api.Tests/
```

本機使用 Vite 開發伺服器、ASP.NET Core 及本機／Docker PostgreSQL。前端透過開發 proxy 存取 API；Gemini key 放在 .NET User Secrets，不提交到 repository。

部署初期可由 ASP.NET Core 提供前端建置的靜態檔案，使用同一 origin，並連接託管 PostgreSQL。主機需支援持續執行 .NET 服務及背景工作；供應商、費用及帳戶驗證方案尚未選定。公開部署前補上存取控制及提交限流；Hangfire dashboard 不對外匿名開放。

## 12. 驗證重點及下一步

- 先驗證真實 YouTube 日文字幕來源；此項是端到端 MVP 的前置依賴。
- 以固定短片字幕測試 Gemini 免費層的翻譯、語境解釋及重點挑選品質。
- 測試無字幕、限流、無效 JSON、未知句子 ID、工作重跑及結果快取。
- 確認無重點句子仍有翻譯，Summary 覆蓋全部有效重點。
- 確認字幕同步、暫停詳解、倒帶不重複、前跳規則及中英文切換。

目前未選定字幕供應商、部署服務、精確套件／模型版本及公開使用者驗證方式。這些屬待驗證項目，不影響先以本機資料驗證 C# 分析流程。

## 13. 官方及專案參考

- [Gemini .NET SDK](https://ai.google.dev/gemini-api/docs/libraries)
- [Gemini 定價與免費層](https://ai.google.dev/gemini-api/docs/pricing)
- [Gemini 用量限制](https://ai.google.dev/gemini-api/docs/rate-limits)
- [Gemini 結構化輸出](https://ai.google.dev/gemini-api/docs/structured-output)
- [YouTube 字幕下載限制](https://developers.google.com/youtube/v3/docs/captions/download)
- [YouTube IFrame Player API](https://developers.google.com/youtube/iframe_api_reference)
- [Hangfire ASP.NET Core](https://docs.hangfire.io/en/latest/getting-started/aspnet-core-applications.html)
- [Hangfire PostgreSQL provider](https://github.com/hangfire-postgres/Hangfire.PostgreSql)
- [Npgsql EF Core provider](https://www.npgsql.org/efcore/)
