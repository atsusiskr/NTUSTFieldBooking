# React 前端與多語系約定

## 文案與語系

- 元件內使用 `const t = useTranslation()`；一般工具函式使用 `translate()`。兩者都在 `src/locale/i18n.js`。
- 新增或遷移文案時使用描述用途的語意鍵，例如 `notificationPage.title`、`notificationPage.card.actions.markRead`；繁中內容放在 `src/locale/zh-TW/translate.js` 的對應頁面結構。`ui.js` 暫供尚未遷移的畫面使用。
- 同一原文在不同畫面若需要不同譯法，改用頁面專屬的語意鍵，避免共用原文鍵造成譯法衝突。
- 動態文案使用具名參數，例如 `t("notificationPage.pagination.total", { count })`，字典中放完整句子 `"共 {count} 則"`。整句一起翻譯，避免把「共」「則」分開拼接。
- `aria-label`、`alt`、`placeholder`、對話框、錯誤訊息及選項標籤也屬於畫面文案。
- API 欄位、路由、狀態碼、表單 `name`/`value` 與比較條件保持穩定值；只在顯示時翻譯標籤。後端送來的自由文字不自動翻譯。
- 新增語系時建立同結構字典，啟動時呼叫 `registerLocale("en-US", dictionary)`，再用 `setLocale("en-US")` 切換。缺少的鍵會退回繁體中文，語系會儲存在 `localStorage`。
- 日期使用 `formatDateTime()` 或日期選擇器；不要在元件寫死 `zh-TW` 日期格式。

## 元件與資料流

- 前端以 `venue` 命名場地資料、元件與樣式；以 `sportType` 表示球類、`resourceType` 表示 API 資源類型。既有 API 欄位名稱、服務網址及部署識別維持原約定。
- 頁面負責載入資料與組合區塊；可重用表單、卡片、篩選器放在 `components`。共享的日期、驗證與錯誤解析放在 `utils`；只供外部預約功能使用的純函式放在 `src/external/utils`。
- `useEffect` 的請求要處理卸載或切換條件，並包含實際使用的依賴。不要把翻譯後的文字作為業務狀態或 API 參數。
- 列表使用穩定的資料 ID 當 `key`，互動欄位提供可讀的 `label` 或 `aria-label`。
- 為核心流程與翻譯切換撰寫行為測試；提交前執行 `CI=true npm test -- --watch=false` 與 `npm run build`。
