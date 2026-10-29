# React 前端與多語系約定

## 文案與語系

- 元件內使用 `const t = useTranslation()`；一般工具函式使用 `translate()`。兩者都在 `src/locale/i18n.js`。
- 現有語意鍵維持 `loginPage.title` 等路徑；其餘畫面文案收在 `src/locale/zh-TW/ui.js`，以原始文案作為穩定鍵。不要只改鍵而不更新所有語系。
- 同一原文在不同畫面若需要不同譯法，改用頁面專屬的語意鍵，避免共用原文鍵造成譯法衝突。
- 動態文案使用具名參數，例如 `t("共 {count} 則", { count })`。整句一起翻譯，避免把「共」「則」分開拼接。
- `aria-label`、`alt`、`placeholder`、對話框、錯誤訊息及選項標籤也屬於畫面文案。
- API 欄位、路由、狀態碼、表單 `name`/`value` 與比較條件保持穩定值；只在顯示時翻譯標籤。後端送來的自由文字不自動翻譯。
- 新增語系時建立同結構字典，啟動時呼叫 `registerLocale("en-US", dictionary)`，再用 `setLocale("en-US")` 切換。缺少的鍵會退回繁體中文，語系會儲存在 `localStorage`。
- 日期使用 `formatDateTime()` 或日期選擇器；不要在元件寫死 `zh-TW` 日期格式。

## 元件與資料流

- 頁面負責載入資料與組合區塊；可重用表單、卡片、篩選器放在 `components`。共享的日期、驗證與錯誤解析放在 `utils`；只供外部預約功能使用的純函式放在 `src/external/utils`。
- `useEffect` 的請求要處理卸載或切換條件，並包含實際使用的依賴。不要把翻譯後的文字作為業務狀態或 API 參數。
- 列表使用穩定的資料 ID 當 `key`，互動欄位提供可讀的 `label` 或 `aria-label`。
- 為核心流程與翻譯切換撰寫行為測試；提交前執行 `CI=true npm test -- --watch=false` 與 `npm run build`。
