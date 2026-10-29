const AUTHORIZATION_URL = "https://access.line.me/oauth2/v2.1/authorize";
const TRANSACTION_KEY = "line-login-transaction";
const TRANSACTION_LIFETIME_MS = 10 * 60 * 1000;

const base64Url = (bytes) => btoa(String.fromCharCode(...bytes))
  .replace(/\+/g, "-")
  .replace(/\//g, "_")
  .replace(/=+$/, "");

const randomValue = () => base64Url(crypto.getRandomValues(new Uint8Array(32)));

export const getLineRedirectUri = () =>
  process.env.REACT_APP_LINE_REDIRECT_URI || `${window.location.origin}/line/callback`;

export async function startLineAuthorization() {
  const channelId = process.env.REACT_APP_LINE_CHANNEL_ID;
  if (!channelId) throw new Error("尚未設定 LINE Login Channel ID（REACT_APP_LINE_CHANNEL_ID）。");

  const redirectUri = getLineRedirectUri();
  const state = randomValue();
  const nonce = randomValue();
  const codeVerifier = randomValue();
  const challengeBytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(codeVerifier));
  const codeChallenge = base64Url(new Uint8Array(challengeBytes));

  sessionStorage.setItem(TRANSACTION_KEY, JSON.stringify({
    state, nonce, codeVerifier, redirectUri, createdAt: Date.now(),
  }));

  const url = new URL(AUTHORIZATION_URL);
  url.search = new URLSearchParams({
    response_type: "code",
    client_id: channelId,
    redirect_uri: redirectUri,
    state,
    scope: process.env.REACT_APP_LINE_EMAIL_SCOPE === "true" ? "openid profile email" : "openid profile",
    nonce,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  }).toString();
  window.location.assign(url.toString());
}

export function consumeLineTransaction(returnedState) {
  const saved = sessionStorage.getItem(TRANSACTION_KEY);
  sessionStorage.removeItem(TRANSACTION_KEY);
  if (!saved || !returnedState) throw new Error("LINE 登入驗證已失效，請重新嘗試。");

  let transaction;
  try {
    transaction = JSON.parse(saved);
  } catch {
    throw new Error("LINE 登入驗證已失效，請重新嘗試。");
  }

  if (transaction.state !== returnedState
    || !transaction.nonce
    || !transaction.codeVerifier
    || transaction.redirectUri !== getLineRedirectUri()
    || !Number.isFinite(transaction.createdAt)
    || Date.now() - transaction.createdAt > TRANSACTION_LIFETIME_MS
    || transaction.createdAt > Date.now()) {
    throw new Error("LINE 登入驗證已失效，請重新嘗試。");
  }
  return transaction;
}
