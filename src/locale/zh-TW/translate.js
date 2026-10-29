import { uiMessages } from "./ui";

export const zhTWDictionary = {
  ui: uiMessages,
  loginPage: {
    title: "揪打球和租場地系統",
    loadingMessage: "登入中...",
    input: {
      label: {
        email: "電子郵件",
        password: "密碼",
      },
      placeholder: {
        email: "輸入你的電子郵件",
        password: "輸入你的密碼",
      },
    },
    errorMessage: {
      error: "登入錯誤",
      externalLoginError: "請稍後重試",
      invalidCredentials: "電子郵件或密碼錯誤",
      requiredSportsType: "請選擇球的類型",
    },
  },

  registerPage: {
    title: "註冊",
    input: {
      label: {
        name: "姓名",
        username: "使用者名稱 (只能填英文或數字)",
        gender: "性別",
        birthDate: "出生日期",
        email: "電子郵件",
        password: "密碼 (至少 8 個字元)",
        confirmPassword: "確認密碼",
      },
      placeholder: {
        name: "輸入你的名稱",
        username: "輸入你的使用者名稱",
        email: "輸入你的電子郵件",
        password: "輸入你的密碼",
        confirmPassword: "再次輸入你的密碼",
      },
    },
    errorMessage: {
      error: "註冊錯誤",
      requiredFields: "請填寫所有必填欄位",
      emailExist: "該電子郵件已被註冊過",
      usernameInvalid: "使用者名稱只能包含英文或數字",
      emailInvalid: "請輸入有效的電子郵件",
      genderInvalid: "請選擇性別",
      birthDateInvalid: "請輸入有效且不晚於今天的出生日期",
      passwordMismatch: "密碼與確認密碼不一致",
      passwordTooShort: "密碼長度至少需要 8 個字元",
      registrationFailed: "註冊失敗，請稍後再試",
    },
    button: {
      registering: "註冊中...",
      register: "註冊",
    },
  },

  pickUpPage: {
    title: "臨打團清單",
    loadingMessage: "取得臨打團資料中...",
    groupEmpty: "暫無可預約的團",
    label: {
      hostName: "主辦人 : ",
      location: "地點 : ",
      time: "時間 : ",
      facilities: "場地設施",
      level: "程度",
      levelNull: "未指定",
      filter: "篩選球團",
    },
    button: {
      detail: "顯示詳細",
      refresh: "重新整理",
      hostApply: "我要開團",
    },

    successMessage: {
      registrationSuccess: "報名成功，已送出臨打申請。"
    },

    errorMessage: {
      error: "臨打團錯誤",
      fetchFailed: "取得臨打團清單失敗，請稍後再試",
      registrationFailed: "報名失敗，請稍後再試",
      timeConflict: "此時間段已有報名活動",
    },
  },

  common: {
    null: "無",
    range: "範圍",
    more: "更多",
    loading: "載入中...",
    status: {
      full: "已額滿",
      pending: "審核中",
      confirmed: "已報名",
      cancelled: "已取消",
      cancel_request: "取消申請中",
      rejected: "已被拒絕",
      default: "立即報名",
    },
    filter: {
      label: {
        distance: "距離",
        start: "時間"
      }
    }
  },

  facilities: {
    waterdis: "飲水機",
    airconditioner: "冷氣",
    accessible: "無障礙設施",
    wifi: "網路",
    restRoom: "廁所",
    showerRoom: "淋浴間",
    lighting: "照明設備",
    lockerRoom: "更衣室",
    equipmentRental: "器材租借",
    firstAid: "急救設施",
  },
};
