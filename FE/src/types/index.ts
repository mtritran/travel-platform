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
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  active: boolean;
  createdAt: string;
}
