# 前台與管理後台共用登入 Session

後端 [API 文件](https://hackmd.io/@nekogravitycat/B16qfP93Me) 已提供伺服器端 session，不需要再建立一次性登入碼端點。前台為 `playball.gravitycat.tw`、後台為 `vdmin.gravitycat.tw`、API 為 `api-field.gravitycat.tw`，三者都在 `gravitycat.tw` 同站。

## 前台目前的流程

1. `POST /auth/login` 或 `POST /auth/line`：API 設定 HttpOnly 的 `__Host-session` Cookie，回傳短效 `access_token` 與 `user`。Token 只保存在 JavaScript 記憶體。
2. 頁面載入：以 `withCredentials: true` 呼叫 `POST /auth/refresh`，成功才進入受保護頁面；`401` 顯示登入頁。
3. 一般 API 請求帶 `Authorization: Bearer <access_token>`；收到 `401` 時 refresh 並重送一次。
4. 登出：呼叫 `POST /auth/logout`，由 API 撤銷 session 並清除 Cookie。

## 後台流程與檢查

1. 公開後台的前端程式已在啟動時以 `withCredentials: true` 呼叫同一 API 的 `POST /auth/refresh`；成功時將短效 Token 存在記憶體，登入頁會導向符合使用者權限的頁面。
2. 後台後續 API 請求仍帶 Bearer Token；到期後用相同 Cookie refresh。後台不得從 URL、前台的 localStorage 或跨網域 JavaScript 讀取 Token。
3. 後台 Origin 已由 API 的 CORS 預檢回應允許（`Access-Control-Allow-Origin: https://vdmin.gravitycat.tw`、`Access-Control-Allow-Credentials: true`）。正式環境仍需在瀏覽器確認 API 能保存並回送 `__Host-session; HttpOnly; Secure; SameSite=Lax` Cookie。
4. 登出應呼叫同一個 `POST /auth/logout`。後台是否允許進入仍由 API 與後台的權限檢查決定，不能只靠有 Cookie 判斷管理員資格。

前台右上角的「切換至後台」直接導向後台登入入口。公開程式碼與 CORS 預檢都符合共用 Session 的設計；完整免重登仍需用有權限的帳號在瀏覽器實際驗證 Cookie、refresh 與後台權限導頁。
