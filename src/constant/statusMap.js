import { translate } from "../locale/i18n";

export const statusMap = {
  full: {
    labelKey: "common.status.full",
    class: "bg-gray-500 text-gray-800 border border-gray-300",
  },
  pending: {
    labelKey: "common.status.pending",
    class: "bg-yellow-500 cursor-not-allowed opacity-80",
  },
  confirmed: {
    labelKey: "common.status.confirmed",
    class: "bg-green-500 cursor-not-allowed opacity-80",
  },
  cancelled: {
    labelKey: "common.status.cancelled",
    class: "bg-gray-500 text-gray-800 border border-gray-300",
  },
  cancel_request: {
    labelKey: "common.status.cancel_request",
    class: "bg-red-300 text-black-500 border border-red-300",
  },
  cancelled_request: {
    labelKey: "common.status.cancel_request",
    class: "bg-red-100 text-red-800 border border-red-300",
  },
  rejected: {
    labelKey: "common.status.rejected",
    class: "bg-red-500 cursor-not-allowed opacity-80",
  },
  default: {
    labelKey: "common.status.default",
    class: "bg-blue-500 hover:bg-blue-600",
  },
};

export const getStatusLabel = (status, t = translate) =>
  statusMap[status] ? t(statusMap[status].labelKey) : (status || t(statusMap.default.labelKey));
