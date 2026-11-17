import { translate } from "../locale/i18n";
export const UNKNOWN_ERROR_MESSAGE = "common.requestErrors.messages.pleaseConfirmRetry";

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
    return { title: translate("common.requestErrors.messages.connectionTimeout"), message: translate("common.requestErrors.messages.pleaseConfirmRetry") };
  }

  const status = error?.response?.status;
  if (!status && (error?.code === "ERR_NETWORK" || error?.message === "Network Error")) {
    return { title: translate("common.requestErrors.errors.failed"), message: translate("common.requestErrors.errors.cannotPleaseConfirmRetry") };
  }

  if (overrides[status]) return overrides[status];
  if (status === 401) return { title: translate("common.requestErrors.messages.loginAlready"), message: translate("common.requestErrors.errors.pleaseRetryLogin") };
  if (status === 403) return { title: translate("common.requestErrors.messages.nonePermission"), message: translate("common.requestErrors.messages.currentAccountNoneThisPermission") };
  if (status === 404) return { title: translate("common.requestErrors.messages.data"), message: translate("common.requestErrors.errors.relatedDataPleaseRetry") };
  if (status === 409) return { title: translate("common.requestErrors.messages.dataConflict"), message: translate("common.requestErrors.errors.dataAlreadyOrAndOtherPleaseRetry") };
  if (status === 400 || status === 422) return { title: translate("common.requestErrors.errors.dataError"), message: translate("common.requestErrors.messages.submitDataPlease") };
  if (status === 429) return { title: translate("common.requestErrors.messages.tooManyRequests"), message: translate("common.requestErrors.messages.pleaseLater") };
  if (status >= 500) return { title: translate("common.requestErrors.errors.temporarilyCannot"), message: translate("common.requestErrors.messages.pleaseLater") };
  return { title: translate("common.requestErrors.errors.error"), message: translate(UNKNOWN_ERROR_MESSAGE) };
}
