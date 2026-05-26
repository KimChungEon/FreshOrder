// FreshOrder 공유 타입 정의 — 백엔드 응답(Prisma) 형태에 정렬

export type ID = string;
export type ISODate = string;

// ───────── enums ─────────

export type UserRole = "ADMIN" | "STORE_OWNER";
export type StoreStatus = "ACTIVE" | "INACTIVE";
export type OrderStatus =
  | "REQUESTED"
  | "ACCEPTED"
  | "APPROVED"
  | "REJECTED"
  | "SHIPPING"
  | "DELIVERED"
  | "SETTLED";
export type PaymentType = "IMMEDIATE" | "MONTHLY";
export type PaymentMethod = "CARD" | "BANK_TRANSFER";
export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED";
export type SettlementStatus = "PENDING" | "PARTIAL" | "COMPLETED";
export type BoardType = "NOTICE" | "QNA" | "SUGGESTION";
export type PostStatus = "PUBLISHED" | "ANSWERED" | "CONFIRMED";
export type NotificationChannel = "ALIMTALK" | "PUSH" | "BOTH";
export type InventoryStatus = "EMPTY" | "SHORTAGE" | "WARNING" | "SUFFICIENT";

// ───────── 사용자 / 점포 ─────────

export interface User {
  id: ID;
  email: string;
  name: string;
  phone?: string | null;
  role: UserRole;
  isApproved: boolean;
  storeId?: ID;
  createdAt: ISODate;
}

export interface Store {
  id: ID;
  ownerId: ID;
  storeName: string;
  address: string;
  phone?: string | null;
  status: StoreStatus;
  createdAt: ISODate;
  updatedAt: ISODate;
  owner?: Pick<User, "id" | "name" | "email" | "isApproved">;
  _count?: { orders: number };
}

// ───────── 카테고리 / 상품 ─────────

export interface Category {
  id: ID;
  name: string;
  sortOrder: number;
  createdAt: ISODate;
}

export interface Product {
  id: ID;
  categoryId: ID;
  name: string;
  unit: string;
  unitPrice: number;
  imageUrl?: string | null;
  minOrderQty: number;
  isActive: boolean;
  createdAt: ISODate;
  updatedAt: ISODate;
  category?: Pick<Category, "id" | "name">;
}

// ───────── 발주 ─────────

export interface OrderItem {
  id: ID;
  orderId: ID;
  productId: ID;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  product?: Pick<Product, "id" | "name" | "unit" | "imageUrl">;
}

export interface Order {
  id: ID;
  storeId: ID;
  orderNumber: string;
  status: OrderStatus;
  rejectReason?: string | null;
  totalAmount: number;
  paymentType: PaymentType;
  requestedAt: ISODate;
  approvedAt?: ISODate | null;
  deliveredAt?: ISODate | null;
  store?: Pick<Store, "id" | "storeName">;
  orderItems?: OrderItem[];
  payment?: Payment | null;
  _count?: { orderItems: number };
}

// ───────── 결제 / 정산 ─────────

export interface Payment {
  id: ID;
  orderId: ID;
  storeId: ID;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  pgTransactionId?: string | null;
  paidAt?: ISODate | null;
  createdAt: ISODate;
  order?: Pick<Order, "id" | "orderNumber" | "totalAmount" | "status">;
  store?: Pick<Store, "id" | "storeName">;
}

export interface Settlement {
  id: ID;
  storeId: ID;
  year: number;
  month: number;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  status: SettlementStatus;
  dueDate: ISODate;
  pdfUrl?: string | null;
  createdAt: ISODate;
  store?: Pick<Store, "id" | "storeName">;
}

// ───────── 재고 ─────────

export interface InventoryItem {
  id: ID;
  storeId: ID;
  productId: ID;
  currentQty: number;
  minQty: number;
  updatedAt: ISODate;
  product: Pick<Product, "id" | "name" | "unit" | "unitPrice" | "imageUrl"> & {
    minOrderQty: number;
  };
  status: InventoryStatus;
}

export interface InventoryShortage extends InventoryItem {
  recommendedQty: number;
  recommendedAmount: number;
}

export interface ShortageResponse {
  items: InventoryShortage[];
  summary: {
    count: number;
    totalRecommendedQty: number;
    totalRecommendedAmount: number;
  };
}

// ───────── 즐겨찾기 ─────────

export interface Favorite {
  id: ID;
  storeId: ID;
  productId: ID;
  createdAt: ISODate;
  product?: Pick<Product, "id" | "name" | "unit" | "unitPrice" | "imageUrl"> & {
    isActive?: boolean;
    category?: Pick<Category, "id" | "name">;
  };
}

// ───────── 게시판 ─────────

export interface Post {
  id: ID;
  authorId: ID;
  boardType: BoardType;
  title: string;
  content: string;
  status: PostStatus;
  viewCount: number;
  isPinned: boolean;
  createdAt: ISODate;
  updatedAt: ISODate;
  author?: Pick<User, "id" | "name" | "role">;
  comments?: Comment[];
  _count?: { comments: number };
}

export interface Comment {
  id: ID;
  postId: ID;
  authorId: ID;
  content: string;
  createdAt: ISODate;
  author?: Pick<User, "id" | "name" | "role">;
}

// ───────── 알림 ─────────

export interface Notification {
  id: ID;
  userId: ID;
  title: string;
  message: string;
  channel: NotificationChannel;
  isRead: boolean;
  linkUrl?: string | null;
  sentAt: ISODate;
}

// ───────── 페이지네이션 ─────────

export interface Page<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

// ───────── 인증 응답 ─────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: User & { storeId?: ID };
}

// ───────── 대시보드 응답 ─────────

export interface StoreDashboard {
  inProgressOrders: number;
  monthlyDeliveredOrders: number;
  shortageCount: number;
  unpaidAmount: number;
  recentOrders: Pick<
    Order,
    "id" | "orderNumber" | "status" | "totalAmount" | "requestedAt"
  >[];
  topShortages: InventoryItem[];
}

export interface AdminDashboard {
  todayNewOrders: number;
  pendingOrders: number;
  shippingOrders: number;
  monthlySales: number;
  pendingTop: (Pick<
    Order,
    "id" | "orderNumber" | "status" | "totalAmount" | "requestedAt" | "storeId"
  > & { store: Pick<Store, "id" | "storeName"> })[];
  stores: (Pick<Store, "id" | "storeName" | "status"> & {
    _count: { orders: number };
  })[];
}
