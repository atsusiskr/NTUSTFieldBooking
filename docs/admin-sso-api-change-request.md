# 管理後台免重登：API 需求

前台與管理後台使用同一個 API，但位於不同網域，無法直接共用登入狀態。以下為**待新增**的兩個端點，路徑可由後端調整；回應格式沿用現有 `LoginResponse` 與 `{ "error": "..." }`。

## 1. 申請一次性登入碼

`POST /v1/auth/admin-handoff-codes`

- Header：`Authorization: Bearer <前台目前的 access_token>`；不需 request body。
- 後端確認帳號啟用且符合後台既有權限規則。
- 成功回傳 `201`：`{ "code": "<一次性登入碼>", "expires_at": "<ISO 8601 UTC>" }`。
- 失敗：`401` token 無效；`403` 無後台權限；`429` 請求過於頻繁。

## 2. 兌換登入碼

`POST /v1/auth/admin-handoff-codes/exchange`

- Body：`{ "code": "<一次性登入碼>" }`；不需帶前台 token。
- 後端再次確認帳號狀態與後台權限，成功後**原子地註銷登入碼**。
- 成功回傳 `200`：沿用現有登入回應 `{ "access_token": "<新 token>", "user": { ... } }`。
- 失敗：`400` code 無效、過期或已使用；`403` 權限已撤銷；`429` 嘗試過於頻繁。

## 流程與必要限制

前台申請 code → 跳轉 `https://vdmin.chenmh.dev/sso/callback?code=...` → 後台移除網址中的 code、呼叫兌換 API → 保存新 token 並以 `GET /me` 驗證使用者 → 進入後台。後台需新增 callback 頁面。

code 建議 **60 秒內有效、僅能使用一次**；不可把 access token 放在網址，且 code/token 不可記錄到日誌或分析工具。全程使用 HTTPS，回應設定 `Cache-Control: no-store`，後台 callback 設定 `Referrer-Policy: no-referrer`。是否能進後台，仍依後台現有權限規則，不能因免重登而放寬。

參考：[現有 API Swagger](https://swagger-field.gravitycat.tw/#/)；後台網址：[vdmin.chenmh.dev](https://vdmin.chenmh.dev/login)。
