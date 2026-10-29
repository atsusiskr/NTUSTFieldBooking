import { translate } from "../../locale/i18n";
import { describeRequestError } from "../../utils/requestError";

const errorText = (value) => {
    if (typeof value === "string") return value.trim();
    if (Array.isArray(value)) return value.map(errorText).filter(Boolean).join("；");
    if (value && typeof value === "object") return errorText(value.message || value.msg || value.detail);
    return "";
};

export function describePickUpJoinError(error) {
    const commonFailure = describeRequestError(error);
    if (commonFailure.title === translate("連線逾時") || commonFailure.title === translate("網路連線失敗")) return commonFailure;
    const data = error?.response?.data;
    const status = error?.response?.status;
    const message = [data?.message, data?.error, data?.detail].map(errorText).find(Boolean) || "";
    const code = [data?.code, data?.error_code, data?.error?.code].filter((value) => typeof value === "string").join(" ");
    const reason = `${code} ${message}`.toLowerCase();

    if (/time[_\s-]?conflict|時間衝突/.test(reason)) {
        return { title: translate("報名時間衝突"), message: translate("此時間段已有報名活動。") };
    }
    if (/deadline|registration.*(?:closed|ended|expired)|group.*(?:ended|expired)|報名.*截止/.test(reason)) {
        return { title: translate("活動報名已截止"), message: translate("這個臨打團已超過報名截止時間，無法再報名。"), refresh: true, closeDialog: true };
    }
    if (/fully[_\s-]?booked|(?:group|event)[_\s-]+(?:is[_\s-]+)?full\b|capacity[_\s-]?(?:exceeded|full)|not enough (?:remaining )?(?:slots|seats|capacity)|名額不足|已?額滿/.test(reason)) {
        return { title: translate("預約額滿"), message: translate("請持續關注通知並了解是否有名額釋出，重新整理後調整人數。"), refresh: true };
    }
    if (/already.*(?:booked|registered|joined)|duplicate.*(?:order|registration)|已(?:報名|預約)/.test(reason)) {
        return { title: translate("已經報名"), message: translate("你已報名這個臨打團，請到我的預約查看。"), refresh: true };
    }
    if (status === 401) return { title: translate("登入已失效"), message: translate("請重新登入後再報名。") };
    if (status === 403) return { title: translate("無法報名"), message: translate("目前的帳號沒有報名權限。") };
    if (status === 404) return { title: translate("活動不存在"), message: translate("找不到這個臨打團，請重新整理列表。"), refresh: true };
    return commonFailure;
}
