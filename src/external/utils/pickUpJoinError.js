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
    if (commonFailure.title === translate("pickUpPage.joinErrors.messages.connectionTimeout") || commonFailure.title === translate("pickUpPage.joinErrors.errors.failed")) return commonFailure;
    const data = error?.response?.data;
    const status = error?.response?.status;
    const message = [data?.message, data?.error, data?.detail].map(errorText).find(Boolean) || "";
    const code = [data?.code, data?.error_code, data?.error?.code].filter((value) => typeof value === "string").join(" ");
    const reason = `${code} ${message}`.toLowerCase();

    if (/time[_\s-]?conflict|時間衝突/.test(reason)) {
        return { title: translate("pickUpPage.joinErrors.messages.registrationTime"), message: translate("pickUpPage.joinErrors.messages.thisTimeAlreadyRegistration") };
    }
    if (/deadline|registration.*(?:closed|ended|expired)|group.*(?:ended|expired)|報名.*截止/.test(reason)) {
        return { title: translate("pickUpPage.joinErrors.messages.registrationAlreadyDeadline"), message: translate("pickUpPage.joinErrors.errors.pickupGroupAlreadyRegistrationDeadlineTimeCannotRegistration"), refresh: true, closeDialog: true };
    }
    if (/fully[_\s-]?booked|(?:group|event)[_\s-]+(?:is[_\s-]+)?full\b|capacity[_\s-]?(?:exceeded|full)|not enough (?:remaining )?(?:slots|seats|capacity)|名額不足|已?額滿/.test(reason)) {
        return { title: translate("pickUpPage.joinErrors.messages.booking"), message: translate("pickUpPage.joinErrors.messages.pleaseNotificationCapacityRefreshPeopleCount"), refresh: true };
    }
    if (/already.*(?:booked|registered|joined)|duplicate.*(?:order|registration)|已(?:報名|預約)/.test(reason)) {
        return { title: translate("pickUpPage.joinErrors.messages.alreadyRegistration"), message: translate("pickUpPage.joinErrors.messages.yourRegisteredPickupGroupPleaseMyBookingView"), refresh: true };
    }
    if (status === 401) return { title: translate("pickUpPage.joinErrors.messages.loginAlready"), message: translate("pickUpPage.joinErrors.errors.pleaseRetryLoginRegistration") };
    if (status === 403) return { title: translate("pickUpPage.joinErrors.errors.cannotRegistration"), message: translate("pickUpPage.joinErrors.messages.currentAccountNoneRegistrationPermission") };
    if (status === 404) return { title: translate("pickUpPage.joinErrors.messages.eventNotFound"), message: translate("pickUpPage.joinErrors.errors.pickupGroupPleaseRetry"), refresh: true };
    return commonFailure;
}
