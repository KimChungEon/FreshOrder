// FreshOrder 목 데이터
// 실제 백엔드 연결 전, 프론트엔드가 단독으로 동작하기 위한 데이터셋

import type {
  Category,
  Comment,
  Favorite,
  Inventory,
  Notification,
  Order,
  Payment,
  Post,
  Product,
  Settlement,
  Store,
  User,
} from "./types";

// ───────── 사용자 ─────────

export const users: User[] = [
  {
    id: "u-admin-1",
    email: "admin@freshorder.kr",
    name: "본사 운영팀",
    phone: "02-1588-0000",
    role: "admin",
    createdAt: "2025-08-01T09:00:00+09:00",
  },
  {
    id: "u-owner-1",
    email: "jungja@freshorder.kr",
    name: "김지훈",
    phone: "010-1111-2222",
    role: "owner",
    storeId: "st-jungja",
    createdAt: "2025-09-12T09:00:00+09:00",
  },
  {
    id: "u-owner-2",
    email: "geumgok@freshorder.kr",
    name: "박서연",
    phone: "010-3333-4444",
    role: "owner",
    storeId: "st-geumgok",
    createdAt: "2025-10-05T09:00:00+09:00",
  },
  {
    id: "u-owner-3",
    email: "dongtan@freshorder.kr",
    name: "이도현",
    phone: "010-5555-6666",
    role: "owner",
    storeId: "st-dongtan",
    createdAt: "2026-01-20T09:00:00+09:00",
  },
];

// ───────── 점포 ─────────

export const stores: Store[] = [
  {
    id: "st-jungja",
    name: "정자점",
    ownerId: "u-owner-1",
    address: "경기도 성남시 분당구 정자동 178-3 1F",
    phone: "031-700-1111",
    businessNumber: "123-45-67890",
    openedAt: "2025-09-15T00:00:00+09:00",
  },
  {
    id: "st-geumgok",
    name: "금곡점",
    ownerId: "u-owner-2",
    address: "경기도 성남시 분당구 금곡로 35 2F",
    phone: "031-700-2222",
    businessNumber: "234-56-78901",
    openedAt: "2025-10-08T00:00:00+09:00",
  },
  {
    id: "st-dongtan",
    name: "동탄점",
    ownerId: "u-owner-3",
    address: "경기도 화성시 동탄대로 552 1F",
    phone: "031-700-3333",
    businessNumber: "345-67-89012",
    openedAt: "2026-01-25T00:00:00+09:00",
  },
];

// ───────── 카테고리 ─────────

export const categories: Category[] = [
  { id: "c-sauce",     name: "소스류",     order: 1 },
  { id: "c-spice",     name: "양념류",     order: 2 },
  { id: "c-noodle",    name: "면/분말류",  order: 3 },
  { id: "c-kimchi",    name: "김치류",     order: 4 },
  { id: "c-package",   name: "포장재",     order: 5 },
];

// ───────── 상품 (총 20개) ─────────

export const products: Product[] = [
  // 소스류 4
  {
    id: "p-001", categoryId: "c-sauce", sku: "SAU-001",
    name: "떡볶이 양념소스", unit: "5kg", price: 28000,
    minOrderQty: 1, status: "active",
    description: "프랜차이즈 표준 떡볶이 양념. 매운맛 중간.",
  },
  {
    id: "p-002", categoryId: "c-sauce", sku: "SAU-002",
    name: "짜장소스", unit: "3kg", price: 22000,
    minOrderQty: 1, status: "active",
  },
  {
    id: "p-003", categoryId: "c-sauce", sku: "SAU-003",
    name: "고소한 마요네즈", unit: "3.2kg", price: 12500,
    minOrderQty: 2, status: "active",
  },
  {
    id: "p-004", categoryId: "c-sauce", sku: "SAU-004",
    name: "오리지널 핫소스", unit: "1L", price: 9800,
    minOrderQty: 2, status: "active",
  },

  // 양념류 4
  {
    id: "p-005", categoryId: "c-spice", sku: "SPC-001",
    name: "고운 고춧가루(국산)", unit: "1kg", price: 18000,
    minOrderQty: 1, status: "active",
  },
  {
    id: "p-006", categoryId: "c-spice", sku: "SPC-002",
    name: "굵은 고춧가루(국산)", unit: "1kg", price: 16500,
    minOrderQty: 1, status: "active",
  },
  {
    id: "p-007", categoryId: "c-spice", sku: "SPC-003",
    name: "다진마늘", unit: "1kg", price: 9500,
    minOrderQty: 2, status: "active",
  },
  {
    id: "p-008", categoryId: "c-spice", sku: "SPC-004",
    name: "볶음 통깨", unit: "500g", price: 7800,
    minOrderQty: 2, status: "active",
  },

  // 면/분말류 4
  {
    id: "p-009", categoryId: "c-noodle", sku: "NDL-001",
    name: "생우동면", unit: "200g x 10입", price: 11000,
    minOrderQty: 1, status: "active",
  },
  {
    id: "p-010", categoryId: "c-noodle", sku: "NDL-002",
    name: "라면 사리면", unit: "110g x 30입", price: 21000,
    minOrderQty: 1, status: "active",
  },
  {
    id: "p-011", categoryId: "c-noodle", sku: "NDL-003",
    name: "부침가루", unit: "5kg", price: 14500,
    minOrderQty: 1, status: "active",
  },
  {
    id: "p-012", categoryId: "c-noodle", sku: "NDL-004",
    name: "튀김가루", unit: "5kg", price: 15800,
    minOrderQty: 1, status: "soldout",
  },

  // 김치류 4
  {
    id: "p-013", categoryId: "c-kimchi", sku: "KIM-001",
    name: "프리미엄 깍두기", unit: "10kg", price: 38000,
    minOrderQty: 1, status: "active",
  },
  {
    id: "p-014", categoryId: "c-kimchi", sku: "KIM-002",
    name: "포기 배추김치", unit: "10kg", price: 42000,
    minOrderQty: 1, status: "active",
  },
  {
    id: "p-015", categoryId: "c-kimchi", sku: "KIM-003",
    name: "총각김치", unit: "5kg", price: 28000,
    minOrderQty: 1, status: "active",
  },
  {
    id: "p-016", categoryId: "c-kimchi", sku: "KIM-004",
    name: "백김치", unit: "10kg", price: 36000,
    minOrderQty: 1, status: "active",
  },

  // 포장재 4
  {
    id: "p-017", categoryId: "c-package", sku: "PKG-001",
    name: "일회용 포장용기 500ml", unit: "100매", price: 13000,
    minOrderQty: 2, status: "active",
  },
  {
    id: "p-018", categoryId: "c-package", sku: "PKG-002",
    name: "비닐봉투(대)", unit: "100매", price: 6500,
    minOrderQty: 5, status: "active",
  },
  {
    id: "p-019", categoryId: "c-package", sku: "PKG-003",
    name: "위생장갑", unit: "100매 x 10팩", price: 9800,
    minOrderQty: 1, status: "active",
  },
  {
    id: "p-020", categoryId: "c-package", sku: "PKG-004",
    name: "크라프트 종이백(중)", unit: "200매", price: 18000,
    minOrderQty: 1, status: "active",
  },
];

// ───────── 발주 (10건, 다양한 상태) ─────────

const itemSnap = (productId: string, qty: number) => {
  const p = products.find((x) => x.id === productId)!;
  return {
    productId: p.id,
    productName: p.name,
    unit: p.unit,
    unitPrice: p.price,
    qty,
    amount: p.price * qty,
  };
};

const sumItems = (items: { amount: number }[]) =>
  items.reduce((s, i) => s + i.amount, 0);

const buildOrder = (
  partial: Omit<Order, "subtotal" | "total"> & { deliveryFee: number },
): Order => {
  const subtotal = sumItems(partial.items);
  return { ...partial, subtotal, total: subtotal + partial.deliveryFee };
};

export const orders: Order[] = [
  buildOrder({
    id: "o-001", orderNo: "FO-20260428-001",
    storeId: "st-jungja", storeName: "정자점",
    status: "delivered",
    items: [itemSnap("p-001", 4), itemSnap("p-005", 3), itemSnap("p-013", 2)],
    deliveryFee: 0,
    requestedAt: "2026-04-28T08:30:00+09:00",
    approvedAt:  "2026-04-28T10:00:00+09:00",
    shippedAt:   "2026-04-29T07:00:00+09:00",
    deliveredAt: "2026-04-29T13:20:00+09:00",
    desiredDeliveryDate: "2026-04-29",
  }),
  buildOrder({
    id: "o-002", orderNo: "FO-20260429-002",
    storeId: "st-geumgok", storeName: "금곡점",
    status: "delivered",
    items: [itemSnap("p-002", 2), itemSnap("p-009", 5), itemSnap("p-019", 3)],
    deliveryFee: 0,
    requestedAt: "2026-04-29T09:15:00+09:00",
    approvedAt:  "2026-04-29T10:30:00+09:00",
    shippedAt:   "2026-04-30T07:00:00+09:00",
    deliveredAt: "2026-04-30T11:50:00+09:00",
    desiredDeliveryDate: "2026-04-30",
  }),
  buildOrder({
    id: "o-003", orderNo: "FO-20260430-003",
    storeId: "st-dongtan", storeName: "동탄점",
    status: "delivered",
    items: [itemSnap("p-014", 1), itemSnap("p-006", 2), itemSnap("p-017", 5)],
    deliveryFee: 3000,
    requestedAt: "2026-04-30T08:00:00+09:00",
    approvedAt:  "2026-04-30T09:10:00+09:00",
    shippedAt:   "2026-05-01T07:00:00+09:00",
    deliveredAt: "2026-05-01T14:00:00+09:00",
    desiredDeliveryDate: "2026-05-01",
  }),
  buildOrder({
    id: "o-004", orderNo: "FO-20260501-004",
    storeId: "st-jungja", storeName: "정자점",
    status: "delivered",
    items: [itemSnap("p-003", 3), itemSnap("p-018", 5)],
    deliveryFee: 0,
    requestedAt: "2026-05-01T10:20:00+09:00",
    approvedAt:  "2026-05-01T11:00:00+09:00",
    shippedAt:   "2026-05-02T07:00:00+09:00",
    deliveredAt: "2026-05-02T12:30:00+09:00",
    desiredDeliveryDate: "2026-05-02",
  }),
  buildOrder({
    id: "o-005", orderNo: "FO-20260502-005",
    storeId: "st-geumgok", storeName: "금곡점",
    status: "shipping",
    items: [itemSnap("p-001", 2), itemSnap("p-010", 2), itemSnap("p-015", 1)],
    deliveryFee: 0,
    requestedAt: "2026-05-02T09:00:00+09:00",
    approvedAt:  "2026-05-02T10:30:00+09:00",
    shippedAt:   "2026-05-03T07:30:00+09:00",
    desiredDeliveryDate: "2026-05-04",
  }),
  buildOrder({
    id: "o-006", orderNo: "FO-20260503-006",
    storeId: "st-dongtan", storeName: "동탄점",
    status: "shipping",
    items: [itemSnap("p-007", 4), itemSnap("p-011", 2), itemSnap("p-016", 1)],
    deliveryFee: 3000,
    requestedAt: "2026-05-03T08:30:00+09:00",
    approvedAt:  "2026-05-03T09:45:00+09:00",
    shippedAt:   "2026-05-04T07:00:00+09:00",
    desiredDeliveryDate: "2026-05-04",
  }),
  buildOrder({
    id: "o-007", orderNo: "FO-20260503-007",
    storeId: "st-jungja", storeName: "정자점",
    status: "approved",
    items: [itemSnap("p-002", 3), itemSnap("p-008", 4), itemSnap("p-020", 1)],
    deliveryFee: 0,
    requestedAt: "2026-05-03T14:10:00+09:00",
    approvedAt:  "2026-05-03T15:00:00+09:00",
    desiredDeliveryDate: "2026-05-05",
  }),
  buildOrder({
    id: "o-008", orderNo: "FO-20260504-008",
    storeId: "st-geumgok", storeName: "금곡점",
    status: "approved",
    items: [itemSnap("p-005", 2), itemSnap("p-014", 1)],
    deliveryFee: 0,
    requestedAt: "2026-05-04T07:50:00+09:00",
    approvedAt:  "2026-05-04T09:00:00+09:00",
    desiredDeliveryDate: "2026-05-05",
  }),
  buildOrder({
    id: "o-009", orderNo: "FO-20260504-009",
    storeId: "st-dongtan", storeName: "동탄점",
    status: "requested",
    items: [itemSnap("p-004", 3), itemSnap("p-009", 4), itemSnap("p-017", 5)],
    deliveryFee: 3000,
    requestedAt: "2026-05-04T09:30:00+09:00",
    desiredDeliveryDate: "2026-05-06",
    memo: "오전 11시 이전 도착 부탁드립니다.",
  }),
  buildOrder({
    id: "o-010", orderNo: "FO-20260427-010",
    storeId: "st-jungja", storeName: "정자점",
    status: "cancelled",
    items: [itemSnap("p-012", 1)],
    deliveryFee: 0,
    requestedAt: "2026-04-27T11:00:00+09:00",
    cancelledAt: "2026-04-27T13:00:00+09:00",
    memo: "품절로 취소",
  }),
];

// ───────── 결제 ─────────

export const payments: Payment[] = orders
  .filter((o) => o.status !== "cancelled" && o.status !== "requested")
  .map((o, idx) => ({
    id: `pay-${String(idx + 1).padStart(3, "0")}`,
    orderId: o.id,
    storeId: o.storeId,
    method: idx % 2 === 0 ? "transfer" : "credit",
    amount: o.total,
    status: o.status === "delivered" ? "paid" : "pending",
    paidAt: o.status === "delivered" ? o.deliveredAt : undefined,
    createdAt: o.requestedAt,
  }));

// ───────── 정산 (최근 4개월) ─────────

const monthLabels = ["2026-01", "2026-02", "2026-03", "2026-04"];

export const settlements: Settlement[] = stores.flatMap((store, sIdx) =>
  monthLabels.map((period, mIdx) => {
    const base = 1_850_000 + sIdx * 320_000 + mIdx * 140_000;
    const totalOrderAmount = base;
    const totalPaidAmount = mIdx === 3 ? base - 180_000 : base;
    return {
      id: `set-${store.id}-${period}`,
      storeId: store.id,
      storeName: store.name,
      period,
      totalOrderAmount,
      totalPaidAmount,
      outstanding: totalOrderAmount - totalPaidAmount,
      orderCount: 8 + sIdx + mIdx,
      generatedAt: `${period}-30T23:59:59+09:00`,
    } satisfies Settlement;
  }),
);

// ───────── 재고 (부족/주의/충분 섞어서) ─────────

export const inventory: Inventory[] = [
  { id: "inv-001", storeId: "st-jungja",  productId: "p-001", productName: "떡볶이 양념소스", qty: 1,  safetyQty: 3, status: "shortage",   updatedAt: "2026-05-04T08:00:00+09:00" },
  { id: "inv-002", storeId: "st-jungja",  productId: "p-005", productName: "고운 고춧가루(국산)", qty: 2, safetyQty: 2, status: "warning",   updatedAt: "2026-05-04T08:00:00+09:00" },
  { id: "inv-003", storeId: "st-jungja",  productId: "p-013", productName: "프리미엄 깍두기", qty: 5, safetyQty: 2, status: "sufficient", updatedAt: "2026-05-04T08:00:00+09:00" },
  { id: "inv-004", storeId: "st-jungja",  productId: "p-019", productName: "위생장갑", qty: 1, safetyQty: 3, status: "shortage", updatedAt: "2026-05-04T08:00:00+09:00" },

  { id: "inv-005", storeId: "st-geumgok", productId: "p-002", productName: "짜장소스", qty: 4, safetyQty: 2, status: "sufficient", updatedAt: "2026-05-04T08:00:00+09:00" },
  { id: "inv-006", storeId: "st-geumgok", productId: "p-009", productName: "생우동면", qty: 2, safetyQty: 3, status: "warning", updatedAt: "2026-05-04T08:00:00+09:00" },
  { id: "inv-007", storeId: "st-geumgok", productId: "p-014", productName: "포기 배추김치", qty: 0, safetyQty: 1, status: "shortage", updatedAt: "2026-05-04T08:00:00+09:00" },
  { id: "inv-008", storeId: "st-geumgok", productId: "p-017", productName: "일회용 포장용기 500ml", qty: 12, safetyQty: 5, status: "sufficient", updatedAt: "2026-05-04T08:00:00+09:00" },

  { id: "inv-009", storeId: "st-dongtan", productId: "p-001", productName: "떡볶이 양념소스", qty: 3, safetyQty: 2, status: "sufficient", updatedAt: "2026-05-04T08:00:00+09:00" },
  { id: "inv-010", storeId: "st-dongtan", productId: "p-006", productName: "굵은 고춧가루(국산)", qty: 1, safetyQty: 2, status: "warning", updatedAt: "2026-05-04T08:00:00+09:00" },
  { id: "inv-011", storeId: "st-dongtan", productId: "p-011", productName: "부침가루", qty: 6, safetyQty: 2, status: "sufficient", updatedAt: "2026-05-04T08:00:00+09:00" },
  { id: "inv-012", storeId: "st-dongtan", productId: "p-016", productName: "백김치", qty: 0, safetyQty: 1, status: "shortage", updatedAt: "2026-05-04T08:00:00+09:00" },
];

// ───────── 즐겨찾기 ─────────

export const favorites: Favorite[] = [
  { id: "fav-001", userId: "u-owner-1", productId: "p-001", createdAt: "2026-04-01T09:00:00+09:00" },
  { id: "fav-002", userId: "u-owner-1", productId: "p-005", createdAt: "2026-04-01T09:00:00+09:00" },
  { id: "fav-003", userId: "u-owner-1", productId: "p-013", createdAt: "2026-04-01T09:00:00+09:00" },
  { id: "fav-004", userId: "u-owner-2", productId: "p-002", createdAt: "2026-04-12T09:00:00+09:00" },
  { id: "fav-005", userId: "u-owner-2", productId: "p-009", createdAt: "2026-04-12T09:00:00+09:00" },
  { id: "fav-006", userId: "u-owner-3", productId: "p-014", createdAt: "2026-04-22T09:00:00+09:00" },
];

// ───────── 게시판 ─────────

export const posts: Post[] = [
  {
    id: "post-001",
    type: "notice",
    title: "[공지] 5월 가정의달 발주 마감 시간 안내",
    content:
      "5월 5일 어린이날, 8일 어버이날 전후 발주가 집중되어 마감 시간을 평소보다 1시간 앞당깁니다. 일정 확인 부탁드립니다.",
    authorId: "u-admin-1",
    authorName: "본사 운영팀",
    pinned: true,
    views: 142,
    createdAt: "2026-04-25T10:00:00+09:00",
  },
  {
    id: "post-002",
    type: "notice",
    title: "[공지] 신상품 '오리지널 핫소스' 출시",
    content:
      "5월부터 핫소스 단일 카테고리 신제품이 추가됩니다. 카테고리 > 소스류에서 확인하실 수 있습니다.",
    authorId: "u-admin-1",
    authorName: "본사 운영팀",
    views: 88,
    createdAt: "2026-04-30T11:00:00+09:00",
  },
  {
    id: "post-003",
    type: "qna",
    title: "정산서 PDF 다운로드 위치가 어디인가요?",
    content: "지난 달 정산 내역을 PDF로 받고 싶은데, 어디서 받을 수 있나요?",
    authorId: "u-owner-1",
    authorName: "김지훈",
    views: 23,
    createdAt: "2026-05-02T14:00:00+09:00",
  },
  {
    id: "post-004",
    type: "qna",
    title: "발주 후 수량 변경이 가능한가요?",
    content: "오늘 아침 발주를 넣었는데 수량을 줄일 수 있을까요? 아직 승인 전 상태입니다.",
    authorId: "u-owner-2",
    authorName: "박서연",
    views: 17,
    createdAt: "2026-05-03T09:30:00+09:00",
  },
  {
    id: "post-005",
    type: "suggestion",
    title: "즐겨찾기에서 바로 발주할 수 있도록 해주세요",
    content:
      "매주 같은 품목을 반복해서 발주하다 보니 즐겨찾기 화면에서 한 번에 장바구니로 넣는 기능이 있으면 좋겠습니다.",
    authorId: "u-owner-3",
    authorName: "이도현",
    views: 31,
    createdAt: "2026-05-03T18:20:00+09:00",
  },
];

export const comments: Comment[] = [
  {
    id: "cmt-001",
    postId: "post-003",
    authorId: "u-admin-1",
    authorName: "본사 운영팀",
    content: "정산 메뉴 > 월별 정산 상세 화면 우측 상단 'PDF 다운로드' 버튼에서 받으실 수 있습니다.",
    createdAt: "2026-05-02T15:30:00+09:00",
  },
  {
    id: "cmt-002",
    postId: "post-004",
    authorId: "u-admin-1",
    authorName: "본사 운영팀",
    content: "승인 전이라면 발주 상세에서 직접 수정 가능합니다. 승인 후에는 운영팀으로 연락 부탁드립니다.",
    createdAt: "2026-05-03T10:10:00+09:00",
  },
  {
    id: "cmt-003",
    postId: "post-005",
    authorId: "u-admin-1",
    authorName: "본사 운영팀",
    content: "감사합니다. 다음 릴리즈 후보로 검토하겠습니다.",
    createdAt: "2026-05-04T09:00:00+09:00",
  },
];

// ───────── 알림 ─────────

export const notifications: Notification[] = [
  {
    id: "n-001",
    userId: "u-owner-1",
    type: "order",
    title: "발주가 승인되었습니다",
    body: "FO-20260503-007 발주가 승인되어 출고 준비 중입니다.",
    link: "/orders/o-007",
    read: false,
    createdAt: "2026-05-03T15:00:00+09:00",
  },
  {
    id: "n-002",
    userId: "u-owner-2",
    type: "order",
    title: "배송이 시작되었습니다",
    body: "FO-20260502-005 발주가 배송 중입니다. 오늘 도착 예정입니다.",
    link: "/orders/o-005",
    read: false,
    createdAt: "2026-05-03T07:30:00+09:00",
  },
  {
    id: "n-003",
    userId: "u-owner-3",
    type: "inventory",
    title: "재고 부족 알림",
    body: "백김치 재고가 0개로 안전 재고 미만입니다.",
    link: "/inventory",
    read: false,
    createdAt: "2026-05-04T08:05:00+09:00",
  },
  {
    id: "n-004",
    userId: "u-owner-1",
    type: "settlement",
    title: "4월 정산서가 발행되었습니다",
    body: "정자점 4월 정산 내역을 확인해주세요.",
    link: "/settlements/2026-04",
    read: true,
    createdAt: "2026-05-01T10:00:00+09:00",
  },
  {
    id: "n-005",
    userId: "u-admin-1",
    type: "post",
    title: "신규 건의 글이 등록되었습니다",
    body: "이도현(동탄점) 님이 건의 글을 작성했습니다.",
    link: "/board/post-005",
    read: false,
    createdAt: "2026-05-03T18:21:00+09:00",
  },
];
