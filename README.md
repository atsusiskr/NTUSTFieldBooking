# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:5713](http://localhost:5713) to view it in your browser (port configured in `.env.development.local`).

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
# nayamiskr-NTUSTFleidBooking

前端元件、文案與多語系開發方式請參考 [React 前端與多語系約定](docs/frontend-i18n.md)。

## LINE 登入／註冊

正式流程使用 LINE Login authorization code + PKCE。登入頁會建立一次性的 `state`、`nonce`、`code_verifier`，導向 LINE；LINE 回到 `/line/callback` 後，前端核對 `state`，將 `code`、`redirect_uri`、`code_verifier`、`nonce` 送至 `POST /auth/line`。後端負責驗證 LINE 身分、登入或自動建立帳號，再回傳與 `/auth/login` 相同的 `access_token` 和 `user`，另回傳 `is_new_user`。正式流程不需要前端送出 LINE user ID、Email 或密碼。

部署設定：

1. 設定 `REACT_APP_LINE_DEMO_MODE=false` 和 `REACT_APP_LINE_CHANNEL_ID`（**LINE Login** channel 的 Channel ID，不是 LIFF ID 或 Channel Secret）。
2. 目前本機的 `.env.development.local` 設有 `PORT=5713` 和 `REACT_APP_LINE_REDIRECT_URI=http://localhost:5713/line/callback`。正式建置不要使用本機 callback；未設定 `REACT_APP_LINE_REDIRECT_URI` 時，預設是目前網頁的 origin 加 `/line/callback`。實際 URI 必須與 LINE Developers 的 callback URL、後端 `LINE_REDIRECT_URIS` 允許清單完全相同。正式環境需把正式網域的 URI 也加入兩處設定。
3. 後端必須設定好 LINE Channel ID、Channel Secret、`LINE_REDIRECT_URIS`，並允許前端網域以憑證呼叫 API（CORS credentials）。文件中的正式環境 Cookie 是 `__Host-session; HttpOnly; Secure; SameSite=Lax`；前端與 API 都需在 `gravitycat.tw` 之下。重啟或重建前端後再測試。
4. 登入頁點「使用 LINE 登入／註冊」；既有 LINE 帳號應登入，新 LINE 帳號應由 API 建立後登入。可在瀏覽器 Network 檢查 `POST /auth/line` 的回應，但不要記錄或分享授權碼、token、Cookie。

所有 API 請求都會帶 Cookie。網站啟動時呼叫 `POST /auth/refresh` 恢復登入；既有 Access Token 過期時也會先 refresh 再重送原請求。登出呼叫 `POST /auth/logout` 撤銷 session。若 LINE channel 已獲准 Email address permission，可設 `REACT_APP_LINE_EMAIL_SCOPE=true`，授權時才會要求 `email` 權限。

既有 Bot 的 LIFF 登入入口會先把登入頁開到外部瀏覽器，再開始上述授權流程。這是因為 LINE 不保證 LIFF 內直接開啟 LINE Login 授權頁的行為。

本機 `localhost:5713` 與正式 API 的 `gravitycat.tw` 不同站；後端文件設定的 `SameSite=Lax` Cookie 無法在這種跨站 API 請求中維持 session。本機可驗證授權回跳與 API 回應；若要驗證重新整理後的登入狀態，請使用與 API 同站的 HTTPS 測試網域。
手機上的 `localhost` 指的是手機本身，不能回到電腦的開發伺服器；手機測試請使用手機可連線的 HTTPS 測試網域，並同步更新前端設定、LINE Console 和後端允許清單。

若暫時要看舊的畫面展示，把 `REACT_APP_LINE_DEMO_MODE` 改回 `true`。展示流程只存本分頁的 `sessionStorage`，不會真的登入。
