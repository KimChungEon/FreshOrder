// FreshOrder 공유 타입 정의
// 실제 API 스키마로 교체될 때까지 프론트엔드 단독 동작을 위한 타입

export type ID = string;
export type ISODate = string;

// ───────── 사용자 / 점포 ─────────

export type UserRole = "admin" | "owner";

export interface User {
  id: ID;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  storeId?: ID;          // owner 인 경우 소속 점포
  createdAt: ISODate;
}

export interface Store {
  id: ID;
  name: string;          // 예: 정자점
  ownerId: ID;
  address: string;
  phone: string;
  businessNumber: string;
  openedAt: ISODate;
}

// ───────── 상품 / 카테고리 ─────────

export interface Category {
  id: ID;
  name: string;          // 소스류, 양념류 ...
  order: number;
}

export type ProductStatus = "active" | "inactive" | "soldout";

export interface Product {
  id: ID;
  categoryId: ID;
  sku: string;
  name: string;
  unit: string;          // 1L, 5kg, 100매 등
  price: number;         // 원
  minOrderQty: number;
  imageUrl?: string;
  description?: string;
  status: ProductStatus;
}

// ───────── 발주 ─────────

export type OrderStatus =
  | "requested"   // 요청됨
  | "approved"   // 승인
  | "shipping"   // 배송중
  | "delivered"  // 납품완료
  | "cancelled"; // 취소

export interface OrderItem {
  productId: ID;
  productName: string;   // snapshot
  unit: string;          // snapshot
  unitPrice: number;     // snapshot
  qty: number;
  amount: number;        // unitPrice * qty
}

export interface Order {
  id: ID;
  orderNo: string;       // 예: FO-20260501-001
  storeId: ID;
  storeName: string;     // snapshot
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  memo?: string;
  requestedAt: ISODate;
  approvedAt?: ISODate;
  shippedAt?: ISODate;
  deliveredAt?: ISODate;
  cancelledAt?: ISODate;
  desiredDeliveryDate?: ISODate;
}

// ───────── 결제 / 정산 ─────────

export type PaymentMethod = "card" | "transfer" | "credit"; // credit = 외상
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface Payment {
  id: ID;
  orderId: ID;
  storeId: ID;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  paidAt?: ISODate;
  createdAt: ISODate;
}

export interface Settlement {
  id: ID;
  storeId: ID;
  storeName: string;
  period: string;        // "2026-04"
  totalOrderAmount: number;
  totalPaidAmount: number;
  outstanding: number;
  orderCount: number;
  generatedAt: ISODate;
}

// ───────── 재고 ─────────

export type InventoryStatus = "sufficient" | "warning" | "shortage";

export interface Inventory {
  id: ID;
  storeId: ID;
  productId: ID;
  productName: string;
  qty: number;
  safetyQty: number;     // 안전 재고
  status: InventoryStatus;
  updatedAt: ISODate;
}

// ───────── 즐겨찾기 ─────────

export interface Favorite {
  id: ID;
  userId: ID;
  productId: ID;
  createdAt: ISODate;
}

// ───────── 게시판 / 알림 ─────────

export type PostType = "notice" | "qna" | "suggestion";

export interface Post {
  id: ID;
  type: PostType;
  title: string;
  content: string;
  authorId: ID;
  authorName: string;
  pinned?: boolean;
  views: number;
  createdAt: ISODate;
}

export interface Comment {
  id: ID;
  postId: ID;
  authorId: ID;
  authorName: string;
  content: string;
  createdAt: ISODate;
}

export type NotificationType =
  | "order"
  | "settlement"
  | "inventory"
  | "post"
  | "system";

export interface Notification {
  id: ID;
  userId: ID;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  read: boolean;
  createdAt: ISODate;
}
