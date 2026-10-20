# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

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

## LINE 登入展示模式

目前 `.env` 設定 `REACT_APP_LINE_DEMO_MODE=true`。重新啟動 `npm start` 後，登入頁的 LINE 按鈕會開啟 `/line-login` 展示流程：模擬 LINE 授權、補填註冊資料、展示完成，以及再次登入。可以直接用 `http://localhost:3000/line-login` 在本機預覽；這個模式不需要設定 LINE Developers Endpoint URL。

展示資料只保存在目前分頁的 `sessionStorage`，不會呼叫 LINE 或系統後端，也不會產生系統登入憑證。關閉分頁即清除資料；頁面上的「重新體驗首次註冊」也可清除。

若要讓其他裝置暫時觀看，保持 `npm start` 運行，再於另一個終端執行 `npx ngrok http 3000`，分享 ngrok 提供的 HTTPS 網址。這個展示流程不會跳到 LINE，因此不需更改 LIFF Endpoint URL。

正式串接時，將 `REACT_APP_LINE_DEMO_MODE=false` 並重新啟動或重建前端。正式流程需要 HTTPS 的 LIFF Endpoint，以及後端 `/auth/line/login`、`/auth/line/register` API。不要把展示模式當作正式帳號驗證。
