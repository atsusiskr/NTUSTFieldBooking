import api from "../baseApi.js";
import { useAuthStore } from "../store/authStore.js";

export const loginService = async (email, password) => {
  const res = await api.post("/auth/login", { email, password });

  if (!res.data?.access_token) {
    throw new Error("Invalid credentials");
  }

  useAuthStore.getState().setAuth(res.data);

  return res.data;
};

export const loginWithLineService = async ({ code, redirectUri, codeVerifier, nonce }) => {
  const res = await api.post("/auth/line", {
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
    nonce,
  });
  if (!res.data?.access_token || !res.data?.user?.id) {
    throw new Error("LINE 登入回應缺少網站登入資訊。");
  }
  useAuthStore.getState().setAuth(res.data);
  return res.data;
};

export const logoutService = async () => {
  await api.post("/auth/logout");
  useAuthStore.getState().setLogout();
};
