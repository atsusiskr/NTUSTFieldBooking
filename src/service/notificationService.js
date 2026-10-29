import { translate } from "../locale/i18n";
import api from "../baseApi";

export const notificationService = {
  async getList({ unreadOnly = false, page = 1, pageSize = 20, signal } = {}) {
    const { data } = await api.get("/notifications", {
      params: { unread_only: unreadOnly, page, page_size: pageSize }, signal,
    });
    if (!Array.isArray(data?.items)) {
      throw new Error(translate("通知列表回應格式不正確"));
    }
    const total = Number.isInteger(data.total) && data.total >= 0 ? data.total : null;
    const resolvedPage = Number.isInteger(data.page) && data.page > 0 ? data.page : page;
    const resolvedPageSize = Number.isInteger(data.page_size) && data.page_size > 0 ? data.page_size : pageSize;
    return { items: data.items, total,
      page: resolvedPage, pageSize: resolvedPageSize,
      hasNext: total === null ? data.items.length === resolvedPageSize : resolvedPage * resolvedPageSize < total };
  },
  async getUnreadCount({ signal } = {}) {
    const { data } = await api.get("/notifications/unread-count", { signal });
    const count = data.unread ?? data.unread_count;
    if (!Number.isInteger(count) || count < 0) throw new Error(translate("未讀數回應格式不正確"));
    return count;
  },
  async markRead(id) {
    await api.patch(`/notifications/${encodeURIComponent(id)}/read`);
    window.dispatchEvent(new Event("notifications:changed"));
  },
  async markAllRead() {
    const { data } = await api.post("/notifications/read-all");
    window.dispatchEvent(new Event("notifications:changed"));
    return data.updated;
  },
};
