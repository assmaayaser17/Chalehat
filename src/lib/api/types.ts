/**
 * Types mirroring the Chalehat .NET backend (see `chalehat.postman_collection.json`).
 * The backend only documents request bodies — response shapes below are the
 * standard/expected .NET Web API shape and are read defensively throughout
 * the app (optional chaining, safe fallbacks) so a small mismatch never
 * crashes a Server Component.
 */

// ---------- Roles ----------

/** Every role that has appeared in a JWT issued by the API. */
export type UserRole = "SuperAdmin" | "SystemAdmin" | "ChaletAdmin" | "Customer";

export const ROLE_LABELS_AR: Record<UserRole, string> = {
  SuperAdmin: "Super Admin",
  SystemAdmin: "System Admin",
  ChaletAdmin: "Chalet Admin",
  Customer: "Customer",
};

/** Roles allowed to reach the /dashboard/staff (Admin) section. */
export const STAFF_MANAGEMENT_ROLES: UserRole[] = ["SuperAdmin", "SystemAdmin"];

/** Roles allowed into /dashboard at all — Customer has no dashboard area. */
export const DASHBOARD_ROLES: UserRole[] = ["SuperAdmin", "SystemAdmin", "ChaletAdmin"];

// ---------- Auth: /api/Auth ----------

export interface RegisterRequest {
  fullName: string;
  userName: string;
  phoneNumber: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginRequest {
  Identifier: string;
  password: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface RevokeRequest {
  refreshToken: string;
}

/** Decoded shape of the JWT access token's claims. */
export interface AccessTokenClaims {
  nameidentifier: string;
  name: string;
  full_name: string;
  emailaddress: string;
  role: UserRole;
  exp: number;
  iss?: string;
  aud?: string;
}

/** Response returned by /Auth/login (and /Auth/refresh). */
export interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  [key: string]: unknown;
}

/** Session persisted in the httpOnly cookie after a successful login. */
export interface Session {
  accessToken: string;
  refreshToken: string;
  userId: string;
  userName: string;
  fullName: string;
  email: string;
  role: UserRole;
}

// ---------- Admin: /api/Admin ----------

export interface CreateStaffRequest {
  fullName: string;
  userName: string;
  Email: string;
  password: string;
  role: Extract<UserRole, "SystemAdmin" | "ChaletAdmin">;
}

export interface ApiUser {
  id: string;
  fullName: string;
  userName: string;
  email: string;
  phoneNumber?: string;
  role: UserRole;
  createdAt?: string;
}

// ---------- Chalet: /api/Chalet ----------

/** Bitmask of accepted booking types — kept as a number to match the API's `allowedBookingTypes`. */
export const BOOKING_TYPE_FLAGS = {
  Daily: 1,
  Weekend: 2,
  Weekly: 4,
} as const;

export interface CreateChaletRequest {
  name: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  basePrice: number;
  showPrice: boolean;
  maxGuests: number;
  bedroomsCount: number;
  bathroomsCount: number;
  minNights: number;
  maxNights: number;
  checkInTime: string;
  checkOutTime: string;
  cancellationPolicy: string;
  whatsAppNumber: string;
  allowedBookingTypes: number;
  ownerAdminId: string;
}

export interface Chalet extends Omit<CreateChaletRequest, "allowedBookingTypes"> {
  id: number;
  /** The API sends this as a bitmask number on create but as a label string (e.g. "All") on read. */
  allowedBookingTypes: number | string;
  status?: string;
  ownerAdminName?: string;
  createdAt?: string;
  /** Relative path (e.g. "/uploads/chalets/2/x.jpg") — resolve with `resolveMediaUrl` before rendering. */
  coverImageUrl?: string | null;
  images?: ChaletImage[];
  amenities?: Amenity[];
}

// ---------- Chalet Images: /api/chalet/{id}/images ----------

export interface ChaletImage {
  id: number;
  chaletId: number;
  /** Relative path — resolve with `resolveMediaUrl` before rendering. */
  url: string;
  displayOrder: number;
  isApproved: boolean;
  isCoverImage: boolean;
}

// ---------- Amenity: /api/Amenity ----------

export interface Amenity {
  id: number;
  name: string;
  iconUrl: string | null;
}

export interface CreateAmenityRequest {
  name: string;
  iconUrl: string | null;
}

// ---------- Generic API envelope ----------

export interface ApiErrorBody {
  message?: string;
  error?: string | { message?: string };
  errors?: Record<string, string[]>;
  title?: string;
}
