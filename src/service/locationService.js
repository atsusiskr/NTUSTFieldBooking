import { translate } from "../locale/i18n";
import api from "../baseApi.js";

export const locationService = {
    getCreationLocations: async () => {
        const locations = [];
        let page = 1;
        while (true) {
            const { data } = await api.get("/locations", { params: { page, page_size: 100, opening: true } });
            if (!Array.isArray(data.items)) throw new Error(translate("場地清單格式不正確"));
            locations.push(...data.items);
            if (!data.items.length || (Number.isInteger(data.total)
                ? locations.length >= data.total
                : data.items.length < (data.page_size || 100))) break;
            page += 1;
        }
        return locations;
    },
    getLocationInfo: async (locationId) => {
        const res = await api.get(`/locations/${locationId}`);
        return res.data;
    }
}
