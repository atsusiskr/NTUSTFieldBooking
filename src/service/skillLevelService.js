import api from "../baseApi.js";

const pendingRequests = new Map();
const pendingMyLevelRequests = new Map();
const cacheKey = (sportId) => `skillLevels:${sportId}`;
const cacheTimeKey = (sportId) => `skillLevelsUpdated:${sportId}`;
const CACHE_FALLBACK_MS = 5 * 60 * 1000;

function normalizeLevels(items) {
  const unique = new Map();
  for (const item of items) {
    if (!Number.isInteger(item.level) || typeof item.label !== "string") {
      throw new Error("程度表資料格式不正確");
    }
    unique.set(item.level, { level: item.level, label: item.label });
  }
  return [...unique.values()].sort((a, b) => a.level - b.level);
}

async function fetchLevels(sportId) {
  const allItems = [];
  const pageSize = 20;
  let previousPage = null;

  // 先取齊分頁再篩選球類，避免只拿到第一頁的部分程度。
  for (let page = 1; ; page += 1) {
    const { data } = await api.get("/skill-levels", {
      params: { page, page_size: pageSize, sort_order: "ASC" },
    });
    if (!Array.isArray(data.items)) throw new Error("程度表回應格式不正確");
    if (data.items.length === 0) break;

    const signature = JSON.stringify(data.items);
    if (signature === previousPage) throw new Error("程度表分頁未正確更新");
    previousPage = signature;
    allItems.push(...data.items);

    const actualPageSize = Number.isInteger(data.page_size) && data.page_size > 0
      ? data.page_size : pageSize;
    if (Number.isInteger(data.total)) {
      if (allItems.length >= data.total) break;
    } else if (data.items.length < actualPageSize) break;
  }

  const levels = normalizeLevels(allItems.filter(
    (item) => String(item.sport_id) === String(sportId) && item.is_active === true
  ));
  try {
    // 只保存 [{ level, label }]，不另外保存對照表或上下限。
    localStorage.setItem(cacheKey(sportId), JSON.stringify(levels));
    localStorage.setItem(cacheTimeKey(sportId), String(Date.now()));
  } catch {
    // 儲存空間不可用時，仍可使用這次從 API 取得的資料。
  }
  return levels;
}

export const skillLevelService = {
  refreshSkillLevels(sportId) {
    if (!sportId) return Promise.reject(new Error("請先選擇球類"));
    if (!pendingRequests.has(sportId)) {
      pendingRequests.set(sportId, fetchLevels(sportId).finally(() => {
        pendingRequests.delete(sportId);
      }));
    }
    return pendingRequests.get(sportId);
  },

  async getSkillLevels(sportId) {
    if (!sportId) throw new Error("請先選擇球類");
    if (pendingRequests.has(sportId)) return pendingRequests.get(sportId);
    try {
      // 每次開啟頁面先確認 API；舊版快取可能保留已變更的標籤。
      return await skillLevelService.refreshSkillLevels(sportId);
    } catch (error) {
      try {
        const updatedAt = Number(localStorage.getItem(cacheTimeKey(sportId)));
        const saved = localStorage.getItem(cacheKey(sportId));
        if (updatedAt > 0 && Date.now() - updatedAt < CACHE_FALLBACK_MS && saved !== null) {
          const levels = JSON.parse(saved);
          if (Array.isArray(levels)) return normalizeLevels(levels);
        }
      } catch {
        // 快取缺少或損壞時保留原本的 API 錯誤。
      }
      throw error;
    }
  },

  getMyLevel(sportId) {
    if (!sportId) return Promise.reject(new Error("請先選擇球類"));
    if (!pendingMyLevelRequests.has(sportId)) {
      pendingMyLevelRequests.set(sportId,
        api.get(`/me/skill-levels/${sportId}`)
          .then((res) => res.data)
          .finally(() => pendingMyLevelRequests.delete(sportId))
      );
    }
    return pendingMyLevelRequests.get(sportId);
  },

  async setMyLevel(sportId, level) {
    const res = await api.put(`/me/skill-levels/${sportId}`, { skill_level: level });
    return res.data;
  },
};
