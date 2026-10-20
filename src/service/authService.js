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

// The ID token is issued by LINE through LIFF. The server must verify it with
// LINE before it creates a session or returns an access token.
export const loginWithLineService = async (idToken) => {
  const res = await api.post("/auth/line/login", { id_token: idToken });
  return res.data;
};

export const registerWithLineService = async ({ registrationToken, username, displayName, gender, birthDate, email }) => {
  const res = await api.post("/auth/line/register", {
    registration_token: registrationToken,
    username,
    display_name: displayName,
    gender,
    birth_date: birthDate,
    email: email || undefined,
  });

  if (!res.data?.access_token) {
    throw new Error("LINE registration did not return an access token");
  }

  useAuthStore.getState().setAuth(res.data);
  return res.data;
};
