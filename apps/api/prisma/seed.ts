/* eslint-disable no-console */
import {
  BoardType,
  NotificationChannel,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  PaymentType,
  PostStatus,
  PrismaClient,
  SettlementStatus,
  StoreStatus,
  UserRole,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const PASSWORD = 'password123';
const BCRYPT_SALT = 10;

async function clear() {
  // FK 의존성을 고려한 순서로 삭제
  await prisma.notification.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.productRequest.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.settlement.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.store.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  console.log('▶ seed start');
  await clear();

  const passwordHash = await bcrypt.hash(PASSWORD, BCRYPT_SALT);

  // ── Users ─────────────────────────────────────
  const admin = await prisma.user.create({
    data: {
      name: '본사 관리자',
      email: 'admin@freshorder.com',
      passwordHash,
      phone: '02-1234-5678',
      role: UserRole.ADMIN,
      isApproved: true,
    },
  });

  const owners = await Promise.all(
    [
      { name: '강남점주', email: 'gangnam@freshorder.com', phone: '010-1111-2222' },
      { name: '홍대점주', email: 'hongdae@freshorder.com', phone: '010-3333-4444' },
      { name: '신촌점주', email: 'sinchon@freshorder.com', phone: '010-5555-6666' },
    ].map((u) =>
      prisma.user.create({
        data: {
          ...u,
          passwordHash,
          role: UserRole.STORE_OWNER,
          inviteCode: `INV-${u.email.split('@')[0].toUpperCase()}`,
          isApproved: true,
        },
      }),
    ),
  );

  // ── Stores ────────────────────────────────────
  const storeMeta = [
    { storeName: '강남점', address: '서울 강남구 테헤란로 123', phone: '02-555-1111' },
    { storeName: '홍대점', address: '서울 마포구 양화로 45', phone: '02-555-2222' },
    { storeName: '신촌점', address: '서울 서대문구 신촌로 88', phone: '02-555-3333' },
  ];
  const stores = await Promise.all(
    storeMeta.map((s, i) =>
      prisma.store.create({
        data: { ...s, ownerId: owners[i].id, status: StoreStatus.ACTIVE },
      }),
    ),
  );
  const [gangnam, hongdae, sinchon] = stores;

  // ── Categories ────────────────────────────────
  const categoryNames = ['소스류', '양념류', '면/분말류', '김치류', '포장재'];
  const categories = await Promise.all(
    categoryNames.map((name, i) =>
      prisma.category.create({ data: { name, sortOrder: i + 1 } }),
    ),
  );

  // ── Products (4 per category) ─────────────────
  const productSeed: Record<string, { name: string; unit: string; unitPrice: number; minOrderQty: number }[]> = {
    소스류: [
      { name: '떡볶이 양념 소스', unit: '1kg', unitPrice: 8500, minOrderQty: 2 },
      { name: '매운 양념장', unit: '500g', unitPrice: 6500, minOrderQty: 2 },
      { name: '간장 베이스 소스', unit: '1L', unitPrice: 5500, minOrderQty: 1 },
      { name: '데리야끼 소스', unit: '1.8L', unitPrice: 12000, minOrderQty: 1 },
    ],
    양념류: [
      { name: '고춧가루', unit: '500g', unitPrice: 9500, minOrderQty: 1 },
      { name: '다진 마늘', unit: '1kg', unitPrice: 7500, minOrderQty: 1 },
      { name: '굵은 소금', unit: '1kg', unitPrice: 3500, minOrderQty: 2 },
      { name: '후추 가루', unit: '200g', unitPrice: 4500, minOrderQty: 1 },
    ],
    '면/분말류': [
      { name: '가래떡', unit: '1kg', unitPrice: 5500, minOrderQty: 5 },
      { name: '어묵', unit: '1kg', unitPrice: 6500, minOrderQty: 3 },
      { name: '우동면', unit: '1kg', unitPrice: 4500, minOrderQty: 2 },
      { name: '부침가루', unit: '1kg', unitPrice: 3500, minOrderQty: 2 },
    ],
    김치류: [
      { name: '포기김치', unit: '5kg', unitPrice: 28000, minOrderQty: 1 },
      { name: '깍두기', unit: '3kg', unitPrice: 18000, minOrderQty: 1 },
      { name: '총각김치', unit: '3kg', unitPrice: 22000, minOrderQty: 1 },
      { name: '열무김치', unit: '3kg', unitPrice: 16000, minOrderQty: 1 },
    ],
    포장재: [
      { name: '종이컵 (16oz)', unit: '100개', unitPrice: 4500, minOrderQty: 5 },
      { name: '비닐봉지', unit: '100매', unitPrice: 2500, minOrderQty: 10 },
      { name: '일회용 젓가락', unit: '100개', unitPrice: 2000, minOrderQty: 5 },
      { name: '포장 박스 (中)', unit: '50개', unitPrice: 8500, minOrderQty: 2 },
    ],
  };

  const products: { id: string; name: string; unitPrice: number; categoryName: string }[] = [];
  for (const cat of categories) {
    const list = productSeed[cat.name];
    for (const p of list) {
      const created = await prisma.product.create({
        data: { categoryId: cat.id, ...p },
      });
      products.push({ id: created.id, name: created.name, unitPrice: created.unitPrice, categoryName: cat.name });
    }
  }
  console.log(`  · products: ${products.length}`);

  // ── Orders (10) ───────────────────────────────
  // 분포: REQUESTED 2 / APPROVED 2 / SHIPPING 2 / DELIVERED 2 / SETTLED 2
  type OrderSpec = {
    status: OrderStatus;
    storeId: string;
    paymentType: PaymentType;
    items: { productId: string; quantity: number; unitPrice: number }[];
    daysAgo: number;
  };

  const pickProducts = (count: number) => {
    const shuffled = [...products].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  };

  const buildItems = (count: number) =>
    pickProducts(count).map((p) => ({
      productId: p.id,
      quantity: Math.floor(Math.random() * 5) + 2,
      unitPrice: p.unitPrice,
    }));

  const storeIds = [gangnam.id, hongdae.id, sinchon.id];
  const statuses: OrderStatus[] = [
    OrderStatus.REQUESTED, OrderStatus.REQUESTED,
    OrderStatus.APPROVED, OrderStatus.APPROVED,
    OrderStatus.SHIPPING, OrderStatus.SHIPPING,
    OrderStatus.DELIVERED, OrderStatus.DELIVERED,
    OrderStatus.SETTLED, OrderStatus.SETTLED,
  ];

  const orderSpecs: OrderSpec[] = statuses.map((status, i) => ({
    status,
    storeId: storeIds[i % storeIds.length],
    paymentType: i % 2 === 0 ? PaymentType.IMMEDIATE : PaymentType.MONTHLY,
    items: buildItems((i % 3) + 2), // 2~4개
    daysAgo: 30 - i * 3,
  }));

  const today = new Date();
  for (let i = 0; i < orderSpecs.length; i++) {
    const spec = orderSpecs[i];
    const requestedAt = new Date(today);
    requestedAt.setDate(today.getDate() - spec.daysAgo);

    const totalAmount = spec.items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
    const orderNumber = `ORD-${requestedAt.getFullYear()}${String(requestedAt.getMonth() + 1).padStart(2, '0')}${String(requestedAt.getDate()).padStart(2, '0')}-${String(i + 1).padStart(4, '0')}`;

    const approvedOrLater: OrderStatus[] = [
      OrderStatus.APPROVED,
      OrderStatus.SHIPPING,
      OrderStatus.DELIVERED,
      OrderStatus.SETTLED,
    ];
    const deliveredOrLater: OrderStatus[] = [OrderStatus.DELIVERED, OrderStatus.SETTLED];
    const isApprovedOrLater = approvedOrLater.includes(spec.status);
    const isDeliveredOrLater = deliveredOrLater.includes(spec.status);

    const approvedAt = isApprovedOrLater
      ? new Date(requestedAt.getTime() + 1000 * 60 * 60 * 6)
      : null;
    const deliveredAt = isDeliveredOrLater
      ? new Date(requestedAt.getTime() + 1000 * 60 * 60 * 24 * 2)
      : null;

    const order = await prisma.order.create({
      data: {
        storeId: spec.storeId,
        orderNumber,
        status: spec.status,
        totalAmount,
        paymentType: spec.paymentType,
        requestedAt,
        approvedAt,
        deliveredAt,
        orderItems: {
          create: spec.items.map((it) => ({
            productId: it.productId,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            subtotal: it.unitPrice * it.quantity,
          })),
        },
      },
    });

    // SETTLED 주문에는 결제 완료 레코드 생성
    if (spec.status === OrderStatus.SETTLED) {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          storeId: spec.storeId,
          amount: totalAmount,
          method: PaymentMethod.BANK_TRANSFER,
          status: PaymentStatus.COMPLETED,
          pgTransactionId: `TXN-${order.orderNumber}`,
          paidAt: deliveredAt ?? requestedAt,
        },
      });
    }
  }
  console.log(`  · orders: ${orderSpecs.length}`);

  // ── Inventory (강남점, 20개) ───────────────────
  // 부족 5 / 주의 3 / 충분 12
  const inventoryBuckets = {
    short: 5,
    warning: 3,
    enough: 12,
  };
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    let currentQty: number;
    let minQty: number;
    if (i < inventoryBuckets.short) {
      // 부족: current < min
      minQty = 20;
      currentQty = Math.floor(Math.random() * 10) + 1; // 1~10
    } else if (i < inventoryBuckets.short + inventoryBuckets.warning) {
      // 주의: current >= min, current <= min*1.5
      minQty = 20;
      currentQty = Math.floor(Math.random() * 10) + 20; // 20~29
    } else {
      // 충분
      minQty = 10;
      currentQty = Math.floor(Math.random() * 50) + 50; // 50~99
    }
    await prisma.inventory.create({
      data: { storeId: gangnam.id, productId: p.id, currentQty, minQty },
    });
  }
  console.log(`  · inventory(강남점): ${products.length}`);

  // ── Settlements (3 stores × 4 months) ─────────
  // 2026-01,02,03 → COMPLETED, 2026-04 → PENDING
  const months = [
    { year: 2026, month: 1, status: SettlementStatus.COMPLETED },
    { year: 2026, month: 2, status: SettlementStatus.COMPLETED },
    { year: 2026, month: 3, status: SettlementStatus.COMPLETED },
    { year: 2026, month: 4, status: SettlementStatus.PENDING },
  ];
  for (const store of stores) {
    for (const m of months) {
      const totalAmount = Math.floor(Math.random() * 2_000_000) + 1_500_000;
      const isCompleted = m.status === SettlementStatus.COMPLETED;
      const paidAmount = isCompleted ? totalAmount : 0;
      const unpaidAmount = totalAmount - paidAmount;
      const dueDate = new Date(Date.UTC(m.year, m.month, 10)); // 다음달 10일
      await prisma.settlement.create({
        data: {
          storeId: store.id,
          year: m.year,
          month: m.month,
          totalAmount,
          paidAmount,
          unpaidAmount,
          status: m.status,
          dueDate,
        },
      });
    }
  }
  console.log(`  · settlements: ${stores.length * months.length}`);

  // ── Posts ─────────────────────────────────────
  await prisma.post.createMany({
    data: [
      {
        authorId: admin.id,
        boardType: BoardType.NOTICE,
        title: '[공지] 5월 휴무일 안내',
        content: '5월 5일(어린이날)은 본사 발주가 불가합니다. 미리 발주 부탁드립니다.',
        status: PostStatus.PUBLISHED,
        isPinned: true,
      },
      {
        authorId: admin.id,
        boardType: BoardType.NOTICE,
        title: '[공지] 신메뉴 양념장 출시 안내',
        content: '6월부터 신규 매운 양념장 라인이 추가됩니다. 상세 카탈로그는 첨부 참고 바랍니다.',
        status: PostStatus.PUBLISHED,
      },
      {
        authorId: owners[0].id,
        boardType: BoardType.QNA,
        title: '발주 후 배송 일정 문의',
        content: '오늘 발주한 건이 언제쯤 도착하나요?',
        status: PostStatus.ANSWERED,
      },
      {
        authorId: owners[1].id,
        boardType: BoardType.QNA,
        title: '월정산 PDF 다운로드가 안 됩니다',
        content: '4월 정산 PDF가 빈 페이지로 다운로드됩니다. 확인 부탁드립니다.',
        status: PostStatus.PUBLISHED,
      },
      {
        authorId: owners[2].id,
        boardType: BoardType.SUGGESTION,
        title: '즐겨찾기 정렬 옵션 추가 건의',
        content: '카테고리별 정렬 외에 가나다순 정렬도 추가되면 좋겠습니다.',
        status: PostStatus.CONFIRMED,
      },
    ],
  });
  console.log('  · posts: 5');

  // ── Notifications (5) ─────────────────────────
  await prisma.notification.createMany({
    data: [
      {
        userId: owners[0].id,
        title: '발주 승인 완료',
        message: '4월 28일 발주 건이 승인되었습니다.',
        channel: NotificationChannel.PUSH,
        isRead: false,
      },
      {
        userId: owners[1].id,
        title: '배송 출발',
        message: '주문하신 상품이 배송 출발했습니다.',
        channel: NotificationChannel.ALIMTALK,
        isRead: false,
      },
      {
        userId: owners[2].id,
        title: '정산 안내',
        message: '4월 정산서가 발행되었습니다. 납부 기한 5월 10일.',
        channel: NotificationChannel.BOTH,
        isRead: true,
      },
      {
        userId: owners[0].id,
        title: '재고 부족 알림',
        message: '강남점 재고 부족 품목이 5개 있습니다.',
        channel: NotificationChannel.PUSH,
        isRead: false,
      },
      {
        userId: admin.id,
        title: '신규 발주 요청',
        message: '홍대점에서 신규 발주 요청이 도착했습니다.',
        channel: NotificationChannel.PUSH,
        isRead: false,
      },
    ],
  });
  console.log('  · notifications: 5');

  console.log('✓ seed done');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
