import api from "../baseApi.js";

export const getUserProfile = async () => {
    const res = await api.get("/me");
    return res.data.user;
}

export const updateUserProfile = async (profile) => {
    const res = await api.patch("/me", profile);
    return res.data;
}

export const unlinkLineIdentity = async () => {
    await api.delete("/me/identities/line");
};

export const setInitialPassword = async ({ email, password }) => {
    await api.put("/me/password", email ? { email, password } : { password });
};
