import api from "../baseApi";
import { locationService } from "./locationService";

const locationCache = new Map();

export const courseService = {
  async withLocation(course) {
    if (!course?.location_id) return course;
    const id = String(course.location_id);
    if (!locationCache.has(id)) {
      locationCache.set(id, locationService.getLocationInfo(id).catch((error) => {
        locationCache.delete(id);
        console.error(`無法取得課程場地 ${id} 的資訊:`, error);
        return null;
      }));
    }
    return { ...course, location: await locationCache.get(id) };
  },
  async getList(params) {
    const { data } = await api.get("/courses", { params });
    if (!Array.isArray(data?.items)) throw new Error("課程清單回應格式不正確");
    return data;
  },
  async getAll(params) {
    const items = [];
    for (let page = 1; ; page += 1) {
      const result = await this.getList({ ...params, page, page_size: 100 });
      items.push(...result.items);
      if (result.items.length === 0 || (Number.isInteger(result.total) && items.length >= result.total)
        || result.items.length < 100) return items;
    }
  },
  async getDetail(id) {
    const { data } = await api.get(`/courses/${encodeURIComponent(id)}`);
    if (!data || typeof data !== "object" || !data.id) throw new Error("課程詳情回應格式不正確");
    return data;
  },
  async enroll(id, paymentMethod) {
    const path = `/courses/${encodeURIComponent(id)}/enrollments`;
    const { data } = paymentMethod
      ? await api.post(path, { payment_method: paymentMethod })
      : await api.post(path);
    return data;
  },
};
