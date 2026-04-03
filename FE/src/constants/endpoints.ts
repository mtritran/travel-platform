export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    TOKEN: '/auth/token', // Keeping it for compatibility if needed, but login is correct
    INTROSPECT: '/auth/introspect',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
  },
  USER: {
    REGISTER: '/users/register',
    GET_MY_INFO: '/users/my-info',
    MY_INFO: '/users/my-info',
    GET_ALL: '/users',
    GET_BY_ID: (id: string) => `/users/${id}`,
    UPDATE: (id: string) => `/users/${id}`,
    DELETE: (id: string) => `/users/${id}`,
  },
  TOUR: {
    BASE: '/tours',
    GET_ALL: '/tours',
    GET_ALL_ADMIN: '/tours/admin',
    CREATE: '/tours',
    GET_MY_TOURS: '/tours/my-tours',
    GET_BY_ID: (id: string) => `/tours/${id}`,
    TOGGLE_STATUS: (id: string) => `/tours/${id}/toggle-status`,
    UPDATE: (id: string) => `/tours/${id}`,
    DELETE: (id: string) => `/tours/${id}`,
    GET_NEARBY: (lat: number, lng: number, radius: number) =>
      `/tours/nearby?lat=${lat}&lng=${lng}&radius=${radius}`,
    CHAT: '/tours/chat',
  },
  LOCATION: {
    GET_ALL: '/locations',
    CREATE: '/locations',
    UPDATE: (id: string) => `/locations/${id}`,
    DELETE: (id: string) => `/locations/${id}`,
  },
  BOOKING: {
    CREATE: '/bookings',
    MY_BOOKINGS: '/bookings/my-bookings',
    GET_GUIDE_BOOKINGS: '/bookings/guide-bookings',
    UPDATE_STATUS: (id: string, status: string) => `/bookings/${id}/status?status=${status}`,
    CANCEL: (id: string) => `/bookings/${id}/cancel`,
    PAY_DEPOSIT: (id: string) => `/bookings/${id}/pay`,
    PAY_REMAINING: (id: string) => `/bookings/${id}/pay-remaining`,
    COMPLETE: (id: string) => `/bookings/${id}/complete`,
  },
  TOUR_REQUEST: {
    CREATE: '/tour-requests',
    GET_ALL: '/tour-requests',
    GET_MY: '/tour-requests/me',
    GET_ACCEPTED: '/tour-requests/accepted',
    GET_NEARBY: (lat: number, lng: number, radius: number) =>
      `/tour-requests/nearby?lat=${lat}&lng=${lng}&radius=${radius}`,
    INTEREST: (id: string) => `/tour-requests/${id}/interest`,
    SELECT_GUIDE: (id: string, guideId: string) => `/tour-requests/${id}/select-guide?guideId=${guideId}`,
    CONFIRM_MATCH: (id: string) => `/tour-requests/${id}/confirm-match`,
    DECLINE_MATCH: (id: string) => `/tour-requests/${id}/decline-match`,
    CANCEL_MATCH: (id: string) => `/tour-requests/${id}/cancel-match`,
    UPDATE: (id: string) => `/tour-requests/${id}`,
    DELETE: (id: string) => `/tour-requests/${id}`,
    BASE: '/tour-requests',
    PAY_DEPOSIT: (id: string) => `/tour-requests/${id}/pay-deposit`,
    PAY_REMAINING: (id: string) => `/tour-requests/${id}/pay-remaining`,
    COMPLETE: (id: string) => `/tour-requests/${id}/complete-tour`,
    AI_RECOMMENDATIONS: (id: string) => `/tour-requests/${id}/ai-recommendations`,
    AI_INDEX_GUIDES: '/tour-requests/ai-index-guides',
  },
  PAYOUT: {
    CREATE: '/payouts',
    GET_MY: '/payouts/me',
    GET_PENDING: '/payouts/pending',
    PROCESS: (id: string) => `/payouts/${id}/process`,
  },
  REPORT: {
    FINANCIAL: '/admin/reports/financial',
  },
  GUIDE_APPLICATION: {
    APPLY: '/guide-applications',
    MY_APPLICATION: '/guide-applications/my-application',
    GET_ALL: '/guide-applications',
    PROCESS: (id: string) => `/guide-applications/${id}/process`,
    GET_DOCUMENT: (path: string) => `/guide-applications/documents?path=${path}`,
  },
  REVIEW: {
    CREATE: '/reviews',
    GET_BY_TOUR: (tourId: string) => `/reviews/tour/${tourId}`,
    GET_BY_GUIDE: (guideId: string) => `/reviews/guide/${guideId}`,
  },
  TRANSACTION: {
    GET_MY: '/transactions/my',
  },
  PAYMENT: {
    /** @param bankCode gợi ý: để trống | VNPAYQR | QR | VNBANK | INTCARD | NCB (sandbox) */
    CREATE_VNPAY: (bookingId: string, type: string, bankCode?: string) => {
      let q = `/payment/create-vnpay-payment?bookingId=${encodeURIComponent(bookingId)}&type=${encodeURIComponent(type)}`;
      if (bankCode) q += `&bankCode=${encodeURIComponent(bankCode)}`;
      return q;
    },
    VNPAY_CALLBACK: '/payment/vnpay-callback',
    CREATE_VNPAY_REQUEST: (requestId: string, type: string, bankCode?: string) => {
      let q = `/payment/create-tour-request-vnpay?requestId=${encodeURIComponent(requestId)}&type=${encodeURIComponent(type)}`;
      if (bankCode) q += `&bankCode=${encodeURIComponent(bankCode)}`;
      return q;
    },
  }
};
