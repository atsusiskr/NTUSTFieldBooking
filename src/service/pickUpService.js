import api from "../baseApi.js";
import { locationService } from "./locationService.js";

export const pickUpService = {
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
  getPickUpList: async (params = {}) => {
    const [res, myOrders] = await Promise.all([
      api.get("/pickup-groups", { params }),
      pickUpService.getMyPickUpList().catch(() => []),
    ]);

    const { data } = res;
    if (!Array.isArray(data.items)) throw new Error("臨打團清單回應格式不正確");
    const pickups = data.items;
    const page = Number.isInteger(data.page) && data.page > 0 ? data.page : params.page || 1;
    const pageSize = Number.isInteger(data.page_size) && data.page_size > 0
      ? data.page_size : params.page_size || 10;
    const total = Number.isInteger(data.total) && data.total >= 0 ? data.total : null;

    // 建立一個映射，將我的訂單的 pickup_group_id 對應到其狀態
    const enrolledStatusMap = myOrders.reduce((acc, order) => {
      acc[order.pickup_group_id] = order.status;
      return acc;
    }, {});

    // 對每個 pickup group 進行處理，加入 location info 和設施資訊
    const pickupWithLocation = await Promise.all(
      pickups.map(async (pickup) => {
        const orderStatus = enrolledStatusMap[pickup.id];

        try {
          const pickupInfo = await pickUpService.getPickUpDetail(pickup.id);
          const locationInfo = await locationService.getLocationInfo(
            pickup.location_id,
          );
          const facilities = locationInfo?.facility.split("_") || [];

          return {
            ...pickupInfo,
            location: locationInfo,
            facilities: facilities,
            enrolledStatus: orderStatus || null,
          };
        } catch (error) {
          console.error(`沒有抓到 ${pickup.id} 的location info:`, error);
          return {
            ...pickup,
            location: null,
            enrolledStatus: orderStatus || null,
          };
        }
      }),
    );
    return {
      items: pickupWithLocation,
      total,
      page,
      pageSize,
      hasNext: total === null ? pickups.length === pageSize : page * pageSize < total,
    };
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
  getMyPickUpList: async (withDetail = false) => {
    const res = await api.get("/pickup-orders");
    const order = res.data;

    if (!withDetail) return order;

    const orderWithDetial = await Promise.all(
      order.map(async (order) => {
        const pickUpdetail = await pickUpService.getPickUpDetail(
          order.pickup_group_id,
        );
        const locationInfo = await locationService.getLocationInfo(
          pickUpdetail.location_id,
        );
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
    return orderWithDetial;
  },

  cancelPickUpOrder: async (orderId) => {
    const res = await api.patch(`/pickup-orders/${orderId}`, { status: "cancel_request" });
    return res.data;
  },
};
