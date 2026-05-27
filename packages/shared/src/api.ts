// FreshOrder API 클라이언트 — axios + JWT refresh
//
// - baseURL: NEXT_PUBLIC_API_URL (Next.js) / VITE_API_URL (Vite) / fallback http://localhost:3001
// - Authorization 헤더 자동 첨부 (localStorage.accessToken)
// - 401 시 /auth/refresh 1회 시도 후 원요청 재시도, 실패 시 /login 리다이렉트
// - 모든 응답은 백엔드 TransformInterceptor 가 { data: ... } 로 래핑하므로 res.data.data 추출

import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import type {
  AdminDashboard,
  AuthResponse,
  AuthTokens,
  BoardType,
  Category,
  Comment,
  Favorite,
  ID,
  InventoryItem,
  InventoryStatus,
  Notification,
  Order,
  OrderStatus,
  Page,
  Payment,
  PaymentMethod,
  Post,
  Product,
  Settlement,
  SettlementStatus,
  ShortageResponse,
  Store,
  StoreDashboard,
  User,
} from "./types";

// ───────── 환경 / 토큰 저장 ─────────

const ACCESS_KEY = "freshorder_access_token";
const REFRESH_KEY = "freshorder_refresh_token";

function resolveBaseURL(): string {
  // Next.js(web): `process.env.NEXT_PUBLIC_API_URL` 은 webpack 빌드 타임 정적 치환 대상.
  // 반드시 "이 정확한 식별자 패턴 그대로" 참조해야 한다 — 변수에 담거나
  // optional chaining 으로 우회하면 치환되지 않아 fallback URL 로 떨어진다.
  // Vite(admin) 환경에서는 process 자체가 undefined 이므로 typeof 가드로 보호.
  try {
    // @ts-ignore - Vite 측에 NodeJS.ProcessEnv 타입이 없을 수 있음
    if (typeof process !== "undefined" && process.env && process.env.NEXT_PUBLIC_API_URL) {
      // @ts-ignore
      return process.env.NEXT_PUBLIC_API_URL;
    }
  } catch {
    /* Vite 등에서 process 미정의 */
  }

  // Vite(admin): `import.meta.env.VITE_API_URL` 도 동일하게 정적 치환 대상.
  // 패턴 그대로 참조해야 inline 됨.
  try {
    // @ts-ignore - import.meta.env 는 Vite 가 주입; Next 측에서는 try 로 보호
    const v: string | undefined = import.meta.env.VITE_API_URL;
    if (v) return v;
  } catch {
    /* import.meta.env 미지원 환경 */
  }

  return "http://localhost:3001";
}

const isBrowser = (): boolean => typeof window !== "undefined";

export const tokenStore = {
  getAccess(): string | null {
    return isBrowser() ? localStorage.getItem(ACCESS_KEY) : null;
  },
  getRefresh(): string | null {
    return isBrowser() ? localStorage.getItem(REFRESH_KEY) : null;
  },
  set(tokens: AuthTokens): void {
    if (!isBrowser()) return;
    localStorage.setItem(ACCESS_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  },
  clear(): void {
    if (!isBrowser()) return;
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

// ───────── axios 인스턴스 ─────────

export const http: AxiosInstance = axios.create({
  baseURL: resolveBaseURL(),
  timeout: 15000,
});

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.getAccess();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStore.getRefresh();
  if (!refreshToken) return null;
  try {
    const res = await axios.post<{ data: AuthTokens }>(
      `${resolveBaseURL()}/auth/refresh`,
      { refreshToken },
      { timeout: 15000 },
    );
    const tokens = res.data.data;
    tokenStore.set(tokens);
    return tokens.accessToken;
  } catch {
    tokenStore.clear();
    return null;
  }
}

http.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as
      | (AxiosRequestConfig & { _retried?: boolean })
      | undefined;
    const status = error.response?.status;

    if (
      status === 401 &&
      original &&
      !original._retried &&
      !original.url?.includes("/auth/")
    ) {
      original._retried = true;
      if (!refreshing) refreshing = refreshAccessToken();
      const newToken = await refreshing;
      refreshing = null;

      if (newToken) {
        original.headers = {
          ...(original.headers ?? {}),
          Authorization: `Bearer ${newToken}`,
        };
        return http.request(original);
      }

      // refresh 실패 → 로그인으로
      if (isBrowser() && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

// ───────── 응답 unwrap ─────────

async function unwrap<T>(p: Promise<{ data: { data: T } }>): Promise<T> {
  const r = await p;
  return r.data.data;
}

// ═════════════ 인증 ═════════════

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await unwrap<AuthResponse>(
    http.post("/auth/login", { email, password }),
  );
  tokenStore.set({ accessToken: res.accessToken, refreshToken: res.refreshToken });
  return res;
}

export interface SignupInput {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: "ADMIN" | "STORE_OWNER";
  inviteCode?: string;
  storeName?: string;
  storeAddress?: string;
}

export async function signup(input: SignupInput): Promise<AuthResponse> {
  const res = await unwrap<AuthResponse>(http.post("/auth/signup", input));
  tokenStore.set({ accessToken: res.accessToken, refreshToken: res.refreshToken });
  return res;
}

export function logout(): void {
  tokenStore.clear();
}

// ═════════════ 카테고리 / 상품 ═════════════

export const getCategories = (): Promise<Category[]> =>
  unwrap(http.get("/categories"));

export const createCategory = (data: { name: string; sortOrder?: number }) =>
  unwrap<Category>(http.post("/categories", data));

export const updateCategory = (
  id: ID,
  data: { name?: string; sortOrder?: number },
) => unwrap<Category>(http.put(`/categories/${id}`, data));

export const deleteCategory = (id: ID): Promise<void> =>
  unwrap(http.delete(`/categories/${id}`));

export interface ProductsQuery {
  categoryId?: ID;
  page?: number;
  limit?: number;
  keyword?: string;
}

export const getProducts = (query: ProductsQuery = {}): Promise<Page<Product>> =>
  unwrap(http.get("/products", { params: query }));

export const getProduct = (id: ID): Promise<Product> =>
  unwrap(http.get(`/products/${id}`));

export interface UpsertProductInput {
  categoryId: ID;
  name: string;
  unit: string;
  unitPrice: number;
  imageUrl?: string;
  minOrderQty?: number;
  isActive?: boolean;
}

export const createProduct = (data: UpsertProductInput) =>
  unwrap<Product>(http.post("/products", data));

export const updateProduct = (id: ID, data: Partial<UpsertProductInput>) =>
  unwrap<Product>(http.put(`/products/${id}`, data));

export const deleteProduct = (id: ID): Promise<void> =>
  unwrap(http.delete(`/products/${id}`));

// ═════════════ 발주 ═════════════

export interface OrdersQuery {
  status?: OrderStatus;
  storeId?: ID;
  page?: number;
  limit?: number;
}

export const getOrders = (query: OrdersQuery = {}): Promise<Page<Order>> =>
  unwrap(http.get("/orders", { params: query }));

export const getOrderDetail = (id: ID): Promise<Order> =>
  unwrap(http.get(`/orders/${id}`));

export interface CreateOrderInput {
  items: { productId: ID; quantity: number }[];
  paymentType?: "IMMEDIATE" | "MONTHLY";
}

export const createOrder = (data: CreateOrderInput): Promise<Order> =>
  unwrap(http.post("/orders", data));

export const approveOrder = (id: ID): Promise<Order> =>
  unwrap(http.patch(`/orders/${id}/approve`));

export const rejectOrder = (id: ID, reason: string): Promise<Order> =>
  unwrap(http.patch(`/orders/${id}/reject`, { reason }));

export const shipOrder = (id: ID): Promise<Order> =>
  unwrap(http.patch(`/orders/${id}/ship`));

export const deliverOrder = (id: ID): Promise<Order> =>
  unwrap(http.patch(`/orders/${id}/deliver`));

export const updateOrder = (
  id: ID,
  data: { items: { productId: ID; quantity: number }[] },
): Promise<Order> => unwrap(http.put(`/orders/${id}`, data));

// ═════════════ 재고 ═════════════

export const getInventory = (
  storeId: ID,
  status?: InventoryStatus,
): Promise<InventoryItem[]> =>
  unwrap(
    http.get(`/stores/${storeId}/inventory`, {
      params: status ? { status } : {},
    }),
  );

export interface UpdateInventoryItem {
  productId: ID;
  currentQty: number;
  minQty?: number;
}

export const updateInventory = (
  storeId: ID,
  items: UpdateInventoryItem[],
): Promise<InventoryItem[]> =>
  unwrap(http.put(`/stores/${storeId}/inventory`, { items }));

export const updateInventoryItem = (
  storeId: ID,
  productId: ID,
  data: { currentQty: number; minQty?: number },
): Promise<InventoryItem> =>
  unwrap(http.patch(`/stores/${storeId}/inventory/${productId}`, data));

export const getShortage = (storeId: ID): Promise<ShortageResponse> =>
  unwrap(http.get(`/stores/${storeId}/inventory/shortage`));

// ═════════════ 즐겨찾기 ═════════════

export const getFavorites = (storeId: ID): Promise<Favorite[]> =>
  unwrap(http.get(`/stores/${storeId}/favorites`));

export const addFavorite = (storeId: ID, productId: ID): Promise<Favorite> =>
  unwrap(http.post(`/stores/${storeId}/favorites`, { productId }));

export const removeFavorite = (
  storeId: ID,
  productId: ID,
): Promise<{ ok: true }> =>
  unwrap(http.delete(`/stores/${storeId}/favorites/${productId}`));

// ═════════════ 결제 / 정산 ═════════════

export const createPayment = (
  orderId: ID,
  method: PaymentMethod,
): Promise<Payment> => unwrap(http.post("/payments", { orderId, method }));

export interface PaymentsQuery {
  status?: "PENDING" | "COMPLETED" | "FAILED";
  storeId?: ID;
  page?: number;
  limit?: number;
}

export const getPayments = (query: PaymentsQuery = {}): Promise<Page<Payment>> =>
  unwrap(http.get("/payments", { params: query }));

export interface SettlementsQuery {
  storeId?: ID;
  year?: number;
  status?: SettlementStatus;
}

export const getSettlements = (
  query: SettlementsQuery = {},
): Promise<Settlement[]> => unwrap(http.get("/settlements", { params: query }));

export const generateSettlement = (data: {
  storeId: ID;
  year: number;
  month: number;
}): Promise<Settlement> => unwrap(http.post("/settlements/generate", data));

export const updateSettlement = (
  id: ID,
  data: { status?: SettlementStatus; paidAmount?: number },
): Promise<Settlement> => unwrap(http.patch(`/settlements/${id}`, data));

export const getSettlementPdf = (id: ID): Promise<unknown> =>
  unwrap(http.get(`/settlements/${id}/pdf`));

// ═════════════ 게시판 ═════════════

export interface PostsQuery {
  boardType?: BoardType;
  page?: number;
  limit?: number;
}

export const getPosts = (query: PostsQuery = {}): Promise<Page<Post>> =>
  unwrap(http.get("/posts", { params: query }));

export const getPostDetail = (id: ID): Promise<Post> =>
  unwrap(http.get(`/posts/${id}`));

export interface CreatePostInput {
  boardType: BoardType;
  title: string;
  content: string;
  isPinned?: boolean;
}

export const createPost = (data: CreatePostInput): Promise<Post> =>
  unwrap(http.post("/posts", data));

export const updatePost = (
  id: ID,
  data: Partial<CreatePostInput>,
): Promise<Post> => unwrap(http.put(`/posts/${id}`, data));

export const deletePost = (id: ID): Promise<{ ok: true }> =>
  unwrap(http.delete(`/posts/${id}`));

export const createComment = (postId: ID, content: string): Promise<Comment> =>
  unwrap(http.post(`/posts/${postId}/comments`, { content }));

export const deleteComment = (
  postId: ID,
  commentId: ID,
): Promise<{ ok: true }> =>
  unwrap(http.delete(`/posts/${postId}/comments/${commentId}`));

// ═════════════ 알림 ═════════════

export const getNotifications = (): Promise<Notification[]> =>
  unwrap(http.get("/notifications"));

export const markAsRead = (id: ID): Promise<Notification> =>
  unwrap(http.patch(`/notifications/${id}/read`));

export const markAllAsRead = (): Promise<{ updated: number }> =>
  unwrap(http.patch("/notifications/read-all"));

// ═════════════ 매장 / 대시보드 ═════════════

export const getStores = (): Promise<Store[]> => unwrap(http.get("/stores"));

export const getStoreDetail = (id: ID): Promise<
  Store & {
    summary: {
      orderCount: number;
      totalSales: number;
      recentOrders: Pick<
        Order,
        "id" | "orderNumber" | "status" | "totalAmount" | "requestedAt"
      >[];
    };
  }
> => unwrap(http.get(`/stores/${id}`));

export const approveStore = (id: ID): Promise<User> =>
  unwrap(http.patch(`/stores/${id}/approve`));

export const issueInviteCode = (): Promise<{ code: string }> =>
  unwrap(http.post("/stores/invite-code"));

export const getStoreDashboard = (): Promise<StoreDashboard> =>
  unwrap(http.get("/dashboard/store"));

export const getAdminDashboard = (): Promise<AdminDashboard> =>
  unwrap(http.get("/dashboard/admin"));

// ═════════════ 헬스 ═════════════

export const health = (): Promise<{ status: string; service: string; timestamp: string }> =>
  unwrap(http.get("/health"));
