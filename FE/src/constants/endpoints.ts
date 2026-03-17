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
    GET_ALL: '/users',
    GET_BY_ID: (id: string) => `/users/${id}`,
    UPDATE: (id: string) => `/users/${id}`,
    DELETE: (id: string) => `/users/${id}`,
  },
  TOUR: {
    GET_ALL: '/tours',
    CREATE: '/tours',
    GET_NEARBY: (lat: number, lng: number, radius: number) => 
      `/tours/nearby?lat=${lat}&lng=${lng}&radius=${radius}`,
  },
  LOCATION: {
    GET_ALL: '/locations',
  },
  BOOKING: {
    CREATE: '/bookings',
    MY_BOOKINGS: '/bookings/my-bookings',
    GUIDE_BOOKINGS: '/bookings/guide-bookings',
    UPDATE_STATUS: (id: string) => `/bookings/${id}/status`,
  },
  TOUR_REQUEST: {
    CREATE: '/tour-requests',
    GET_ALL: '/tour-requests',
    GET_NEARBY: (lat: number, lng: number, radius: number) => 
      `/tour-requests/nearby?lat=${lat}&lng=${lng}&radius=${radius}`,
    ACCEPT: (id: string) => `/tour-requests/${id}/accept`,
  }
};
