import { translate } from "../locale/i18n";
import api from "../baseApi.js";
import { locationService } from "./locationService.js";
import { useAuthStore } from "../store/authStore.js";

let pendingOrdersRequest = null;

const matchesPickUpKeyword = (group, keyword) => [
  group.title,
  group.host?.display_name,
  group.host?.username,
  group.host_name,
].some((value) => String(value || "").toLocaleLowerCase().includes(keyword));

const getRawMyPickUpOrders = () => {
  const token = useAuthStore.getState().token;
  if (pendingOrdersRequest?.token === token) return pendingOrdersRequest.promise;

  const promise = api.get("/pickup-orders").then((res) => res.data);
  pendingOrdersRequest = { token, promise };
  const clearPending = () => {
    if (pendingOrdersRequest?.promise === promise) pendingOrdersRequest = null;
  };
  promise.then(clearPending, clearPending);
  return promise;
};

export const createPickUpLoadContext = () => {
  const groupRequests = new Map();
  const locationRequests = new Map();
  const remember = (requests, id, load) => {
    const key = String(id);
    if (!requests.has(key)) {
      requests.set(key, load().catch((error) => {
        requests.delete(key);
        throw error;
      }));
    }
    return requests.get(key);
  };

  return {
    getGroup: (id) => remember(groupRequests, id, () => pickUpService.getPickUpDetail(id)),
    getLocation: (id) => remember(locationRequests, id, () => locationService.getLocationInfo(id)),
  };
};

export const pickUpService = {
  sendHostMessage: async (groupId, message) => {
    const res = await api.post(`/pickup-groups/${encodeURIComponent(groupId)}/host-messages`, message);
    return res.data;
  },
  createPickUpGroup: async (payload) => {
    const res = await api.post("/pickup-groups", payload);
    return res.data;
  },
  // 取得臨打團細節
  getPickUpDetail: async (groupId) => {
    const res = await api.get(`/pickup-groups/${groupId}`);
    return res.data;
  },

  // 取得臨打團清單
  getPickUpList: async (params = {}, { myOrders, context = createPickUpLoadContext(), searchKeyword = "" } = {}) => {
    const [res, orders] = await Promise.all([
      api.get("/pickup-groups", { params }),
      myOrders === undefined ? pickUpService.getMyPickUpList().catch(() => []) : Promise.resolve(myOrders).catch(() => []),
    ]);

    const { data } = res;
    if (!Array.isArray(data.items)) throw new Error(translate("臨打團清單回應格式不正確"));
    const pickups = data.items;
    const page = Number.isInteger(data.page) && data.page > 0 ? data.page : params.page || 1;
    const pageSize = Number.isInteger(data.page_size) && data.page_size > 0
      ? data.page_size : params.page_size || 10;
    const total = Number.isInteger(data.total) && data.total >= 0 ? data.total : null;

    // 建立一個映射，將我的訂單的 pickup_group_id 對應到其狀態
    const enrolledStatusMap = (Array.isArray(orders) ? orders : []).reduce((acc, order) => {
      acc[order.pickup_group_id] = order.status;
      return acc;
    }, {});

    // 對每個 pickup group 進行處理，加入 location info 和設施資訊
    const pickupWithLocation = await Promise.all(
      pickups.map(async (pickup) => {
        const orderStatus = enrolledStatusMap[pickup.id];
        let pickupInfo;
        try {
          pickupInfo = await context.getGroup(pickup.id);
          if (!pickupInfo) throw new Error("臨打團詳情為空");
        } catch (error) {
          console.error(`無法取得 ${pickup.id} 的臨打團詳情:`, error);
          if (searchKeyword && !matchesPickUpKeyword(pickup, searchKeyword)) return null;
          return {
            ...pickup,
            location: null,
            facilities: [],
            enrolledStatus: orderStatus || null,
            detailsUnavailable: true,
          };
        }
        if (searchKeyword && !matchesPickUpKeyword(pickupInfo, searchKeyword)
          && !matchesPickUpKeyword(pickup, searchKeyword)) return null;
        let locationInfo = pickupInfo.location || pickup.location || null;
        const locationId = pickupInfo.location_id || pickup.location_id;
        if (locationId) {
          try { locationInfo = await context.getLocation(locationId) || locationInfo; }
          catch (error) { console.error(`無法取得 ${locationId} 的場地資訊:`, error); }
        }
        return {
          ...pickupInfo,
          host: pickupInfo.host || pickup.host,
          location: locationInfo,
          facilities: typeof locationInfo?.facility === "string"
            ? locationInfo.facility.split("_").filter(Boolean) : [],
          enrolledStatus: orderStatus || null,
        };
      }),
    );
    return {
      items: searchKeyword ? pickupWithLocation.filter(Boolean) : pickupWithLocation,
      total,
      page,
      pageSize,
      sourceCount: pickups.length,
      hasNext: total === null ? pickups.length === pageSize : page * pageSize < total,
    };
  },

  // 搜尋時走完後端分頁，再比對完整詳情中的團名與團主；避免只搜尋目前顯示的一頁。
  searchPickUpGroups: async (params, keyword, options = {}) => {
    const normalizedKeyword = String(keyword || "").trim().toLocaleLowerCase();
    if (!normalizedKeyword) return [];

    const matches = [];
    let page = 1;
    while (true) {
      const result = await pickUpService.getPickUpList({ ...params, page, page_size: 20 }, {
        ...options, searchKeyword: normalizedKeyword,
      });
      matches.push(...result.items);
      if (!result.hasNext || result.sourceCount === 0 || result.page < page) break;
      page += 1;
    }
    return matches;
  },

  // 報名臨打團
  joinPickUpGroup: async (groupId, payload) => {
    const path = `/pickup-groups/${groupId}/${payload ? 'party-orders' : 'orders'}`;
    if (payload) {
      console.log(`[團體報名 API]\nPOST ${path}\nContent-Type: application/json\n\n${JSON.stringify(payload, null, 2)}`);
    }
    const res = await api.post(path, payload);
    return res.data;
  },

  // 取得我的臨打團預約清單
  getMyPickUpList: async (withDetail = false, { orders, context, confirmedOnly = false } = {}) => {
    const rawOrders = orders === undefined ? await getRawMyPickUpOrders() : await orders;
    if (!withDetail) return rawOrders;

    const requestContext = context || createPickUpLoadContext();
    const relevantOrders = confirmedOnly
      ? rawOrders.filter((order) => order.status === "confirmed") : rawOrders;
    const ordersWithDetail = await Promise.all(
      relevantOrders.map(async (order) => {
        let pickUpdetail;
        try {
          pickUpdetail = await requestContext.getGroup(order.pickup_group_id);
          if (!pickUpdetail) throw new Error("臨打團詳情為空");
        } catch (error) {
          console.error(`無法取得訂單 ${order.id} 的臨打團詳情:`, error);
          return { ...order, title: order.title || translate("活動資訊暫時無法取得"), location: null, detailsUnavailable: true };
        }
        let locationInfo = pickUpdetail.location || order.location || null;
        if (pickUpdetail.location_id) {
          try { locationInfo = await requestContext.getLocation(pickUpdetail.location_id) || locationInfo; }
          catch (error) { console.error(`無法取得 ${pickUpdetail.location_id} 的場地資訊:`, error); }
        }
        return {
          ...order,
          location: locationInfo,
          title: pickUpdetail.title,
          sport: pickUpdetail.sport || order.sport,
          start_time: pickUpdetail.start_time,
          end_time: pickUpdetail.end_time,
          pickupGroup: {
            ...pickUpdetail,
            location: locationInfo,
            facilities: typeof locationInfo?.facility === "string"
              ? locationInfo.facility.split("_").filter(Boolean) : [],
            enrolledStatus: order.status || "pending",
          },
        };
      }),
    );
    return ordersWithDetail;
  },

  cancelPickUpOrder: async (orderId) => {
    const res = await api.patch(`/pickup-orders/${orderId}`, { status: "cancel_request" });
    return res.data;
  },
};
