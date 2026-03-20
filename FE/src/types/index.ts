export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  roles: Role[];
}

export interface Role {
  name: string;
}

export interface Page<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  size: number;
  number: number;
  empty: boolean;
}

export interface ApiResponse<T> {
  code: number;
  message?: string;
  result: T;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  authenticated: boolean;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  imageUrl: string;
}

export interface Tour {
  id: string;
  guideName: string;
  locationName: string;
  locationAddress?: string;
  latitude?: number;
  longitude?: number;
  meetingLocationName?: string;
  meetingLocationAddress?: string;
  meetingLatitude?: number;
  meetingLongitude?: number;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  active: boolean;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  maxGuests?: number;
  depositPercentage?: number;
  rating: number;
  reviewCount: number;
  createdAt: string;
}

export type BookingStatus = 'PENDING' | 'AWAITING_DEPOSIT' | 'CONFIRMED' | 'PAID_FULL' | 'CANCELLED' | 'COMPLETED';

export interface Booking {
  id: string;
  userName: string;
  tourTitle: string;
  guideName: string;
  bookingDate: string;
  numberOfGuests: number;
  totalPrice: number;
  status: BookingStatus;
  depositAmount: number;
  paidAmount: number;
  refundAmount: number;
  depositPercentage: number;
  tourStartDate: string;
  tourStartTime: string;
  pickupLocationName?: string;
  pickupLocationAddress?: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  reviewed: boolean;
  createdAt: string;
}

export interface Review {
  id: string;
  userName: string;
  tourTitle: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ReviewRequest {
  bookingId: string;
  rating: number;
  comment: string;
}
