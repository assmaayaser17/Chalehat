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

export interface ForgotPasswordRequest {
  phoneNumber: string;
}

export interface ResetPasswordRequest {
  phoneNumber: string;
  code: string;
  newPassword: string;
  confirmNewPassword: string;
}

/** Requires a logged-in user's access token — see `authFetch`. */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
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

// ---------- Season: /api/Season ----------

/** A shared, global time period (e.g. "School holidays") — independent of any chalet. */
export interface Season {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  priority: number;
}

export interface CreateSeasonRequest {
  name: string;
  startDate: string;
  endDate: string;
  priority: number;
}

// ---------- Chalet Seasonal Prices: /api/chalet/{id}/seasonal-prices ----------

/** A season linked to one specific chalet with the price that applies during it. */
export interface ChaletSeasonalPrice {
  id: number;
  seasonId: number;
  price: number;
}

export interface LinkChaletSeasonalPriceRequest {
  seasonId: number;
  price: number;
}

// ---------- Chalet Weekday Prices: /api/chalet/{id}/weekday-prices ----------

/**
 * A price for specific days of the week, independent of any season.
 * `days` uses .NET's `DayOfWeek` numbering (Sunday = 0 ... Saturday = 6),
 * matching the "days": [4, 5] (Thu/Fri) example in the API docs.
 * No GET or DELETE is documented for this resource yet.
 */
export interface CreateChaletWeekdayPriceRequest {
  days: number[];
  price: number;
  priority: number;
}

// ---------- Booking: /api/Booking ----------

/**
 * One calendar day within a booking request. The API's `period` field is
 * undocumented — every day is sent here as `3`, the same "combine everything"
 * value the app's other bitmask fields use for "all/full" (mirrors
 * `BOOKING_TYPE_FLAGS`'s pattern). Confirm the real meaning with the backend
 * before this is treated as final; see `buildBookingDays` in `lib/utils.ts`.
 */
export interface BookingDayInput {
  date: string;
  period: number;
}

export interface PreviewBookingRequest {
  chaletId: number;
  bookingType: number;
  childrenCount: number;
  notes: string;
  days: BookingDayInput[];
}

export type CreateBookingRequest = PreviewBookingRequest;

/** Response shape is undocumented — read defensively, see `previewBooking`. */
export interface BookingPreview {
  totalPrice?: number;
  [key: string]: unknown;
}

/** Response shape is undocumented — every field beyond `id`/`status` is read defensively. */
export interface Booking {
  id: number;
  chaletId: number;
  chaletName?: string;
  userId?: string;
  customerName?: string;
  bookingType?: number | string;
  status: string;
  childrenCount?: number;
  notes?: string;
  totalPrice?: number;
  createdAt?: string;
  days?: { date: string; period: number }[];
}

export interface ApproveBookingRequest {
  refundWindowHours: number;
}

export interface RejectBookingRequest {
  reason: string;
}

// ---------- Generic API envelope ----------

export interface ApiErrorBody {
  message?: string;
  error?: string | { message?: string };
  errors?: Record<string, string[]>;
  title?: string;
}
