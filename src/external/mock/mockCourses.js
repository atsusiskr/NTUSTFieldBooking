// 使用 CourseResponse 欄位製作的前端示範資料，不會送到後端。
const futureAt = (days, hour) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

// 改為 false 時，教練團頁面改讀真實課程與場地 API。
export const USE_MOCK_COACH_COURSES = true;

const mockLocations = {
  "新羽力羽球俱樂部": { id: "demo-location-1", name: "新羽力羽球俱樂部", location_info: "新北市板橋區，入口位於一樓大廳。", latitude: 25.013, longitude: 121.464, facility: "waterdis_restRoom_showerRoom_lockerRoom_carParking", parking_name: "新羽力附設停車場", parking_latitude: 25.0132, parking_longitude: 121.4642 },
  "北新國小羽球館": { id: "demo-location-2", name: "北新國小羽球館", location_info: "由學校側門進入體育館二樓。", latitude: 24.967, longitude: 121.537, facility: "waterdis_restRoom_lighting_motorcycleParking", parking_name: "北新國小周邊停車場", parking_latitude: 24.9672, parking_longitude: 121.5372 },
  "康軒文教羽球館": { id: "demo-location-3", name: "康軒文教羽球館", location_info: "請從大樓正門搭電梯前往球館。", latitude: 24.987, longitude: 121.555, facility: "waterdis_restRoom_airconditioner_equipmentRental", parking_name: "", parking_latitude: null, parking_longitude: null },
  "永平國小體育館": { id: "demo-location-4", name: "永平國小體育館", location_info: "由操場旁的體育館入口進入。", latitude: 25.009, longitude: 121.511, facility: "restRoom_accessible_lighting", parking_name: "永平國小旁收費停車場", parking_latitude: 25.0092, parking_longitude: 121.5112 },
};

// 課程 API 的 teachers 目前只有 user_id、display_name 與頭像；以下簡歷及聯絡資料僅供前端示範。
const mockCoachProfiles = {
  "林雅雯教練": { user_id: "demo-teacher-lin", bio: "以循序漸進的方式帶領初學者建立正確動作，讓每位學員都能自在享受羽球。", specialties: ["初學入門", "正反手基礎", "親子教學"], experience_years: 7, certifications: ["羽球教練研習結業"], email: "lin.coach@example.com" },
  "陳柏宇教練": { user_id: "demo-teacher-chen", bio: "專注雙打站位與攻防輪轉，擅長以實戰練習協助學員建立場上判斷。", specialties: ["雙打戰術", "防守輪轉"], experience_years: 9, certifications: ["羽球專項教學研習結業"], email: "chen.coach@example.com" },
  "王志明教練": { user_id: "demo-teacher-wang", bio: "以步法與擊球節奏為訓練核心，帶領學員提升進階攻擊與落點控制能力。", specialties: ["殺球訓練", "步法", "進階對抗"], experience_years: 11, certifications: ["羽球專項教學研習結業"], email: "wang.coach@example.com" },
  "張怡婷教練": { user_id: "demo-teacher-chang", bio: "重視安全與互動，透過遊戲化課程讓親子一起學習羽球基本動作。", specialties: ["親子羽球", "基礎動作"], experience_years: 6, certifications: ["兒童運動教學研習結業"], email: "chang.coach@example.com" },
  "李承翰教練": { user_id: "demo-teacher-lee", bio: "用清楚的動作拆解和回饋，幫助學員穩定腳步、提升對打時的移動效率。", specialties: ["米字步", "移動訓練", "中級對打"], experience_years: 8, certifications: ["羽球專項教學研習結業"], email: "lee.coach@example.com" },
  "趙書豪教練": { user_id: "demo-teacher-chao", bio: "以單打實戰情境設計課程，訓練學員在不同比分下選擇合適的攻防策略。", specialties: ["單打戰術", "比賽分析"], experience_years: 10, certifications: ["羽球競技訓練研習結業"], email: "chao.coach@example.com" },
};

export const getMockCoachProfile = (userId) => Object.values(mockCoachProfiles)
  .find((profile) => profile.user_id === userId) || null;

const examples = [
  { title: "羽球初級入門體驗", owner_name: "林雅雯教練", teacher: "林雅雯教練", course_type: "trial", description: "適合初級與零基礎學員，從握拍、發球開始。", teaching_content: "初級握拍與正反手基礎。", mock_level_label: "初級", venue_name: "新羽力羽球俱樂部", price: 0, venue_fee: 0, capacity: 8, enrolled_count: 3, days: 3, hour: 19, count: 1, payment_methods: [] },
  { title: "雙打輪轉與站位", owner_name: "阿北羽球教練團", teacher: "陳柏宇教練", course_type: "single", description: "適合中級學員，練習雙打攻防輪轉。", teaching_content: "中級補位、平抽擋與前後場配合。", mock_level_label: "中級", venue_name: "北新國小羽球館", price: 650, venue_fee: 150, capacity: 12, enrolled_count: 8, days: 5, hour: 20, count: 1, payment_methods: ["onsite", "transfer"], owner_type: "group" },
  { title: "週末進階殺球訓練", owner_name: "王志明教練", teacher: "王志明教練", course_type: "recurring", description: "適合進階學員，以六週系統課提升攻擊能力。", teaching_content: "進階跳殺、落點控制與攻守轉換。", mock_level_label: "進階", venue_name: "康軒文教羽球館", price: 3600, venue_fee: 600, capacity: 6, enrolled_count: 4, days: 7, hour: 10, count: 6, payment_methods: ["transfer"] },
  { title: "親子羽球同樂課", owner_name: "張怡婷教練", teacher: "張怡婷教練", course_type: "single", description: "適合初級親子共同參加，認識羽球基本動作。", teaching_content: "初級趣味對打與安全觀念。", mock_level_label: "初級", venue_name: "永平國小體育館", price: 500, venue_fee: 100, capacity: 10, enrolled_count: 10, days: 9, hour: 15, count: 1, payment_methods: ["onsite"] },
  { title: "羽球中級步法強化班", owner_name: "李承翰教練", teacher: "李承翰教練", course_type: "recurring", description: "適合有對打經驗的中級學員。", teaching_content: "中級米字步、啟動與回位訓練。", mock_level_label: "中級", venue_name: "新羽力羽球俱樂部", price: 2400, venue_fee: 400, capacity: 8, enrolled_count: 2, days: 4, hour: 18, count: 4, payment_methods: ["onsite", "transfer"] },
  { title: "進階單打戰術課", owner_name: "阿北羽球教練團", teacher: "趙書豪教練", course_type: "single", description: "適合進階學員，分析單打得分策略。", teaching_content: "進階節奏控制與關鍵分處理。", mock_level_label: "進階", venue_name: "北新國小羽球館", price: 900, venue_fee: 200, capacity: 4, enrolled_count: 1, days: 11, hour: 14, count: 1, payment_methods: ["transfer"], owner_type: "group" },
];

export function getMockCourses(sportId) {
  return [...examples, ...examples.map((item) => ({ ...item, title: `${item.title}・第二梯`, days: item.days + 14 }))]
    .map((item, index) => {
      const id = `demo-course-${index + 1}`;
      const sessions = Array.from({ length: item.count }, (_, offset) => ({
        id: `${id}-session-${offset + 1}`,
        seq: offset + 1,
        start_at: futureAt(item.days + offset * 7, item.hour),
        end_at: futureAt(item.days + offset * 7, item.hour + 2),
        status: "scheduled",
        venue_note: item.venue_name,
      }));
      return {
        id, owner_type: item.owner_type || "coach", owner_name: item.owner_name,
        coach_id: item.owner_type === "group" ? null : `demo-coach-${index + 1}`,
        group_id: item.owner_type === "group" ? `demo-group-${index + 1}` : null,
        title: item.title, description: item.description, teaching_content: item.teaching_content,
        mock_level_label: item.mock_level_label,
        sport_id: sportId, sport_name: "目前球類（示範）", course_type: item.course_type,
        capacity: item.capacity, enrolled_count: item.enrolled_count,
        remaining_seats: item.capacity - item.enrolled_count,
        venue_name: item.venue_name, location_id: mockLocations[item.venue_name]?.id || null,
        location: mockLocations[item.venue_name] || null, timezone: "Asia/Taipei",
        is_free: item.price + item.venue_fee === 0, price: item.price, venue_fee: item.venue_fee,
        total_fee: item.price + item.venue_fee, payment_methods: item.payment_methods,
        bank_code: null, bank_account: null, bank_account_name: null,
        bank_info_available: item.payment_methods.includes("transfer"),
        allow_leave: item.count > 1, leave_deadline_hours: item.count > 1 ? 24 : null,
        allow_makeup: item.count > 1, makeup_limit: item.count > 1 ? 1 : null,
        makeup_valid_days: item.count > 1 ? 30 : null,
        allow_cancel: true, cancel_deadline_hours: 48,
        rules_leave: item.count > 1 ? "上課前 24 小時可申請請假。" : "單堂課請提前聯絡教練。",
        rules_makeup: item.count > 1 ? "每期可補課一次，須先確認名額。" : "此課程不提供補課。",
        rules_cancellation: "開課前 48 小時可提出取消申請。",
        rules_refund: "退款方式與金額由教練依課程規則確認。",
        rules_noshow: "未事先通知且未出席視為缺席。",
        enrollment_deadline: futureAt(item.days - 1, 23), status: "open",
        teachers: [{ user_id: mockCoachProfiles[item.teacher]?.user_id || `demo-teacher-${index + 1}`, display_name: item.teacher, avatar: null, avatar_thumbnail: null }],
        session_count: sessions.length, first_session_at: sessions[0].start_at,
        last_session_at: sessions[sessions.length - 1].start_at,
        next_session_at: sessions[0].start_at, sessions,
        can_manage: false, my_enrollment_id: null,
        participant_stats: { total: item.enrolled_count, genders: [], age_groups: [], skill_levels: [] },
        created_at: new Date().toISOString(),
      };
    }).sort((a, b) => new Date(a.next_session_at) - new Date(b.next_session_at));
}
