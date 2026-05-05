// FreshOrder Mock API 클라이언트
//
// 모든 함수는 Promise를 반환하며 약 300ms 의 인공 딜레이를 갖는다.
// 실제 백엔드가 준비되면 각 함수 본문만 fetch 호출로 교체하면 된다.
// 호출부의 시그니처는 그대로 유지되도록 설계되어 있다.

import * as mock from "./mock-data";
import type {
  Category,
  Comment,
  ID,
  Inventory,
  ISODate,
  Notification,
  Order,
  OrderItem,
  OrderStatus,
  Payment,
  Post,
  PostType,
  Product,
  Settlement,
  Store,
  User,
} from "./types";

const DEFAULT_DELAY_MS = 300;

const delay = <T>(value: T, ms = DEFAULT_DELAY_MS): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

// 단순한 in-memory 저장소. 모듈 로드 동안 살아있는 mutable 사본.
const db = {
  users: [...mock.users],
  stores: [...mock.stores],
  categories: [...mock.categories],
  products: [...mock.products],
  orders: [...mock.orders],
  payments: [...mock.payments],
  settlements: [...mock.settlements],
  inventory: [...mock.inventory],
  favorites: [...mock.favorites],
  posts: [...mock.posts],
  comments: [...mock.comments],
  notifications: [...mock.notifications],
};

const newId = (prefix: string): ID =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

const nowISO = (): ISODate => new Date().toISOString();

// ───────── 사용자 / 점포 ─────────

export const getCurrentUser = (userId: ID): Promise<User | undefined> =>
  delay(db.users.find((u) => u.id === userId));

export const listStores = (): Promise<Store[]> => delay(db.stores);

export const getStore = (storeId: ID): Promise<Store | undefined> =>
  delay(db.stores.find((s) => s.id === storeId));

// ───────── 카테고리 / 상품 ─────────

export const listCategories = (): Promise<Category[]> =>
  delay([...db.categories].sort((a, b) => a.order - b.order));

export interface ProductQuery {
  categoryId?: ID;
  keyword?: string;
  status?: Product["status"];
}

export const getProducts = (query: ProductQuery = {}): Promise<Product[]> => {
  const { categoryId, keyword, status } = query;
  const kw = keyword?.trim().toLowerCase();
  const result = db.products.filter((p) => {
    if (categoryId && p.categoryId !== categoryId) return false;
    if (status && p.status !== status) return false;
    if (kw && !`${p.name} ${p.sku}`.toLowerCase().includes(kw)) return false;
    return true;
  });
  return delay(result);
};

export const getProduct = (productId: ID): Promise<Product | undefined> =>
  delay(db.products.find((p) => p.id === productId));

export interface UpsertProductInput {
  categoryId: ID;
  sku: string;
  name: string;
  unit: string;
  price: number;
  minOrderQty: number;
  description?: string;
  status?: Product["status"];
}

export const createProduct = (input: UpsertProductInput): Promise<Product> => {
  const product: Product = {
    id: newId("p"),
    status: input.status ?? "active",
    ...input,
  };
  db.products.push(product);
  return delay(product);
};

export const updateProduct = (
  productId: ID,
  patch: Partial<UpsertProductInput>,
): Promise<Product> => {
  const p = db.products.find((x) => x.id === productId);
  if (!p) throw new Error(`product not found: ${productId}`);
  Object.assign(p, patch);
  return delay(p);
};

export const deleteProduct = (productId: ID): Promise<void> => {
  const idx = db.products.findIndex((p) => p.id === productId);
  if (idx >= 0) db.products.splice(idx, 1);
  return delay(undefined);
};

export interface UpsertCategoryInput {
  name: string;
  order?: number;
}

export const createCategory = (input: UpsertCategoryInput): Promise<Category> => {
  const cat: Category = {
    id: newId("c"),
    name: input.name,
    order: input.order ?? db.categories.length + 1,
  };
  db.categories.push(cat);
  return delay(cat);
};

export const updateCategory = (
  categoryId: ID,
  patch: Partial<UpsertCategoryInput>,
): Promise<Category> => {
  const c = db.categories.find((x) => x.id === categoryId);
  if (!c) throw new Error(`category not found: ${categoryId}`);
  if (patch.name !== undefined) c.name = patch.name;
  if (patch.order !== undefined) c.order = patch.order;
  return delay(c);
};

export const deleteCategory = (categoryId: ID): Promise<void> => {
  const idx = db.categories.findIndex((c) => c.id === categoryId);
  if (idx >= 0) db.categories.splice(idx, 1);
  return delay(undefined);
};

// ───────── 발주 ─────────

export interface OrderQuery {
  storeId?: ID;
  status?: OrderStatus;
  from?: ISODate;
  to?: ISODate;
}

export const getOrders = (query: OrderQuery = {}): Promise<Order[]> => {
  const { storeId, status, from, to } = query;
  const result = db.orders
    .filter((o) => {
      if (storeId && o.storeId !== storeId) return false;
      if (status && o.status !== status) return false;
      if (from && o.requestedAt < from) return false;
      if (to && o.requestedAt > to) return false;
      return true;
    })
    .sort((a, b) => (a.requestedAt < b.requestedAt ? 1 : -1));
  return delay(result);
};

export const getOrder = (orderId: ID): Promise<Order | undefined> =>
  delay(db.orders.find((o) => o.id === orderId));

export interface CreateOrderInput {
  storeId: ID;
  items: { productId: ID; qty: number }[];
  desiredDeliveryDate?: ISODate;
  memo?: string;
}

export const createOrder = (input: CreateOrderInput): Promise<Order> => {
  const store = db.stores.find((s) => s.id === input.storeId);
  if (!store) throw new Error(`store not found: ${input.storeId}`);

  const items: OrderItem[] = input.items.map(({ productId, qty }) => {
    const p = db.products.find((x) => x.id === productId);
    if (!p) throw new Error(`product not found: ${productId}`);
    return {
      productId: p.id,
      productName: p.name,
      unit: p.unit,
      unitPrice: p.price,
      qty,
      amount: p.price * qty,
    };
  });

  const subtotal = items.reduce((s, i) => s + i.amount, 0);
  const deliveryFee = store.id === "st-dongtan" ? 3000 : 0;

  const order: Order = {
    id: newId("o"),
    orderNo: `FO-${nowISO().slice(0, 10).replace(/-/g, "")}-${String(db.orders.length + 1).padStart(3, "0")}`,
    storeId: store.id,
    storeName: store.name,
    status: "requested",
    items,
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    memo: input.memo,
    desiredDeliveryDate: input.desiredDeliveryDate,
    requestedAt: nowISO(),
  };

  db.orders.unshift(order);
  return delay(order);
};

export const updateOrderStatus = (
  orderId: ID,
  status: OrderStatus,
): Promise<Order> => {
  const o = db.orders.find((x) => x.id === orderId);
  if (!o) throw new Error(`order not found: ${orderId}`);
  o.status = status;
  const ts = nowISO();
  if (status === "approved")  o.approvedAt = ts;
  if (status === "shipping")  o.shippedAt = ts;
  if (status === "delivered") o.deliveredAt = ts;
  if (status === "cancelled") o.cancelledAt = ts;
  return delay(o);
};

// ───────── 결제 / 정산 ─────────

export const getPaymentsByOrder = (orderId: ID): Promise<Payment[]> =>
  delay(db.payments.filter((p) => p.orderId === orderId));

export interface SettlementQuery {
  storeId?: ID;
  period?: string; // YYYY-MM
}

export const getSettlements = (query: SettlementQuery = {}): Promise<Settlement[]> => {
  const { storeId, period } = query;
  const result = db.settlements
    .filter((s) => {
      if (storeId && s.storeId !== storeId) return false;
      if (period && s.period !== period) return false;
      return true;
    })
    .sort((a, b) => (a.period < b.period ? 1 : -1));
  return delay(result);
};

export const updateSettlementPayment = (
  settlementId: ID,
  paidAmount: number,
): Promise<Settlement> => {
  const s = db.settlements.find((x) => x.id === settlementId);
  if (!s) throw new Error(`settlement not found: ${settlementId}`);
  s.totalPaidAmount = Math.max(0, Math.min(paidAmount, s.totalOrderAmount));
  s.outstanding = s.totalOrderAmount - s.totalPaidAmount;
  return delay(s);
};

export const markSettlementPaid = (settlementId: ID): Promise<Settlement> => {
  const s = db.settlements.find((x) => x.id === settlementId);
  if (!s) throw new Error(`settlement not found: ${settlementId}`);
  s.totalPaidAmount = s.totalOrderAmount;
  s.outstanding = 0;
  return delay(s);
};

// ───────── 재고 ─────────

export const getInventory = (storeId?: ID): Promise<Inventory[]> => {
  const result = storeId
    ? db.inventory.filter((i) => i.storeId === storeId)
    : db.inventory;
  return delay(result);
};

export const updateInventoryQty = (
  inventoryId: ID,
  qty: number,
): Promise<Inventory> => {
  const inv = db.inventory.find((i) => i.id === inventoryId);
  if (!inv) throw new Error(`inventory not found: ${inventoryId}`);
  inv.qty = qty;
  inv.status =
    qty <= 0
      ? "shortage"
      : qty < inv.safetyQty
      ? "warning"
      : qty <= inv.safetyQty
      ? "warning"
      : "sufficient";
  inv.updatedAt = nowISO();
  return delay(inv);
};

// ───────── 즐겨찾기 ─────────

export const getFavorites = (userId: ID): Promise<Product[]> => {
  const productIds = db.favorites
    .filter((f) => f.userId === userId)
    .map((f) => f.productId);
  return delay(db.products.filter((p) => productIds.includes(p.id)));
};

export const toggleFavorite = (
  userId: ID,
  productId: ID,
): Promise<{ favorited: boolean }> => {
  const idx = db.favorites.findIndex(
    (f) => f.userId === userId && f.productId === productId,
  );
  if (idx >= 0) {
    db.favorites.splice(idx, 1);
    return delay({ favorited: false });
  }
  db.favorites.push({
    id: newId("fav"),
    userId,
    productId,
    createdAt: nowISO(),
  });
  return delay({ favorited: true });
};

// ───────── 게시판 ─────────

export interface PostQuery {
  type?: PostType;
  keyword?: string;
}

export const listPosts = (query: PostQuery = {}): Promise<Post[]> => {
  const { type, keyword } = query;
  const kw = keyword?.trim().toLowerCase();
  const result = db.posts
    .filter((p) => {
      if (type && p.type !== type) return false;
      if (kw && !`${p.title} ${p.content}`.toLowerCase().includes(kw)) return false;
      return true;
    })
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return a.createdAt < b.createdAt ? 1 : -1;
    });
  return delay(result);
};

export const getPost = (postId: ID): Promise<Post | undefined> =>
  delay(db.posts.find((p) => p.id === postId));

export const getCommentsByPost = (postId: ID): Promise<Comment[]> =>
  delay(
    db.comments
      .filter((c) => c.postId === postId)
      .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1)),
  );

export interface CreateCommentInput {
  postId: ID;
  authorId: ID;
  authorName: string;
  content: string;
}

export const createComment = (input: CreateCommentInput): Promise<Comment> => {
  const comment: Comment = {
    id: newId("cmt"),
    ...input,
    createdAt: nowISO(),
  };
  db.comments.push(comment);
  return delay(comment);
};

export interface CreatePostInput {
  type: PostType;
  title: string;
  content: string;
  authorId: ID;
  authorName: string;
}

export const createPost = (input: CreatePostInput): Promise<Post> => {
  const post: Post = {
    id: newId("post"),
    ...input,
    views: 0,
    createdAt: nowISO(),
  };
  db.posts.unshift(post);
  return delay(post);
};

// ───────── 알림 ─────────

export const getNotifications = (userId: ID): Promise<Notification[]> =>
  delay(
    db.notifications
      .filter((n) => n.userId === userId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
  );

export const markNotificationRead = (
  notificationId: ID,
): Promise<Notification> => {
  const n = db.notifications.find((x) => x.id === notificationId);
  if (!n) throw new Error(`notification not found: ${notificationId}`);
  n.read = true;
  return delay(n);
};

export const markAllNotificationsRead = (userId: ID): Promise<number> => {
  let updated = 0;
  db.notifications.forEach((n) => {
    if (n.userId === userId && !n.read) {
      n.read = true;
      updated += 1;
    }
  });
  return delay(updated);
};
