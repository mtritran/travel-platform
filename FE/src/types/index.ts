export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  roles: Role[];
  hasPaymentPin: boolean;
  balance: number;
  biography?: string;
  languages?: string;
  yearsOfExperience?: number;
  specialties?: string;
  avatarUrl?: string;
  currentLat?: number;
  currentLong?: number;
  currentAddress?: string;
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

export type TourStatus = 'PENDING_APPROVAL' | 'ACTIVE' | 'REJECTED' | 'INACTIVE';

export interface Tour {
  id: string;
  guideId: string;
  guideName: string;
  guideAvatarUrl?: string;
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
  status: TourStatus;
  active?: boolean;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  maxGuests?: number;
  depositPercentage?: number;
  rating: number;
  reviewCount: number;
  occupiedGuests?: number;
  bookingCutoffMinutes?: number;
  hiddenReason?: string;
  distance?: number;
  createdAt: string;
}

export type BookingStatus = 'PENDING' | 'AWAITING_DEPOSIT' | 'CONFIRMED' | 'PAID_FULL' | 'CANCELLED' | 'COMPLETED';

export interface Booking {
  id: string;
  bookingCode: string;
  userName: string;
  userAvatarUrl?: string;
  tourTitle: string;
  guideName: string;
  guideId: string;
  guideAvatarUrl?: string;
  guidePhone?: string;
  userPhone?: string;
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
  isDisputed: boolean;
  disputeReason?: string;
  disputeEvidenceUrl?: string;
  disputedAt?: string;
  payoutAt: string;
  createdAt: string;
}

export interface DisputeRequest {
  reason: string;
  evidenceUrl?: string;
}

export interface Review {
  id: string;
  userName: string;
  userAvatarUrl: string;
  userPhone: string;
  tourTitle: string;
  tourId?: string;
  rating: number;
  comment: string;
  imagesUrl?: string;
  tourRequestId?: string;
  createdAt: string;
}

export interface ReviewRequest {
  bookingId: string;
  rating: number;
  comment: string;
}

export type TourRequestStatus = 'OPEN' | 'PENDING_CONFIRMATION' | 'WAITING_PAYMENT' | 'CONFIRMED' | 'COMPLETED' | 'MATCHED' | 'EXPIRED' | 'CANCELLED';

export interface TourRequestInterest {
  id: string;
  guideId: string;
  guideName: string;
  guideAvatarUrl?: string;
  guideEmail: string;
  guidePhone: string;
  message: string;
  createdAt: string;
}

export interface TourRequest {
  id: string;
  userName: string;
  customerAvatarUrl?: string;
  locationName?: string;
  customLocationName?: string;
  latitude?: number;
  longitude?: number;
  meetingLatitude?: number;
  meetingLongitude?: number;
  meetingLocationName?: string;
  plannedDate: string;
  budget: number;
  numberOfGuests: number;
  title: string;
  description: string;
  status: TourRequestStatus;
  guideName?: string;
  guideAvatarUrl?: string;
  guideEmail?: string;
  guidePhone?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  createdAt: string;
  expiresAt: string;
  
  meetingLocationName?: string;
  meetingLatitude?: number;
  meetingLongitude?: number;
  startTime?: string;
  endTime?: string;
  depositPercentage?: number;
  depositAmount?: number;
  paidAmount?: number;
  paymentStatus?: string;
  
  requestCode: string;
  isDisputed: boolean;
  disputeReason?: string;
  disputeEvidenceUrl?: string;
  disputedAt?: string;
  payoutAt: string;
  
  interestedGuides: TourRequestInterest[];
}

export type TransactionType = 'REVENUE' | 'COMMISSION' | 'INCOME' | 'WITHDRAW' | 'REFUND';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  note: string;
  createdAt: string;
  bookingId?: string;
}

export interface TourChatResponse {
  answer: string;
  recommendedTours: Tour[];
}
