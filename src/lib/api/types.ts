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
  /** From the login form's "Remember me" — carried through every refresh so the middleware knows whether to keep issuing a long-lived cookie or a plain session cookie. */
  rememberMe?: boolean;
}

// ---------- Admin: /api/Admin ----------

export interface CreateStaffRequest {
  fullName: string;
  userName: string;
  Email: string;
  password: string;
  role: Extract<UserRole, "SystemAdmin" | "ChaletAdmin">;
  phoneNumber: string;
}

export interface ApiUser {
  id: string;
  fullName: string;
  userName: string;
  email: string;
  phoneNumber?: string;
  role: UserRole;
  createdAt?: string;
  isBlocked?: boolean;
  blockReason?: string | null;
  /** Only ever populated for a Customer, and only if the backend actually includes it on this list response — see `normalizeApiUser` in lib/api/admin.ts. */
  customerCategories?: CustomerCategory[];
}

/** GET /api/admin/users?role&isBlocked&search&customerCategoryId — SuperAdmin/SystemAdmin only. All filters optional. */
export interface GetAllUsersFilters {
  role?: UserRole;
  isBlocked?: boolean;
  search?: string;
  customerCategoryId?: number;
}

// ---------- Customer Category: /api/customer-categories ----------

/**
 * No role restriction is documented for this feature (no `description` field
 * on any of its Postman requests, unlike every other admin endpoint) — every
 * example request nonetheless uses a SuperAdmin token, so treated as
 * SuperAdmin-only here. Re-check with the backend if a SystemAdmin needs it.
 */
export interface CustomerCategory {
  id: number;
  name: string;
}

export interface CreateCustomerCategoryRequest {
  name: string;
}

/**
 * PUT /api/customer-categories/customer/{customerId} body. Assumed to
 * *replace* the customer's full set of category links (PUT semantics) rather
 * than add to it — unlike `POST /api/Chalet/{id}/amenities`, which only
 * adds. Not confirmed live; the Postman collection has no response example.
 */
export interface AssignCustomerCategoriesRequest {
  categoryIds: number[];
}

/** PATCH /api/admin/users/{id}/toggle-block — SuperAdmin/SystemAdmin only; a SystemAdmin may only block Customers, per the API docs. */
export interface ToggleUserBlockRequest {
  reason: string;
}

/** PATCH /api/admin/users/{id}/role — SuperAdmin only. */
export interface ChangeUserRoleRequest {
  newRole: UserRole;
}

// ---------- Chalet: /api/Chalet ----------

/**
 * The chalet booking-purpose enum, sent/received as an array of these string
 * names (e.g. `["Family", "Youth"]`) — NOT a numeric bitmask, despite the
 * backend's own C# enum being flag-shaped internally (Family=1/Youth=2/
 * Event=4). Confirmed from an actual accepted create-chalet payload.
 */
export const BOOKING_TYPES = ["Family", "Youth", "Event"] as const;
export type BookingType = (typeof BOOKING_TYPES)[number];

export interface CreateChaletRequest {
  name: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  basePrice: number;
  morningPrice: number;
  eveningPrice: number;
  showPrice: boolean;
  maxGuests: number;
  bedroomsCount: number;
  bathroomsCount: number;
  minNights: number;
  maxNights: number;
  /** Replaced the old single `checkInTime`/`checkOutTime` pair — confirmed by the backend dev directly, since neither the Postman collection nor Swagger had caught up to this change yet. */
  morningStartTime: string;
  morningEndTime: string;
  eveningStartTime: string;
  eveningEndTime: string;
  cancellationPolicy: string;
  whatsAppNumber: string;
  allowedBookingTypes: BookingType[];
  ownerAdminId: string;
}

export interface Chalet extends Omit<CreateChaletRequest, "allowedBookingTypes" | "whatsAppNumber"> {
  id: number;
  /** Read back as an array of names, a comma-separated string, or "All" — resolved via `getActiveBookingTypes`. */
  allowedBookingTypes: BookingType[] | string;
  /** Confirmed via a live call: null for some real chalets, despite being required on create. Never call `.replace()`/etc without a null check. */
  whatsAppNumber: string | null;
  status?: string;
  ownerAdminName?: string;
  createdAt?: string;
  /** Relative path (e.g. "/uploads/chalets/2/x.jpg") — resolve with `resolveMediaUrl` before rendering. */
  coverImageUrl?: string | null;
  images?: ChaletImage[];
  amenities?: Amenity[];
  /** Only approved reviews count toward these — confirmed via a live call. */
  averageRating?: number | null;
  reviewsCount?: number;
  reviews?: ChaletReview[];
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
  /** Set when a SuperAdmin/SystemAdmin rejects the photo instead of approving it — `isApproved` stays `false`, this is what distinguishes "rejected" from "still pending". Shown back to the chalet owner. */
  rejectionReason?: string | null;
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

// ---------- Advertisement Categories: /api/advertisement-categories ----------

/** A category ads are filed under (e.g. "Restaurants") — same shape as `Amenity`. */
export interface AdvertisementCategory {
  id: number;
  name: string;
  iconUrl: string | null;
}

export interface CreateAdvertisementCategoryRequest {
  name: string;
  iconUrl: string;
}

// ---------- Advertisements: /api/advertisements ----------

/**
 * Response shape is undocumented (no GET example in the API docs this was
 * built from) — read defensively. `images` is assumed to be either an array
 * of URL strings or of `{ url }` objects; `resolveAdvertisementImages` in
 * `lib/api/advertisements.ts` normalizes either shape. Verify against a live
 * call if ads render without photos.
 */
export interface Advertisement {
  id: number;
  name: string;
  description: string;
  /** No longer collected or shown anywhere in the UI (these ads don't have a meaningful single price) — kept only because the backend still returns/requires it, so edits round-trip whatever value is already there unseen. */
  price: number;
  categoryId: number;
  categoryName?: string;
  location: string;
  /** Only confirmed on create's form-data (alongside `location`) — the update example in the Postman collection doesn't show it, so its presence/casing on read isn't confirmed either. */
  address?: string;
  phoneNumber: string;
  images?: unknown;
  createdAt?: string;
}

/** One image on an advertisement, once `resolveAdvertisement` has normalized the raw (unconfirmed-shape) `images` field — its `id` is what `reorder`/`delete` take. */
export interface AdvertisementImage {
  id: number;
  url: string;
}

/**
 * PUT /api/advertisements/{id} — no `images` field; use the dedicated image
 * endpoints for those (add/delete/reorder). `address` isn't in the Postman
 * collection's update example, so it's sent optimistically — if the backend
 * ignores unrecognized JSON fields (typical for ASP.NET model binding),
 * that's harmless; re-check if edits stop persisting the address.
 */
export interface UpdateAdvertisementRequest {
  name: string;
  description: string;
  price: number;
  categoryId: number;
  location: string;
  address?: string;
  phoneNumber: string;
}

/** PUT /api/advertisements/{id}/images/reorder */
export interface ReorderAdvertisementImagesRequest {
  orderedImageIds: number[];
}

// ---------- Chalet Seasonal Prices: /api/chalet/{id}/seasonal-prices ----------

/**
 * A season linked to one specific chalet with the prices that apply during
 * it — confirmed empirically via GET: the response embeds the season's own
 * `seasonName`/`seasonStartDate`/`seasonEndDate` directly (no separate
 * `/api/Season` lookup needed to display it), and prices follow the same
 * morning/evening/full-day split as weekday prices, not a single `price`.
 */
export interface ChaletSeasonalPrice {
  id: number;
  chaletId?: number;
  seasonId: number;
  seasonName?: string;
  seasonStartDate?: string;
  seasonEndDate?: string;
  morningPrice: number;
  eveningPrice: number;
  fullDayPrice: number;
}

export interface LinkChaletSeasonalPriceRequest {
  seasonId: number;
  morningPrice: number;
  eveningPrice: number;
  fullDayPrice: number;
}

// ---------- Chalet Weekday Prices: /api/chalet/{id}/weekday-prices ----------

/**
 * A price for specific days of the week, independent of any season. `days`
 * uses .NET's `DayOfWeek` numbering (Sunday = 0 ... Saturday = 6) and fans
 * out into one row per day server-side — confirmed empirically: a create
 * request with `days: [0, 1]` produced two separate GET rows, one for
 * Sunday and one for Monday. Per-period prices mirror the chalet's own
 * morning/evening pricing model, plus a `fullDayPrice` flat rate.
 */
export interface CreateChaletWeekdayPriceRequest {
  days: number[];
  morningPrice: number;
  eveningPrice: number;
  fullDayPrice: number;
  priority: number;
}

/**
 * GET /api/chalet/{id}/weekday-prices — confirmed to exist despite not
 * being documented in the Postman collection. One row per day (not the
 * `days: number[]` array the create request fans out from) — `day` is the
 * weekday's full English name (e.g. "Sunday").
 */
export interface ChaletWeekdayPrice {
  id: number;
  chaletId?: number;
  day: string;
  morningPrice: number;
  eveningPrice: number;
  fullDayPrice: number;
  priority: number;
}

// ---------- Booking: /api/Booking ----------

/**
 * One calendar day within a booking request. The API's `period` field is
 * undocumented — every day is sent here as `3`, an assumed "full day" value.
 * Confirm the real meaning with the backend before this is treated as final;
 * see `buildBookingDays` in `lib/utils.ts`.
 */
export interface BookingDayInput {
  date: string;
  period: number;
}

/**
 * `bookingType` — inferred to be a `BookingType` string (e.g. "Family"), not
 * a number, for consistency with `Chalet.allowedBookingTypes` now that it's
 * confirmed to be string-enum-based rather than a numeric bitmask. Not
 * independently confirmed against this specific endpoint — verify with the
 * backend if bookings start failing the same way chalet creation did.
 */
export interface PreviewBookingRequest {
  chaletId: number;
  bookingType: BookingType;
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

/**
 * Response shape is undocumented — every field beyond `id`/`status` is read
 * defensively. Confirmed via a live call against `GET /api/Booking/chalet/{id}`
 * that the customer name field is `userFullName` (often an empty string, not
 * omitted), not `customerName` — `customerName` is kept as a fallback in case
 * some other endpoint variant uses it. `days` is also confirmed to come back
 * as an empty array on this endpoint even for real Confirmed bookings — the
 * per-day breakdown only actually shows up in the chalet's calendar endpoint,
 * see `buildBookingDatesById`.
 *
 * Also confirmed via a live call against `GET /api/Booking/my-bookings`
 * (the customer-facing list): `days` is `[]` there too for every booking
 * regardless of status, and `createdAt` is omitted from the payload
 * entirely — not `null`, just not a key on the object. There is no
 * customer-usable endpoint to backfill either (`GET /api/Booking/{id}`
 * 404s — confirmed by probing the live API directly), so a booking card
 * built from this endpoint cannot show stay dates or a "booked on" date
 * until the backend actually populates them here. Don't rely on either
 * field without a fallback.
 */
export interface Booking {
  id: number;
  chaletId: number;
  chaletName?: string;
  userId?: string;
  userFullName?: string;
  customerName?: string;
  bookingType?: BookingType | string;
  status: string;
  childrenCount?: number;
  notes?: string;
  totalPrice?: number;
  createdAt?: string;
  /** `period` confirmed live as a string ("Morning"/"Evening"/"FullDay") — see `formatBookingPeriod` in `lib/utils.ts`. */
  days?: { date: string; period: string }[];
  isPaid?: boolean;
  paidAmount?: number;
  paymentMethod?: string;
  rejectionReason?: string;
}

/** Payload pushed over the `ReceiveNotification` SignalR event — see `hooks/use-booking-notifications.ts`. */
export interface BookingNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  relatedBookingId: number | null;
  createdAt: string;
}

export interface ApproveBookingRequest {
  refundWindowHours: number;
}

export interface RejectBookingRequest {
  reason: string;
}

/** POST /api/Booking/{id}/pay — records a (possibly partial) cash/manual payment against a booking. */
export interface RecordBookingPaymentRequest {
  amount: number;
  paymentMethod: string;
}

/**
 * GET /api/Booking/customer/{id}/balance — not in the Postman collection's
 * documented examples, and the bearer token attached to it had already
 * expired by the time this was built, so the exact response shape couldn't
 * be confirmed against a live call. Every field is optional and rendered
 * only if present — see `CustomerBalanceCard`.
 */
export interface CustomerBalance {
  totalOwed?: number;
  totalPaid?: number;
  balance?: number;
  [key: string]: unknown;
}

/**
 * GET /api/Booking/chalet/{id}/calendar — confirmed via a live call. Each
 * day carries a `slots` array (not a single flag) since a chalet can have
 * more than one period booked the same day (e.g. Morning + Evening) — a day
 * is booked whenever `slots.length > 0`. `period` on a slot is inconsistent
 * in the wild: some bookings show `"FullDay"/"Morning"/"Evening"`, older
 * ones show a bare numeric string like `"3"` — never assume one or the
 * other.
 */
export interface ChaletCalendarSlot {
  bookingId?: number;
  period?: string;
  status?: string;
  colorCode?: string;
  customerName?: string;
  [key: string]: unknown;
}

export interface ChaletCalendarDay {
  date: string;
  slots?: ChaletCalendarSlot[];
  [key: string]: unknown;
}

// ---------- Statistics: /api/statistics ----------

export interface ChaletStatisticsMonthlyBreakdown {
  year?: number;
  month?: number;
  monthLabel?: string;
  bookingsCount?: number;
  revenue?: number;
}

export interface ChaletStatisticsBookingTypeBreakdown {
  bookingType?: string;
  bookingsCount?: number;
  revenue?: number;
}

export interface ChaletStatisticsPaymentMethodBreakdown {
  paymentMethod?: string;
  paymentType?: string | null;
  bookingsCount?: number;
  revenue?: number;
}

export interface ChaletStatisticsTopCustomer {
  userId?: string;
  fullName?: string;
  bookingsCount?: number;
  totalSpent?: number;
}

/** GET /api/statistics/chalet/{id}?startDate&endDate — confirmed via a live call. ChaletAdmin (own chalet) only per the docs. */
export interface ChaletStatistics {
  chaletId?: number;
  chaletName?: string;
  startDate?: string;
  endDate?: string;
  totalBookings?: number;
  pendingCount?: number;
  confirmedCount?: number;
  rejectedCount?: number;
  cancelledCount?: number;
  cancellationPendingCount?: number;
  completedCount?: number;
  totalRevenue?: number;
  occupancyRatePercentage?: number;
  averageRating?: number | null;
  reviewsCount?: number;
  monthlyBreakdown?: ChaletStatisticsMonthlyBreakdown[];
  bookingTypeBreakdown?: ChaletStatisticsBookingTypeBreakdown[];
  paymentMethodBreakdown?: ChaletStatisticsPaymentMethodBreakdown[];
  topCustomers?: ChaletStatisticsTopCustomer[];
}

export interface TopChaletByRevenue {
  chaletId?: number;
  chaletName?: string;
  revenue?: number;
  bookingsCount?: number;
}

/**
 * GET /api/statistics/system?startDate&endDate — SuperAdmin/SystemAdmin
 * only, per the docs. Unlike `ChaletStatistics`, this couldn't be verified
 * against a live response (no SuperAdmin/SystemAdmin credentials were
 * available) — field names below are taken straight from the Postman docs
 * screenshot and every field is optional, read defensively.
 */
export interface SystemStatistics {
  totalChalets?: number;
  activeChalets?: number;
  totalCustomers?: number;
  totalChaletAdmins?: number;
  totalBookings?: number;
  pendingCount?: number;
  confirmedCount?: number;
  completedCount?: number;
  cancelledCount?: number;
  rejectedCount?: number;
  totalRevenue?: number;
  topChaletsByRevenue?: TopChaletByRevenue[];
  [key: string]: unknown;
}

// ---------- Chalet Reviews: /api/chalet-reviews ----------

/**
 * A customer's review of a chalet. Confirmed via a live call to
 * `GET /api/chalet-reviews/chalet/{id}/pending`. Only approved reviews count
 * toward the chalet's own `averageRating`/`reviewsCount` — unapproved ones
 * only show up in the pending-moderation list.
 */
export interface ChaletReview {
  id: number;
  userId?: string;
  userFullName?: string;
  rating: number;
  comment?: string;
  createdAt?: string;
}

/** POST /api/chalet-reviews — Customer, must own the (Completed) booking being reviewed. */
export interface CreateChaletReviewRequest {
  bookingId: number;
  rating: number;
  comment: string;
}

// ---------- Customer Reviews: /api/admin/users/{id}/reviews ----------

/**
 * One admin-authored review of a customer's behavior on one of their
 * bookings — separate from `ChaletReview` (which is the reverse: a customer
 * reviewing a chalet). Never shown to the customer or publicly. Read via
 * `getCustomerBookingStats`/`getAllCustomerReviews`; created via
 * `addCustomerReview` (see `AddCustomerReviewRequest`). The exact shape when
 * populated is unverified (every live read returned an empty list/array) —
 * read defensively.
 */
export interface CustomerReviewRecord {
  id?: number;
  userId?: string;
  userFullName?: string;
  chaletId?: number;
  chaletName?: string;
  cleanlinessRating?: number;
  disturbanceRating?: number;
  paymentReliabilityRating?: number;
  notes?: string;
  createdAt?: string;
  [key: string]: unknown;
}

/**
 * POST /api/admin/users/{id}/reviews/reviews — SuperAdmin/SystemAdmin/ChaletAdmin.
 * Confirmed live via Postman — the doubled "reviews/reviews" path segment
 * isn't a typo. A ChaletAdmin may only review a customer for a booking made
 * at their own chalet, per the API docs — enforced backend-side; the app
 * only ever surfaces this action from a chalet's own bookings page, where
 * that's already guaranteed by construction.
 */
export interface AddCustomerReviewRequest {
  chaletId: number;
  cleanlinessRating: number;
  disturbanceRating: number;
  paymentReliabilityRating: number;
  notes: string;
}

/** GET /api/admin/users/{id}/reviews/booking-stats — confirmed via a live call. SuperAdmin/SystemAdmin/ChaletAdmin. */
export interface CustomerBookingStats {
  cleanlinessRating?: number;
  disturbanceRating?: number;
  paymentReliabilityRating?: number;
  adminNotes?: string;
}

// ---------- Generic API envelope ----------

/**
 * Shape some list endpoints (confirmed on `GET /api/Chalet`, likely others)
 * nest inside `message` — `{ success, message: { items, totalCount, page,
 * pageSize, totalPages } }`. See `unwrapPaginated` in `lib/api/client.ts`.
 */
export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiErrorBody {
  message?: string;
  error?: string | { message?: string };
  errors?: Record<string, string[]>;
  title?: string;
}
