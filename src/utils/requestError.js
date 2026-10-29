import { translate } from "../locale/i18n";
export const UNKNOWN_ERROR_MESSAGE = "請確認網路環境或稍後重試";

const responseText = (value) => {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map(responseText).filter(Boolean).join(" ");
  if (value && typeof value === "object") return responseText(value.message || value.msg || value.detail);
  return "";
};

export const requestErrorDetail = (error) => {
  const data = error?.response?.data;
  return [data?.message, data?.error, data?.detail].map(responseText).find(Boolean) || "";
};

export const isRequestTimeout = (error) =>
  ["ECONNABORTED", "ETIMEDOUT"].includes(error?.code)
  || [408, 504].includes(error?.response?.status)
  || /(?:timeout|timed out|逾時|超時)/i.test(String(error?.message || ""));

export function describeRequestError(error, overrides = {}) {
  if (isRequestTimeout(error)) {
    return { title: translate("連線逾時"), message: translate("連線逾時，請確認網路環境後重試。") };
  }

  const status = error?.response?.status;
  if (!status && (error?.code === "ERR_NETWORK" || error?.message === "Network Error")) {
    return { title: translate("網路連線失敗"), message: translate("無法連線，請確認網路環境後重試。") };
  }

  if (overrides[status]) return overrides[status];
  if (status === 401) return { title: translate("登入已失效"), message: translate("請重新登入後再試。") };
  if (status === 403) return { title: translate("沒有權限"), message: translate("目前的帳號沒有執行此操作的權限。") };
  if (status === 404) return { title: translate("資料不存在"), message: translate("找不到相關資料，請重新整理後再試。") };
  if (status === 409) return { title: translate("資料衝突"), message: translate("資料已變更或與其他操作衝突，請重新整理後再試。") };
  if (status === 400 || status === 422) return { title: translate("資料格式錯誤"), message: translate("送出的資料有誤，請檢查後再試。") };
  if (status === 429) return { title: translate("操作太頻繁"), message: translate("請稍後再試。") };
  if (status >= 500) return { title: translate("系統暫時無法處理"), message: translate("請稍後再試。") };
  return { title: translate("錯誤"), message: translate(UNKNOWN_ERROR_MESSAGE) };
}
