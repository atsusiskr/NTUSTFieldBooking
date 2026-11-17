export const zhTWDictionary = {
  "notificationPage": {
    "title": "我的通知",
    "loading": "正在載入通知…",
    "unreadCount": "{count} 則未讀",
    "pageUnreadCount": "{count} 則未讀（此頁）",
    "actions": {
      "refresh": "重新整理",
      "markAllRead": "全部標為已讀",
      "marking": "處理中…",
      "retry": "重試"
    },
    "filter": {
      "label": "通知篩選",
      "all": "全部通知",
      "unread": "未讀通知"
    },
    "feedback": {
      "markedRead": "通知已標記為已讀。",
      "allMarkedRead": "全部通知已標記為已讀。"
    },
    "empty": {
      "all": "目前沒有通知。",
      "unread": "目前沒有未讀通知。"
    },
    "pagination": {
      "label": "通知分頁",
      "total": "共 {count} 則",
      "page": "第 {page} 頁",
      "pageOfTotal": "第 {page} / {total} 頁",
      "previous": "上一頁",
      "next": "下一頁"
    },
    "card": {
      "defaultTitle": "通知",
      "emptyContent": "此通知沒有附加內容。",
      "dateUnavailable": "時間未提供",
      "type": {
        "pickupOrderCreated": "報名通知",
        "pickupOrderConfirmed": "報名確認",
        "pickupOrderRejected": "報名未通過",
        "pickupOrderCancelled": "報名取消",
        "pickupOrderCancelledByHost": "主揪取消報名",
        "pickupOrderCancelRequested": "取消申請",
        "pickupPaymentUpdated": "付款狀態更新",
        "pickupGroupUpdated": "活動更新",
        "pickupGroupCancelled": "活動取消",
        "skillRated": "程度評分",
        "system": "系統通知"
      },
      "status": {
        "unread": "未讀",
        "read": "已讀",
        "viewed": "已閱讀"
      },
      "actions": {
        "expand": "查看相關資訊",
        "collapse": "收合資訊",
        "markRead": "標記已讀",
        "marking": "處理中…"
      }
    },
    "relatedInfo": {
      "loading": "載入相關資訊中…",
      "reload": "重新載入相關資訊",
      "groupUnavailable": "相關臨打團已不存在或無法查看。",
      "groupTitleFallback": "相關臨打團",
      "currentInfo": "以下為活動目前的資訊。",
      "eventTime": "活動時間",
      "endsAt": "至 {time}",
      "location": "地點",
      "locationLoadFailed": "地點暫時無法載入",
      "locationUnavailable": "未提供地點",
      "host": "主揪",
      "fee": "費用",
      "unavailable": "未提供",
      "orderStatus": "報名狀態：{status}",
      "paymentStatus": "付款狀態：{status}",
      "partySize": "報名人數：{count} 人",
      "orderId": "相關報名編號",
      "openGroups": "前往臨打頁面",
      "openOrders": "前往我的預約",
      "groupStatus": {
        "active": "進行中",
        "cancelled": "已取消",
        "completed": "已結束"
      },
      "registrationStatus": {
        "pending": "待確認",
        "confirmed": "已確認",
        "cancelled": "已取消",
        "cancelRequest": "申請取消中",
        "rejected": "未通過"
      },
      "paymentState": {
        "pending": "待付款",
        "done": "已付款",
        "failed": "付款失敗"
      }
    },
    "errors": {
      "messages": {
        "notification": "通知列表回應格式不正確",
        "unread": "未讀數回應格式不正確"
      }
    }
  },
  "loginPage": {
    "title": "揪打球和租場地系統",
    "loadingMessage": "登入中...",
    "input": {
      "label": {
        "email": "電子郵件",
        "password": "密碼"
      },
      "placeholder": {
        "email": "輸入你的電子郵件",
        "password": "輸入你的密碼"
      }
    },
    "errorMessage": {
      "error": "登入錯誤",
      "externalLoginError": "請稍後重試",
      "invalidCredentials": "電子郵件或密碼錯誤",
      "requiredSportsType": "請選擇球的類型"
    },
    "errors": {
      "pleaseEnterEmailAndPassword": "請輸入電子郵件與密碼。",
      "pleaseEnterValidEmail": "請輸入有效的電子郵件。",
      "lineLoginFailed": "LINE 登入失敗"
    },
    "messages": {
      "login": "登入中...",
      "or": "或",
      "createAccountOrLogin": "展示模式不會建立真實帳號或登入系統。",
      "noneAccount": "還沒有帳號？"
    },
    "actions": {
      "login": "登入中...",
      "login2": "登入",
      "lineLoginRegister": "體驗 LINE 登入／註冊（展示）",
      "loginOrRegisterWithLine": "使用 LINE 登入／註冊",
      "registerAccount": "註冊帳號"
    }
  },
  "registerPage": {
    "title": "註冊",
    "input": {
      "label": {
        "name": "姓名",
        "username": "使用者名稱 (只能填英文或數字)",
        "gender": "性別",
        "birthDate": "出生日期",
        "email": "電子郵件",
        "password": "密碼 (至少 8 個字元)",
        "confirmPassword": "確認密碼"
      },
      "placeholder": {
        "name": "輸入你的名稱",
        "username": "輸入你的使用者名稱",
        "email": "輸入你的電子郵件",
        "password": "輸入你的密碼",
        "confirmPassword": "再次輸入你的密碼"
      }
    },
    "errorMessage": {
      "error": "註冊錯誤",
      "requiredFields": "請填寫所有必填欄位",
      "emailExist": "該電子郵件已被註冊過",
      "usernameInvalid": "使用者名稱只能包含英文或數字",
      "emailInvalid": "請輸入有效的電子郵件",
      "genderInvalid": "請選擇性別",
      "birthDateInvalid": "請輸入有效且不晚於今天的出生日期",
      "passwordMismatch": "密碼與確認密碼不一致",
      "passwordTooShort": "密碼長度至少需要 8 個字元",
      "registrationFailed": "註冊失敗，請稍後再試"
    },
    "button": {
      "registering": "註冊中...",
      "register": "註冊"
    },
    "errors": {
      "usernameAlready": "該使用者名稱已被使用"
    },
    "headings": {
      "basicProfile": "基本資料",
      "loginInfo": "登入資訊"
    },
    "placeholders": {
      "selectBirthDate": "選擇出生日期"
    },
    "actions": {
      "createAccount": "建立帳號",
      "backToLogin": "回到登入"
    },
    "messages": {
      "alreadyAccount": "已有帳號？"
    }
  },
  "pickUpPage": {
    "title": "臨打團清單",
    "loadingMessage": "取得臨打團資料中...",
    "groupEmpty": "暫無可預約的團",
    "label": {
      "hostName": "主辦人 : ",
      "location": "地點 : ",
      "time": "時間 : ",
      "facilities": "場地設施",
      "level": "程度",
      "levelNull": "未指定",
      "filter": "篩選球團"
    },
    "button": {
      "detail": "顯示詳細",
      "refresh": "重新整理",
      "hostApply": "我要開團"
    },
    "successMessage": {
      "registrationSuccess": "報名成功，已送出臨打申請。"
    },
    "errorMessage": {
      "error": "臨打團錯誤",
      "fetchFailed": "取得臨打團清單失敗，請稍後再試",
      "registrationFailed": "報名失敗，請稍後再試",
      "timeConflict": "此時間段已有報名活動"
    },
    "filter": {
      "messages": {
        "notSet": "未設定",
        "minimum": "最低",
        "maximum": "最高",
        "currentProvideThisLevel": "目前僅提供此程度",
        "filterGroup": "篩選球團",
        "filterLevel": "篩選程度",
        "loadLevel": "載入程度中…",
        "thisSportNotYetSettingsLevel": "此球類尚未設定程度"
      },
      "labels": {
        "searchGroupNameOrHost": "搜尋團名或團主",
        "sortMethod": "排序方式"
      },
      "placeholders": {
        "enterGroupNameOrHostName": "輸入團名或團主名稱"
      },
      "accessibility": {
        "searchGroup": "搜尋球團"
      },
      "actions": {
        "clear": "清除"
      },
      "sort": {
        "nearest": "距離最近",
        "startingSoon": "即將開始"
      }
    },
    "createDialog": {
      "labels": {
        "date": "日期",
        "time": "時間",
        "minimumLevel": "程度下限",
        "maximumLevel": "程度上限",
        "atMost": "簡介（選填，最多 100 字）",
        "contactInfoAtMost": "聯絡資訊（選填，最多 500 字）",
        "groupName": "團名",
        "feePerPerson": "每人費用（元）",
        "capacity": "人數上限"
      },
      "messages": {
        "pleaseFillCompleteDateAndTime": "請填寫完整的日期與時間。",
        "registrationDeadlineTimeCannotStartTime": "報名截止時間不能晚於開始時間。",
        "pleaseFillGroupNameSelectVenue": "請填寫團名並選擇場地。",
        "pleaseSelectValidLevel": "請選擇有效的程度。",
        "levelCannot": "程度上限不能小於下限。",
        "orContactInfo": "簡介或聯絡資訊超過字數限制。",
        "createPickupGroup": "建立臨打團",
        "sport": "球類：",
        "loadVenueAndLevelData": "載入場地與程度資料中…",
        "currentNoneSelectOpenVenue": "目前沒有可選擇的開放場地。",
        "basicProfile": "基本資料",
        "time": "活動時間",
        "pleaseSelectVenue": "請選擇場地",
        "start": "開始",
        "end": "結束",
        "registrationDeadline": "報名截止",
        "noLimit": "不設上限"
      },
      "errors": {
        "registrationDeadlineTimeNow": "報名截止時間必須晚於現在。",
        "endTimeStartTime": "結束時間必須晚於開始時間。",
        "feeOr": "費用必須為 0 或正數。",
        "peopleCount": "人數上限必須為正整數。",
        "pleaseRetrySelectValidVenue": "請重新選擇有效的場地。",
        "currentSportNotYetSettingsLevelTemporarilyCannot": "目前球類尚未設定程度，暫時無法開團。"
      },
      "accessibility": {
        "closeCreate": "關閉建立表單"
      },
      "placeholders": {
        "descriptionVenueOr": "活動說明、場地面數或注意事項",
        "lineIdOrMethodPleaseFillProvide": "例如 LINE ID 或聯絡方式；請填寫願意提供給參加者的資訊"
      },
      "actions": {
        "create": "建立中…",
        "createPickupGroup": "建立臨打團"
      },
      "steps": {
        "label": "建立臨打團步驟",
        "registration": "報名設定",
        "previous": "上一步",
        "next": "下一步"
      }
    },
    "hostMessage": {
      "errors": {
        "pleaseFillTitleAndMessageContent": "請填寫標題與訊息內容。",
        "pleaseMessageContentHostCannotMessage": "請檢查訊息內容；團主無法傳訊息給自己。",
        "messagePleaseLater": "訊息傳送太頻繁，請稍後再試。"
      },
      "feedback": {
        "messageAlreadySubmit": "訊息已送出",
        "hostNotification": "團主會收到站內通知。"
      },
      "headings": {
        "messageHost": "傳訊息給團主"
      },
      "labels": {
        "title": "標題",
        "messageContent": "訊息內容"
      },
      "placeholders": {
        "subject": "想詢問的主題",
        "yourHost": "寫下你想詢問團主的事…"
      },
      "actions": {
        "submit": "送出中…",
        "submitMessage": "送出訊息"
      }
    },
    "joinDialog": {
      "messages": {
        "accountDataUsername": "帳號資料缺少 username",
        "registrationMethod": "報名方式",
        "remaining": "剩餘",
        "capacityRegistrationAllCapacity": "個名額。團體報名會一次占用全部所選名額。",
        "accountData": "（帳號資料）",
        "peopleSkillLevelAccountSettings": "本人的運動程度由帳號設定帶入。",
        "loadSkillLevel": "正在載入運動程度…",
        "currentNoneSkillLevel": "目前沒有可選的運動程度。",
        "feeNt": "預計費用：NT$",
        "thisAmountPaymentMethodHost": "此金額僅供參考，實際付款方式依主揪安排。"
      },
      "errors": {
        "cannotRegistrationAccountDataPleaseRetryLoad": "無法取得報名者帳號資料，請重新載入。",
        "pleaseConfirmAccountNameMemberGenderAnd": "請確認帳號名稱、每位成員的性別，以及同行者的運動程度。",
        "partySizeOutOfRange": "團體報名需至少 2 人，且不能超過剩餘的 {value0} 個名額。"
      },
      "headings": {
        "confirmRegistration": "確認報名",
        "numberPeople": "第 1 位：本人",
        "companionNumber": "第 {value0} 位：同行者"
      },
      "labels": {
        "peopleRegistration": "個人報名",
        "registration": "團體報名",
        "registrationAccountName": "報名者帳號名稱",
        "registrationPeopleCountPeople": "報名人數（含本人）",
        "skillLevel": "運動程度"
      },
      "placeholders": {
        "loadAccountData": "正在載入帳號資料…",
        "notYetAccountName": "尚未取得帳號名稱"
      },
      "actions": {
        "submit": "送出中…",
        "confirmRegistration": "確認報名"
      }
    },
    "profileSetup": {
      "messages": {
        "pleaseFillGenderAndLevelRegistrationData": "請填寫性別與程度，完成報名資料。",
        "pleaseSelectYourGenderPickupRegistrationData": "請選擇你的性別，以便完成臨打報名資料。",
        "selectLevelProfile": "選擇符合自己的程度，之後可在個人資料中調整。",
        "sportCurrentNoneLevel": "這個球類目前沒有可選的程度。"
      },
      "headings": {
        "settingsYourBasicProfile": "設定你的基本資料",
        "settingsYourSkillLevel": "設定你的運動程度"
      },
      "labels": {
        "myLevel": "我的程度"
      },
      "actions": {
        "reloadLevel": "重新載入程度選項",
        "laterSettings": "稍後再設定",
        "saveSettings": "儲存設定",
        "saveGender": "儲存性別",
        "saveLevel": "儲存程度"
      }
    },
    "detail": {
      "messages": {
        "hostNotYetProvideNotes": "主揪尚未提供額外備註。",
        "notProvidedHostInfo": "未提供主揪資訊",
        "notProvidedUsername": "未提供 username",
        "pickupGroup": "臨打團",
        "people": "人",
        "registrationAlreadyDeadline": "報名已截止",
        "time": "活動時間",
        "startTime": "開始時間",
        "endTime": "結束時間",
        "registrationDeadlineDate": "報名截止日期",
        "location": "地點",
        "notYetProvide": "尚未提供",
        "clickViewMap": "點擊查看地圖 →",
        "levelAndFee": "程度與費用",
        "level": "不限程度",
        "notYetProvideFacilitiesInfo": "尚未提供設施資訊",
        "parking": "停車場"
      },
      "tooltips": {
        "googleMapsOpenLocation": "在 Google Maps 開啟位置",
        "thisVenueNotYetProvide": "此場地尚未提供座標",
        "host": "聯絡主揪",
        "hostNotYetProvideMethod": "主揪尚未提供聯絡方式",
        "googleMapsOpenParking": "在 Google Maps 開啟停車場導航",
        "thisParkingNotYetProvide": "此停車場尚未提供座標"
      },
      "headings": {
        "hostInfo": "主揪資訊",
        "venueFacilities": "場地設施",
        "hostNotes": "主揪備註"
      },
      "images": {
        "hostAvatar": "{value0} 的頭像"
      },
      "actions": {
        "messageHost": "傳訊息給團主",
        "host": "聯絡主揪",
        "processing": "處理中...",
        "registrationAlreadyDeadline": "報名已截止"
      }
    },
    "map": {
      "messages": {
        "location": "活動地點",
        "hereAre": "這裡有",
        "activities": "場活動",
        "peopleClickView": "人・點擊查看詳情",
        "locationActivityCount": "{value0} · {value1} 場活動",
        "groupCapacity": "{value0} ({value1}/{value2}人)"
      },
      "accessibility": {
        "close": "關閉活動清單",
        "viewLocationActivities": "查看{value0}的 {value1} 場活動"
      }
    },
    "messages": {
      "loadSportData": "載入球類資料中...",
      "registered": "已報名",
      "to": "至",
      "location": "地點：",
      "unspecified": "未指定",
      "yourNoneSettingsGenderAndSportLevel": "你還沒有設定性別與這個球類的程度。",
      "yourNoneSettingsGender": "你還沒有設定性別。",
      "yourNoneSettingsSportLevel": "你還沒有設定這個球類的程度。",
      "currentNone": "目前沒有符合條件的教練團活動。",
      "noneCurrentSearchAndFilterPickupGroup": "沒有符合目前搜尋與篩選條件的臨打團。",
      "thisNoneDatePickupGroupPleaseView": "此頁沒有符合所選日期的臨打團，請切換頁面查看。",
      "registrationAlreadyDeadline": "報名已截止",
      "people": "人",
      "items": "筆",
      "number": "第",
      "page": "頁",
      "resultCount": " · 共 {value0} 筆",
      "searchResultCount": "搜尋「{value0}」：共 {value1} 筆"
    },
    "errors": {
      "registrationAlreadyDeadline": "活動報名已截止",
      "pickupGroupAlreadyRegistrationDeadlineTimeCannotRegistration": "這個臨打團已超過報名截止時間，無法再報名。",
      "pleaseFirstSelectGender": "請先選擇性別。",
      "pleaseFirstSelectValidLevel": "請先選擇有效的程度。",
      "infoTemporarilyCannot": "活動資訊暫時無法取得",
      "pleaseLaterReloadConfirmData": "請稍後重新載入，再確認活動資料。",
      "registeredLoadFailed": "近期已報名活動載入失敗：",
      "cannotProfilePleaseRetryLoad": "無法取得個人資料，請重新載入。",
      "infoTemporarilyCannotPleaseLaterReload": "活動資訊暫時無法取得，請稍後重新載入。",
      "messages": {
        "pickupGroup": "臨打團清單回應格式不正確"
      },
      "errors": {
        "infoTemporarilyCannot": "活動資訊暫時無法取得"
      }
    },
    "feedback": {
      "settingsSuccess": "設定成功",
      "yourGenderAndSkillLevelAlreadySave": "你的性別與運動程度已儲存。",
      "yourGenderAlreadySave": "你的性別已儲存。",
      "yourSkillLevelAlreadySave": "你的運動程度已儲存。",
      "createSuccess": "建立成功",
      "pickupGroupAlreadyCreateCurrentFilterShow": "臨打團已建立；列表會依目前的篩選條件顯示。",
      "groupRegistrationSubmitted": "已送出 {value0} 人的團體報名，請等待主揪確認。"
    },
    "headings": {
      "coachGroups": "教練團",
      "yourRegistrationPickupGroupDayStart": "提醒：你報名的臨打團將在兩天內開始"
    },
    "accessibility": {
      "filterGroup": "篩選球團",
      "upcomingStartRegistered": "即將開始的已報名活動",
      "coachGroupPagination": "教練團分頁",
      "pickupGroup": "臨打團分頁"
    },
    "actions": {
      "viewInfo": "查看活動資訊",
      "settingsData": "設定資料",
      "settingsLevel": "設定程度",
      "search": "清除搜尋",
      "showDetails": "顯示詳細",
      "infoLoadFailed": "資訊載入失敗",
      "registrationAlreadyDeadline": "報名已截止",
      "previousPage": "上一頁",
      "nextPage": "下一頁"
    },
    "labels": {
      "show": "每頁顯示"
    },
    "joinErrors": {
      "messages": {
        "connectionTimeout": "連線逾時",
        "registrationTime": "報名時間衝突",
        "thisTimeAlreadyRegistration": "此時間段已有報名活動。",
        "registrationAlreadyDeadline": "活動報名已截止",
        "booking": "預約額滿",
        "pleaseNotificationCapacityRefreshPeopleCount": "請持續關注通知並了解是否有名額釋出，重新整理後調整人數。",
        "alreadyRegistration": "已經報名",
        "yourRegisteredPickupGroupPleaseMyBookingView": "你已報名這個臨打團，請到我的預約查看。",
        "loginAlready": "登入已失效",
        "currentAccountNoneRegistrationPermission": "目前的帳號沒有報名權限。",
        "eventNotFound": "活動不存在"
      },
      "errors": {
        "failed": "網路連線失敗",
        "pickupGroupAlreadyRegistrationDeadlineTimeCannotRegistration": "這個臨打團已超過報名截止時間，無法再報名。",
        "pleaseRetryLoginRegistration": "請重新登入後再報名。",
        "cannotRegistration": "無法報名",
        "pickupGroupPleaseRetry": "找不到這個臨打團，請重新整理列表。"
      }
    }
  },
  "common": {
    "null": "無",
    "range": "範圍",
    "more": "更多",
    "loading": "載入中...",
    "status": {
      "full": "已額滿",
      "pending": "審核中",
      "confirmed": "已報名",
      "cancelled": "已取消",
      "cancel_request": "取消申請中",
      "rejected": "已被拒絕",
      "default": "立即報名"
    },
    "filter": {
      "label": {
        "distance": "距離",
        "start": "時間"
      }
    },
    "app": {
      "messages": {
        "none": "沒有這東西"
      }
    },
    "labels": {
      "timeSlot": "時段",
      "venue": "場地",
      "gender": "性別",
      "selectDate": "選擇日期"
    },
    "actions": {
      "completeBooking": "完成預約",
      "cancel": "取消",
      "saving": "儲存中...",
      "venue": "場地",
      "myBookings": "我的預約",
      "reload": "重新載入",
      "close": "關閉",
      "backToVenues": "返回場地列表",
      "loading": "載入中…",
      "submitting": "送出中..."
    },
    "dropdown": {
      "messages": {
        "selectSortMethod": "選擇排序方式"
      }
    },
    "sportSwitcher": {
      "accessibility": {
        "sport": "球類",
        "load": "載入中"
      },
      "messages": {
        "load": "載入中"
      }
    },
    "messages": {
      "openingHours": "開放時間",
      "loading": "載入中…",
      "selectSkillLevel": "請選擇程度",
      "gender": "性別",
      "pleaseSelect": "請選擇",
      "male": "男性",
      "female": "女性",
      "other": "其他",
      "notProvided": "未提供",
      "venue": "場地",
      "cancel": "取消",
      "close": "關閉",
      "backToVenues": "返回場地列表"
    },
    "navigation": {
      "messages": {
        "notificationCountItemsUnread": "通知，{count} 則未讀",
        "notificationUnreadNotification": "通知，有未讀通知",
        "notification": "通知",
        "user": "使用者",
        "logout": "登出"
      },
      "headings": {
        "and": "打球租與揪系統"
      },
      "actions": {
        "pickup": "臨打",
        "coachGroups": "教練團",
        "notification": "通知",
        "title": "管理臨打團",
        "booking": "歷史預約",
        "profile": "個人資料",
        "admin": "切換至後台"
      },
      "accessibility": {
        "unreadNotification": "選單，有未讀通知",
        "menu": "選單"
      },
      "images": {
        "user": "使用者頭像"
      }
    },
    "tooltips": {
      "backToCurrentLocation": "回到目前位置"
    },
    "placeholders": {
      "selectDate": "選擇日期"
    },
    "accessibility": {
      "close": "關閉"
    },
    "headings": {
      "myBookings": "我的預約",
      "selectDate": "選擇日期"
    },
    "internalNavigation": {
      "headings": {
        "ntustVenueBooking": "NTUST 場地預約系統"
      },
      "messages": {
        "logout": "登出"
      }
    },
    "skillLevels": {
      "messages": {
        "levelData": "程度表資料格式不正確",
        "level": "程度表回應格式不正確",
        "levelUpdate": "程度表分頁未正確更新"
      },
      "errors": {
        "pleaseFirstSelectSport": "請先選擇球類"
      }
    },
    "dateTime": {
      "messages": {
        "date": "未定日期",
        "time": "未定時間"
      }
    },
    "map": {
      "messages": {
        "distanceDistance": "距離約 {distance} 公里"
      }
    },
    "requestErrors": {
      "messages": {
        "connectionTimeout": "連線逾時",
        "pleaseConfirmRetry": "連線逾時，請確認網路環境後重試。",
        "loginAlready": "登入已失效",
        "nonePermission": "沒有權限",
        "currentAccountNoneThisPermission": "目前的帳號沒有執行此操作的權限。",
        "data": "資料不存在",
        "dataConflict": "資料衝突",
        "submitDataPlease": "送出的資料有誤，請檢查後再試。",
        "tooManyRequests": "操作太頻繁",
        "pleaseLater": "請稍後再試。"
      },
      "errors": {
        "failed": "網路連線失敗",
        "cannotPleaseConfirmRetry": "無法連線，請確認網路環境後重試。",
        "pleaseRetryLogin": "請重新登入後再試。",
        "relatedDataPleaseRetry": "找不到相關資料，請重新整理後再試。",
        "dataAlreadyOrAndOtherPleaseRetry": "資料已變更或與其他操作衝突，請重新整理後再試。",
        "dataError": "資料格式錯誤",
        "temporarilyCannot": "系統暫時無法處理",
        "error": "錯誤"
      }
    },
    "gender": {
      "male": "男性",
      "female": "女性",
      "other": "其他"
    },
    "fixtures": {
      "door": "門",
      "stage": "舞台",
      "restroom": "廁所",
      "entrance": "入口"
    },
    "sports": {
      "baseball": "棒球",
      "volleyball": "排球",
      "badminton": "羽球",
      "tennis": "網球",
      "soccer": "足球",
      "basketball": "籃球",
      "badmintonCourt": "羽球場",
      "tennisCourt": "網球場",
      "basketballCourt": "籃球場",
      "volleyballCourt": "排球場",
      "soccerCourt": "足球場",
      "other": "其他"
    },
    "weekdays": {
      "sunday": "週日",
      "monday": "週一",
      "tuesday": "週二",
      "wednesday": "週三",
      "thursday": "週四",
      "friday": "週五",
      "saturday": "週六"
    },
    "facilities": {
      "waterdis": "飲水機",
      "airconditioner": "冷氣",
      "accessible": "無障礙設施",
      "wifi": "網路",
      "restRoom": "廁所",
      "showerRoom": "淋浴間",
      "lighting": "照明設備",
      "lockerRoom": "更衣室",
      "equipmentRental": "器材租借",
      "firstAid": "急救設施",
      "carParking": "汽車停車場",
      "motorcycleParking": "機車停車場",
      "parking": "停車場"
    }
  },
  "venuePage": {
    "selection": {
      "tooltips": {
        "courtTimeRange": "第 {value0} 面場地 / {value1}-{value2}"
      },
      "errors": {
        "pleaseFirstSelectVenue": "請先選擇場地"
      },
      "actions": {
        "switchTo": "切換為",
        "singleVenueSevenDays": "單場地七日",
        "multipleVenuesSingleDay": "單日多場地"
      },
      "messages": {
        "totalAmount": "總金額：NT$ {value0}",
        "selectedVenueCourt": "場地：{value0} / 第 {value1} 面",
        "selectedTimeRange": "你已選擇：{value0} - {value1}"
      }
    },
    "picker": {
      "messages": {
        "venueNotFoundPrefix": "找不到「",
        "venueData": "」的場地資料",
        "notFound": "找不到",
        "venueData2": "場地資料"
      }
    },
    "bookingCards": {
      "messages": {
        "priceNotProvided": "價格未提供",
        "selectCourtAndTimeSlotClickAlreadyTimeSlot": "可同時選擇不同場面與時段；再次點擊已選時段可取消。",
        "confirmVenueBookingTimeSlot": "正在確認場地可預約時段…",
        "dateCurrentNoneVenueOtherDate": "這個日期目前沒有符合條件的場地，試試其他日期。",
        "currentNoneVenueData": "目前沒有場地資料。",
        "noBusinessHours": "目前沒有可顯示的營業時段。",
        "thisVenueCurrentPausedOpen": "此場地目前暫停開放。",
        "venue": "面場地",
        "to": "至",
        "time": "非營業時間",
        "locationNotProvided": "位置未提供",
        "confirm": "確認中",
        "partiallyUnconfirmed": "部分未確認",
        "timeSlot": "有可選時段",
        "none": "暫無空位",
        "hour": "/ 小時",
        "thisVenuePausedOpen": "此場地暫停開放。",
        "already": "已選",
        "timeSlotsSeparator": "個時段・",
        "itemsBooking": "筆預約",
        "courtDateAndTimeSlot": "可複選不同場面、日期及不連續時段",
        "venueCourtCount": "{value0}・{value1} 個場地",
        "dateTimeRange": "{value0}・{value1} 至 {value2}",
        "courtNumber": "第 {value0} 面"
      },
      "errors": {
        "pleaseFirstLoginConfirmBookingTimeSlot": "請先登入，才能確認自己的預約時段。",
        "alreadyTimeSlotCurrentCannotBookingPleaseCancel": "部分已選時段目前無法預約，請取消該時段或清除選取後重新選擇。",
        "cannotConfirmMyBookingTimeSlot": "無法確認我的預約時段：",
        "venueTimeSlotCannotConfirm": "部分場地時段無法確認："
      },
      "accessibility": {
        "venueAndBookingTimeSlot": "場地與可預約時段",
        "venueMethod": "場地檢視方式",
        "selection": "清除選取",
        "resourceTimeSlot": "{value0} {value1} 至 {value2}，{value3}",
        "dateResourceTimeSlot": "{value0} {value1} {value2} 至 {value3}，{value4}",
        "venueResourceTimeSlot": "{value0}{value1} {value2} 至 {value3}，{value4}",
        "timeRange": "{value0} 至 {value1}"
      },
      "headings": {
        "bookingTimeSlot": "預約時段",
        "selectVenueAndTimeSlot": "選擇場地與時段"
      },
      "actions": {
        "timeSlot": "只看可選時段",
        "multipleVenues": "多場地單日",
        "singleVenueSevenDays": "單場地七日",
        "cards": "卡片",
        "viewVenue": "查看場地詳情 →",
        "goToConfirm": "前往確認"
      },
      "tooltips": {
        "hourlyPrice": "{value0}・{value1} / 小時"
      },
      "status": {
        "myBooking": "我已預約",
        "closed": "未開放",
        "past": "已過時段",
        "advanceNotice": "需提前 7 天",
        "unconfirmed": "未確認",
        "available": "可選擇",
        "booked": "已被預約"
      }
    },
    "map": {
      "messages": {
        "booking": "上次預約",
        "currentLocation": "正在取得目前位置..."
      },
      "tooltips": {
        "viewLocation": "查看位置",
        "confirmSelect": "確認選擇"
      },
      "actions": {
        "alreadySelect": "已選擇",
        "confirmVenue": "確認場地"
      },
      "errors": {
        "cannotLoadMapPleaseLater": "無法載入地圖，請稍後再試。"
      }
    },
    "errors": {
      "cannotSelectionSport": "無法辨識選取的球類",
      "venueDataLoadFailed": "場地資料載入失敗：",
      "messages": {
        "venue": "場地清單格式不正確"
      }
    },
    "messages": {
      "loadVenueData": "載入場地資料中...",
      "dayBooking": "需提前 7 天預約，最早可選",
      "currentNoneProvide": "目前沒有提供",
      "courtVenue": "場面的場館。"
    },
    "headings": {
      "title": "場地預約"
    },
    "accessibility": {
      "selectBookingDate": "選擇預約日期",
      "venueSearch": "場地搜尋結果"
    }
  },
  "userPage": {
    "passwordForm": {
      "errors": {
        "pleaseEnterValidEmail": "請輸入有效的電子信箱。",
        "passwordAtLeastNeed": "密碼至少需要 8 個字元。",
        "enterPassword": "兩次輸入的密碼不一致。",
        "pleaseConfirmAndPassword": "請確認信箱與密碼是否符合要求。",
        "thisAccountAlreadySettingsPasswordCannotSettings": "此帳號已設定密碼，無法再次設定。"
      },
      "labels": {
        "login": "登入信箱",
        "settingsPassword": "設定密碼",
        "confirmPassword": "確認密碼"
      },
      "messages": {
        "thisAccountAlready": "此帳號已有信箱，會沿用原本的信箱。"
      }
    },
    "messages": {
      "peopleLevel": "個人程度回應格式不正確",
      "lineCurrentLoginMethodSettingsAndPassword": "LINE 是目前唯一的登入方式。設定信箱與密碼後，才可以解除綁定。",
      "settingsPasswordLineLink": "設定密碼並解除 LINE 綁定",
      "lineLink": "解除 LINE 綁定？",
      "confirmUnlink": "確認解除綁定",
      "user": "使用者",
      "loading": "讀取中...",
      "notYetSelectSport": "尚未選擇球類",
      "notYetSettings": "尚未設定",
      "levelLevel": "等級 {level}",
      "notSetUsername": "未設定 username",
      "pickupGroup": "臨打團主",
      "peopleAndData": "個人與聯絡資料",
      "optional": "（選填）",
      "currentNoneLevel": "目前沒有可選的程度。",
      "email": "電子信箱",
      "phone": "聯絡電話",
      "birthDate": "出生日期",
      "levelCurrentSport": "程度（目前球類）",
      "saveLoginPassword": "儲存登入密碼",
      "yourCurrentAnd": "你目前參與的運動社群",
      "people": "負責人",
      "administrator": "管理員",
      "manage": "管理",
      "venue": "個場地"
    },
    "headings": {
      "settingsLoginPassword": "先設定登入密碼",
      "people": "個人檔案",
      "info": "基本資訊",
      "loginAndPassword": "登入信箱與密碼",
      "lineAccountLink": "LINE 帳號綁定",
      "organization": "所屬組織",
      "unnamedOrganization": "未命名組織"
    },
    "feedback": {
      "unlinkSuccess": "解除綁定成功",
      "lineAccountAlreadyAndCurrentAccountUnlink": "LINE 帳號已與目前帳號解除綁定。",
      "passwordSettingsSuccess": "密碼設定成功",
      "nowCanAndPasswordLogin": "現在可以使用信箱與密碼登入。",
      "saveSuccess": "儲存成功",
      "profileAndLevelAlreadyUpdate": "個人資料與程度已更新。",
      "levelAlreadyUpdate": "程度已更新。",
      "profileAlreadyUpdate": "個人資料已更新。"
    },
    "errors": {
      "lineNotYetLink": "LINE 尚未綁定",
      "currentAccountNoneLinkLineNone": "目前帳號沒有綁定 LINE，無需解除。",
      "cannotLineLink": "無法解除 LINE 綁定",
      "passwordAlreadySettingsLineCannotPleaseRetry": "密碼已設定，但 LINE 仍無法解除。請重新整理後再試。",
      "lineAccountCannotLoginCurrentAccountPleaseFirst": "解除後，這個 LINE 帳號將無法再登入目前帳號。請先確認已有其他登入方式。",
      "dataComplete": "資料不完整",
      "pleaseFillDisplayNameAndGender": "請填寫顯示名稱與性別。",
      "birthDateError": "出生日期錯誤",
      "pleaseSelectValidTodayBirthDate": "請選擇有效且不晚於今天的出生日期。",
      "phoneError": "電話格式錯誤",
      "pleaseEnterValid": "請輸入有效的手機號碼",
      "levelSelectError": "程度選擇錯誤",
      "pleaseFirstLoadSelectValidLevel": "請先載入並選擇有效的程度。",
      "phonePleaseConfirm": "電話號碼未通過驗證，請確認格式後再試。",
      "temporarilyCannot": "暫時無法讀取",
      "cannotLoadLevelPleaseRetry": "無法載入程度，請重試。",
      "notYetSelectSportPleaseFirstSelectSportSettings": "尚未選擇球類，請先選擇球類再設定程度。",
      "loginSettingsPasswordUsernameAndDataCannot": "登入信箱可在首次設定密碼時補上；username、頭像與組織資料無法在此修改。",
      "skillLevelUpdateFailed": "基本資料已更新，但程度未更新。{value0}"
    },
    "images": {
      "avatar": "{value0} 的頭像"
    },
    "actions": {
      "editData": "編輯資料",
      "saveChanges": "儲存變更",
      "reloadLevel": "重新載入程度",
      "settingsLoginAndPassword": "設定登入信箱與密碼"
    },
    "labels": {
      "displayName": "顯示名稱",
      "phone": "電話",
      "birthDate": "出生日期",
      "levelCurrentSport": "程度（目前球類）"
    },
    "placeholders": {
      "selectBirthDate": "選擇出生日期"
    },
    "password": {
      "messages": {
        "configured": "此帳號已設定密碼，可以使用信箱與密碼登入。",
        "setupHint": "尚未設定密碼時，可在此補上登入信箱與密碼。每個帳號只能設定一次。"
      }
    },
    "line": {
      "messages": {
        "notLinked": "目前帳號未綁定 LINE。",
        "unlinkWarning": "解除後將無法再用這個 LINE 帳號登入目前帳號。"
      },
      "actions": {
        "unlinking": "解除綁定中...",
        "unlink": "解除 LINE 綁定"
      }
    }
  },
  "bookingPage": {
    "errors": {
      "cannotSelectionSport": "無法辨識選取的球類",
      "venueInfoLoadFailedPleaseRetry": "場地資訊載入失敗，請重新整理頁面。"
    },
    "messages": {
      "venueInfo": "取得場地資訊中...",
      "openBooking": "開放預約",
      "pausedOpen": "暫停開放",
      "thisVenueNotYetProvideDetails": "此場地尚未提供詳細介紹。",
      "peopleCount": "容納人數",
      "bookingCourt": "可預約場面",
      "text": "面",
      "notYetProvideLocationInfo": "尚未提供位置資訊",
      "mapView": "在地圖中查看",
      "nearbyLocation": "附近停車位置",
      "notYetProvideInfo": "尚未提供停車資訊",
      "viewLocation": "查看停車位置",
      "notYetProvideItems": "尚未提供使用規則。",
      "notYetProvideFacilitiesInfo": "尚未提供設施資訊。",
      "dayBooking": "需提前 7 天預約，最早可選",
      "thisVenueCurrentNoneBookingCourt": "此場地目前沒有可預約的場面。",
      "personCount": "{value0} 人"
    },
    "images": {
      "venuePhoto": "{value0}場地照片"
    },
    "headings": {
      "venueLocation": "場地位置",
      "info": "停車資訊",
      "items": "使用規則",
      "venueFacilities": "場地設施",
      "selectBookingWeek": "選擇預約週次"
    },
    "accessibility": {
      "selectBookingWeek": "選擇預約週次"
    },
    "actions": {
      "previousWeek": "上一週",
      "nextWeek": "下一週"
    }
  },
  "hostApplyPage": {
    "errors": {
      "error": "錯誤",
      "pleaseFillRequired": "請填寫所有必填欄位",
      "pleaseOrganizer": "請閱讀並同意主辦人規範"
    },
    "feedback": {
      "submitSuccess": "送出成功",
      "applyAlreadySubmitDayReview": "申請已送出！管理員將在 1-3 個工作天內審核。"
    },
    "headings": {
      "applyPickupGroup": "申請成為臨打團長",
      "organizerData": "主辦人資料",
      "hostingPlan": "開團計畫"
    },
    "labels": {
      "realName": "真實姓名",
      "phone": "聯絡電話",
      "organizer": "為什麼想成為主辦人？常在哪裡打球？",
      "alreadyDetailsOrganizer": "我已詳細閱讀，並同意遵守主辦人規範。"
    },
    "placeholders": {
      "pleaseEnter": "請輸入真實姓名",
      "enterPhone": "輸入電話號碼",
      "helpPlayersContactYou": "方便玩家加好友聯絡",
      "people": "例如：因為想找別人切磋球技，常在台大體育館打球"
    },
    "messages": {
      "organizer": "主辦人須知",
      "or": "嚴禁利用平台進行商業營利或黃牛行為。",
      "organizerVenueFeeAndRefund": "主辦人需負責處理該團之場地費用與退款事宜。",
      "permission": "若收到多次惡意放鳥投訴，平台將收回權限。"
    },
    "actions": {
      "submitReview": "送出審核中...",
      "confirmSubmitApply": "確認送出申請",
      "cancelBack": "取消並返回"
    }
  },
  "managePickUpPage": {
    "messages": {
      "notProvided": "未提供姓名",
      "phoneNotProvided": "聯絡電話未提供",
      "registration": "報名",
      "level": "程度",
      "member": "同行成員",
      "registrant": "報名者",
      "thisOrderNotYetProvideMemberData": "此訂單尚未提供成員資料。",
      "saveItemsRegistrationCapacity": "儲存後會釋放這筆報名占用的名額。",
      "selectViewRegistration": "選擇一個活動查看報名者。",
      "registrationOrder": "報名訂單",
      "loadRegistrationData": "載入報名者資料中…",
      "currentNoneRegistrationOrder": "目前還沒有報名訂單。",
      "viewCurrentSportYourCreateAndRegistration": "查看目前球類中你建立的活動與報名者，並更新報名或付款狀態。",
      "loadYourCreatePickupGroup": "載入你建立的臨打團中…",
      "yourCurrentNoneUpcomingStartPickupGroup": "你目前沒有即將開始的臨打團。",
      "load": "繼續載入更多活動。",
      "start": "快開始了",
      "untitledEvent": "未命名活動",
      "loadSportData": "載入球類資料中...",
      "genderNotProvided": "性別未提供",
      "memberNumber": "成員 {value0}",
      "groupRegistrationCount": "團體報名 · {value0} 人"
    },
    "actions": {
      "manage": "管理",
      "save": "儲存中…",
      "saveChanges": "儲存變更",
      "retry": "重試",
      "refresh": "重新整理",
      "backPickupGroup": "返回臨打團",
      "load": "載入更多"
    },
    "labels": {
      "registrationStatus": "報名狀態",
      "paymentStatus": "付款狀態"
    },
    "accessibility": {
      "registrationStatus": "管理報名狀態",
      "member": "成員清單"
    },
    "headings": {
      "registrationStatus": "管理報名狀態",
      "untitledEvent": "未命名活動",
      "title": "管理臨打團",
      "my": "我的活動",
      "member": "成員清單"
    },
    "errors": {
      "thisRegistrationApiProvideTemporarilyCannotRegistration": "此活動的報名清單未由 API 提供，暫時無法管理報名者。"
    },
    "feedback": {
      "updateSuccess": "更新成功",
      "registrationStatusAlreadyUpdate": "報名狀態已更新。"
    },
    "paymentStatus": {
      "pending": "待付款",
      "done": "已付款",
      "failed": "付款失敗"
    }
  },
  "orderPage": {
    "accessibility": {
      "registrationInfo": "團體報名資訊",
      "viewPickupDetails": "查看{value0}臨打團詳細資訊"
    },
    "headings": {
      "registration": "團體報名 ·",
      "peoplePeople": "人（含本人）",
      "booking": "歷史預約",
      "confirmCancelBooking": "確認取消預約？"
    },
    "messages": {
      "memberData": "成員資料",
      "number": "第",
      "placesSeparator": "位 ·",
      "people": "本人",
      "memberName": "團員 {value0}",
      "genderGender": "性別：{gender}",
      "level": "程度：",
      "itemsOrderNotYetProvideMemberData": "這筆訂單尚未提供成員資料。",
      "remaining": "其餘",
      "memberDataNotYetProvide": "位成員資料尚未提供。",
      "orderData": "取得訂單資料中...",
      "currentNoneBooking": "目前沒有歷史預約",
      "currentNoneInProgressOrUpcomingStartBooking": "目前沒有進行中或即將開始的預約",
      "pickupGroup": "臨打團",
      "title": "場地預約",
      "peopleRegistration": "個人報名",
      "upcomingStartHour": "即將開始 · 24 小時內",
      "date": "日期：",
      "time": "時間：",
      "location": "地點：",
      "unspecified": "未指定",
      "clickViewPickupGroupDetailsInfo": "點擊查看臨打團詳細資訊 →",
      "googleMaps": "Google Maps 導航",
      "yourCancel": "你確定要取消「",
      "itemsBooking": "」這筆預約嗎？",
      "groupRegistrationCount": "團體報名 · {value0} 人"
    },
    "actions": {
      "pickupGroup": "臨打團",
      "title": "場地預約",
      "cancelBooking": "取消預約",
      "notNow": "先不要",
      "confirmCancel": "確認取消"
    },
    "errors": {
      "infoTemporarilyCannotPleaseLaterReload": "活動資訊暫時無法取得，請稍後重新載入。",
      "distanceStartHourAlreadyCannotCancelRegistration": "距離活動開始不到 24 小時，已無法取消報名。",
      "startHourCannotCancelRegistration": "活動開始前 24 小時內將無法取消報名。",
      "cancelApplyFailed": "取消申請失敗：",
      "loadOrdersFailed": "取得{type}訂單失敗：{message}"
    },
    "orderTypes": {
      "pickup": "臨打團",
      "booking": "場地"
    }
  },
  "payPage": {
    "actions": {
      "backBooking": "返回預約頁",
      "retryBooking": "重試剩餘預約",
      "submitPeriod": "送出{period}",
      "submitBooking": "送出預約",
      "backToEditBooking": "返回修改預約"
    },
    "errors": {
      "alreadySingleBookingSubmitPleaseFirstBooking": "已有部分單次預約送出，請先完成剩餘預約。",
      "orderDataCompletePleaseBackSelectVenue": "訂單資料不完整，請返回重新選擇場地與時段。",
      "orderAmountCannotConfirmPleaseBackSelect": "訂單金額無法確認，請返回重新選擇。",
      "followingDateAndBookingItemsBookingCreate": "以下日期與既有預約衝突，整筆長期預約未建立。請返回調整日期、場面或時段。",
      "timeSlotAndBookingItemsBookingCreatePlease": "所選長期時段與既有預約衝突，整筆長期預約未建立。請返回調整後再試。",
      "partialSubmission": "已有 {value0} 筆預約成功送出，其餘尚未完成。{value1} 再次送出時會略過已成功的項目。",
      "outsideOpeningHours": "「{value0}・{value1}」{value2} 不在可預約時間內（營業時間 {value3}–{value4}）。請返回重新選擇。",
      "venueUnavailable": "無法確認「{value0}」的場地資料，請稍後再試。",
      "bookingTooEarly": "需提前 7 天預約，最早可選 {value0}。請返回重新選擇日期。"
    },
    "feedback": {
      "bookingAlreadySubmit": "長期預約已送出",
      "bookingSubmitted": "預約已送出",
      "bookingCountSubmitted": "已送出 {value0} 筆預約，請耐心等候審核，並依場地方通知於現場付款。",
      "seriesSubmitted": "已送出 {value0} 個月的固定時段預約，請等候審核並依場地方通知於現場付款。"
    },
    "messages": {
      "timeSlotVenueBookingTimePleaseBackSelect": "所選時段不在場地可預約時間內，請返回重新選擇。",
      "pleaseConfirmFollowingOrderInfo": "請確認以下訂單資訊",
      "hour": "小時",
      "bookingMethodAndRentalTerm": "預約方式與租期",
      "dateDaysTimeMonthsMonth": "自 {date} 起，每{days} {time}，連續 {months} 個月。",
      "andEvery": "、每",
      "itemsBookingVenueAndTimeSlotDateItems": "每筆長期預約固定同一面場地與同一時段；如有任一日期衝突，整筆都不會建立。",
      "timeSlotAmount": "所選時段參考金額",
      "amount": "現場應付金額",
      "confirm": "待確認",
      "submitCreateRentalTermBookingWaitingReviewThis": "送出後會一次建立整段租期的預約並等待審核，此頁不會線上扣款。上方僅為本次所選時段的參考金額，長期租期的實際總額請依場地方通知於現場支付。",
      "submitCreateBookingWaitingReviewThisPlease": "送出後會建立預約並等待審核，此頁不會線上扣款。請依場地方通知，在現場支付上方金額。",
      "alreadySuccessSubmit": "已成功送出",
      "itemsBooking": "筆預約。"
    },
    "headings": {
      "confirmBooking": "確認預約",
      "booking": "預約項目（",
      "items": "筆）",
      "paymentMethodPayment": "付款方式：現場付款"
    },
    "bookingSeries": {
      "messages": {
        "pleaseSelectValidRentalTerm": "請選擇有效的租期。",
        "quarterRentalHalfYearRentalAndYearVenuePleaseBack": "季租、半年租及年租只能選同一面場地，請返回調整選取項目。",
        "itemsBookingTimeSlotPleaseBackSelection": "同一筆長期預約須使用固定時段，請返回調整選取項目。",
        "bookingDatePleaseBackSelect": "預約日期格式不正確，請返回重新選擇。",
        "bookingDateAndTimeSlotPleaseBackSelect": "長期預約的起始日期與時段須在未來，請返回重新選擇。"
      },
      "errors": {
        "pleaseFirstSelectVenueAndTimeSlot": "請先選擇場地與時段。",
        "timeSlotValidPleaseBackSelect": "長期租用時段必須是有效的 30 分鐘間隔，請返回重新選擇。"
      }
    },
    "rental": {
      "single": {
        "label": "單次預約",
        "duration": "只預約上方時段"
      },
      "quarter": {
        "label": "季租",
        "duration": "3 個月"
      },
      "half": {
        "label": "半年租",
        "duration": "6 個月"
      },
      "year": {
        "label": "整年租",
        "duration": "12 個月"
      }
    }
  },
  "internalVenuePage": {
    "selection": {
      "messages": {
        "loadBookedTimeSlot": "載入已預約時段中...",
        "selectedVenueCourt": "場地：{value0} / 第 {value1} 面",
        "selectedTimeRange": "你已選擇：{value0} - {value1}"
      },
      "errors": {
        "bookedTimeSlotFailed": "取得已預約時段失敗："
      }
    },
    "map": {
      "messages": {
        "booking": "上次預約",
        "currentLocation": "正在取得目前位置..."
      },
      "tooltips": {
        "viewLocation": "查看位置",
        "confirmSelect": "確認選擇"
      },
      "actions": {
        "alreadySelect": "已選擇",
        "confirmVenue": "確認場地"
      },
      "errors": {
        "googleMapsScriptLoadFailedPleaseConsole": "Google Maps script 載入失敗（請看 Console / Network）"
      }
    },
    "picker": {
      "messages": {
        "venueNotFoundPrefix": "找不到「",
        "venueData": "」的場地資料"
      }
    },
    "messages": {
      "loadVenueData": "載入場地資料中...",
      "bookingDate": "預約日期 :"
    },
    "resourceTypes": {
      "all": "全部",
      "court": "球場",
      "classroom": "教室",
      "studyRoom": "自習室",
      "lawn": "大草地"
    }
  },
  "internalBookingPage": {
    "images": {
      "venue": "場地圖片"
    },
    "messages": {
      "yourTennisBasketballBadminton": "跟你們介紹一下這個網球場，這裡是拿來打籃球的，\n                            不是打羽球的",
      "peopleCount": "容納人數",
      "people": "20人",
      "location": "位置",
      "t4": "T4教學大樓旁",
      "venueStatus": "場地狀態",
      "open": "開放",
      "venue": "禁止在場地內飲食，只允許飲用水",
      "pleaseVenuePeople": "請保持場地清潔，離開時帶走所有個人物品和垃圾",
      "bookingPlease": "預約後請準時到場，遲到超過15分鐘視為棄權",
      "dayOrVenueVenueClose": "雨天或場地維修時，場地可能會臨時關閉",
      "basketballX2": "籃球架 x2",
      "spectatorSeats": "觀眾席",
      "lockerRoom": "更衣室",
      "showerRoom": "淋浴間",
      "noneFacilities": "無障礙設施",
      "selectDateAndTimeBooking": "選擇日期與時間進行預約"
    },
    "actions": {
      "venueInfo": "場地資訊",
      "items": "使用規則",
      "facilities": "設施",
      "full": "已滿",
      "confirmThisTimeSlot": "確認此時段"
    },
    "headings": {
      "venueTimeSlotAmount": "場地時段金額總覽"
    },
    "labels": {
      "time": "時間"
    }
  },
  "internalOrderPage": {
    "errors": {
      "pleaseSelectPdf": "請選擇 PDF 檔案",
      "orderDataFailed": "取得訂單資料失敗：",
      "pdfFailed": "匯入 PDF 失敗:",
      "cancelApplyFailed": "取消申請失敗："
    },
    "messages": {
      "orderData": "取得訂單資料中...",
      "bookingTime": "預約時間：",
      "yourCancel": "你確定要取消「",
      "itemsBooking": "」這筆預約嗎？"
    },
    "actions": {
      "pdf": "上傳計畫書(.pdf)",
      "cancelBooking": "取消預約",
      "notNow": "先不要",
      "confirmCancel": "確認取消"
    },
    "headings": {
      "confirmCancelBooking": "確認取消預約？"
    },
    "status": {
      "pending": "待審核",
      "confirmed": "已確認",
      "cancelled": "已取消",
      "cancelRequested": "取消申請中"
    }
  },
  "internalPayPage": {
    "actions": {
      "backBooking": "返回預約頁"
    },
    "errors": {
      "resourceIdPleaseRetrySelectVenueCourt": "找不到 resource_id（請重新選擇場地/球場後再試一次）",
      "timeSlotCannotPleaseBackBooking": "時段格式無法解析（請返回修改預約）"
    },
    "feedback": {
      "orderAlreadySubmitPleaseReview": "訂單已送出！請耐心等候審核。"
    },
    "headings": {
      "dataFill": "資料填寫"
    },
    "labels": {
      "time": "租借時間",
      "rentalReason": "租借事由",
      "rentalNeeds": "租借需求",
      "peopleCount": "活動人數",
      "people": "負責人（領隊）",
      "applyPeoplePhone": "申請人（含電話）",
      "apply": "申請單位",
      "bankCode": "銀行代碼",
      "cardNumber": "信用卡號",
      "securityCode": "安全碼",
      "expiration": "期限"
    },
    "placeholders": {
      "pleaseEnter": "請輸入事由",
      "enterNeeds": "請輸入需求",
      "pleaseEnterPeopleCount": "請輸入人數",
      "enterName": "請輸入名字",
      "pleaseEnterAndPhone": "請輸入名字與電話",
      "pleaseEnterName": "請輸入單位名稱",
      "enterCode": "請輸入代碼"
    },
    "messages": {
      "rentalGuidelines": "借用須知",
      "applyVenuePleaseVenueApplyVenueApply": "申請借用場地時，請依本校運動場地管理辦法提出申請；場地借用申請表須先經總務所、管理單位審章同意，並請檢附參加人員名單及活動企劃。",
      "applyAndVenuePleaseOrValid": "申請借用及使用場地時，請出示教職員工證或學生證（有效學籍之學生證）。",
      "cancelNotificationApplyPeopleOr": "如有特殊原因需取消使用時，本室有權利隨時通知申請人停止或改期借用，不得異議。",
      "andContentOrVenueUser": "使用與登記內容不符或有違本校運動場地管理辦法時，體育室得立即禁止使用者行為。",
      "venueChargeOr": "未經體育室核准，不得於借用場地進行商業(收費)教學或訓練之行為。",
      "and": "體育館暨游泳池嚴禁抽煙與進食，違者隨時停止其使用權利。",
      "please": "請注意維護場內各種設備，倘有毀損情事，應負賠償責任。",
      "venue": "借用場地時，除應維持清潔外，活動後負責將垃圾帶離現場。",
      "timeApply": "校內單位借用，如在歸還時間內，未按時恢復原狀，停止日後借用之權利申請不得異議。",
      "sportsClassesTakePriority": "體育課程教學優先，不得以任何理由要求讓場。",
      "orPausedVenue": "基於活動安全之考量，借用者如改用瓦斯或明火烹煮，將暫停借用場地，並不得要求賠償。",
      "venueApplyPleaseDateDayDayPlease": "場地借用申請時，校內請於使用日期10-14天前；校外借用30-45天前。(但經簽請本校核准之活動或競賽不在此限。)",
      "timeSingleDay": "校內借用使用時間：單次借用以三天(含六、日)。",
      "user": "借用單位應自行負責使用者之活動安全，並符合主管機關安全法規。"
    }
  },
  "lineDemoPage": {
    "messages": {
      "line": "LINE 體驗者",
      "lineOrCreateAccount": "開發展示模式 · 不會連接 LINE 或建立真實帳號",
      "lineRegisterData": "按下方按鈕，模擬完成 LINE 授權後補填註冊資料。",
      "lineAlreadyFillDataRegister": "模擬 LINE 授權已完成，填寫必要資料即可預覽註冊結果。",
      "and": "僅限英文字母與數字。",
      "optional": "（選填）",
      "welcomePrefix": "歡迎，",
      "thisCreateOrAccountLoginYourPickup": "正式串接後，此步會由後端建立或查找帳號、簽發系統登入憑證，並帶你進入臨打頁。",
      "existingDemoAccount": "此分頁已有展示帳號「{value0}」，可以體驗再次登入。"
    },
    "headings": {
      "lineLoginRegister": "LINE 登入／註冊體驗",
      "accountSettings": "完成帳號設定",
      "register": "註冊流程展示完成",
      "login": "登入流程展示完成"
    },
    "actions": {
      "lineLogin": "模擬 LINE 登入",
      "lineStartRegister": "模擬 LINE 授權，開始註冊",
      "register": "重新體驗首次註冊",
      "completeDemoRegistration": "完成展示註冊",
      "tryLineLoginAgain": "再次體驗 LINE 登入",
      "backLogin": "返回登入頁"
    },
    "labels": {
      "displayName": "顯示名稱",
      "username": "使用者名稱",
      "birthDate": "出生日期",
      "email": "電子信箱"
    }
  },
  "lineLoginPage": {
    "messages": {
      "reactAppLiffIdSettings": "缺少 REACT_APP_LIFF_ID 設定",
      "line": "正在透過 LINE 驗證身分…",
      "openLineLogin": "開啟 LINE 登入"
    },
    "errors": {
      "cancelledLineLoginPleaseRetry": "已取消 LINE 登入，請重新嘗試。",
      "lineLoginFailed": "LINE 登入失敗",
      "lineFailed": "LINE 授權驗證失敗。",
      "lineLoginNotYetSettings": "LINE 登入尚未在伺服器設定完成。",
      "currentCannotLineLoginPleaseLater": "目前無法使用 LINE 登入，請稍後再試。"
    },
    "headings": {
      "pleaseLineLogin": "請在外部瀏覽器完成 LINE 登入",
      "lineLoginFailed": "LINE 登入失敗"
    },
    "actions": {
      "backToLogin": "回到登入"
    }
  }
};
