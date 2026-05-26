import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { api } from "@freshorder/shared";
import type { Category } from "@freshorder/shared";
import { PageHeader } from "../components/PageHeader";
import {
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
  Spinner,
} from "../components/States";
import { Modal } from "../components/Modal";
import { formatKRW } from "../lib/format";
import {
  EditIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
} from "../components/icons";

type ProductDraft = {
  id?: string;
  categoryId: string;
  name: string;
  unit: string;
  unitPrice: number;
  minOrderQty: number;
  isActive: boolean;
};

const empty = (categoryId: string): ProductDraft => ({
  categoryId,
  name: "",
  unit: "",
  unitPrice: 0,
  minOrderQty: 1,
  isActive: true,
});

export default function ProductsPage() {
  const qc = useQueryClient();
  const [activeCat, setActiveCat] = useState<string>("all");
  const [keyword, setKeyword] = useState("");
  const [editing, setEditing] = useState<ProductDraft | null>(null);
  const [catModal, setCatModal] = useState(false);

  const cats = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.getCategories(),
  });
  const products = useQuery({
    queryKey: ["products", "all"],
    queryFn: () => api.getProducts({ limit: 200 }),
  });

  const createOrUpdate = useMutation({
    mutationFn: (d: ProductDraft) => {
      const payload = {
        categoryId: d.categoryId,
        name: d.name,
        unit: d.unit,
        unitPrice: d.unitPrice,
        minOrderQty: d.minOrderQty,
        isActive: d.isActive,
      };
      return d.id ? api.updateProduct(d.id, payload) : api.createProduct(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      setEditing(null);
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.deleteProduct(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });

  const filtered = useMemo(() => {
    const list = products.data?.items ?? [];
    const kw = keyword.trim().toLowerCase();
    return list.filter((p) => {
      if (activeCat !== "all" && p.categoryId !== activeCat) return false;
      if (kw && !p.name.toLowerCase().includes(kw)) return false;
      return true;
    });
  }, [products.data, activeCat, keyword]);

  const catName = (id: string) =>
    (cats.data ?? []).find((c) => c.id === id)?.name ?? "-";

  return (
    <div className="space-y-5">
      <PageHeader
        title="품목 관리"
        subtitle="카테고리와 품목을 등록·수정합니다"
        action={
          <div className="flex gap-2">
            <button onClick={() => setCatModal(true)} className="btn-ghost">카테고리 관리</button>
            <button onClick={() => setEditing(empty((cats.data ?? [])[0]?.id ?? ""))} className="btn-primary">
              <PlusIcon width={16} height={16} className="mr-1" /> 품목 추가
            </button>
          </div>
        }
      />

      <section className="card flex flex-wrap items-center gap-3 p-4">
        <button
          className={clsx("rounded-full px-3 py-1.5 text-xs font-medium",
            activeCat === "all" ? "bg-primary text-white" : "bg-canvas text-ink-muted hover:text-ink")}
          onClick={() => setActiveCat("all")}
        >전체</button>
        {(cats.data ?? []).map((c) => (
          <button key={c.id}
            className={clsx("rounded-full px-3 py-1.5 text-xs font-medium",
              activeCat === c.id ? "bg-primary text-white" : "bg-canvas text-ink-muted hover:text-ink")}
            onClick={() => setActiveCat(c.id)}
          >{c.name}</button>
        ))}
        <div className="ml-auto relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" width={16} height={16} />
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="품목명 검색" className="input pl-9 w-64" />
        </div>
      </section>

      {products.isLoading || cats.isLoading ? (
        <LoadingBlock />
      ) : products.isError ? (
        <ErrorBlock onRetry={products.refetch} />
      ) : filtered.length === 0 ? (
        <EmptyBlock title="조건에 맞는 품목이 없습니다" />
      ) : (
        <section className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-canvas">
              <tr>
                <th className="th">품목명</th>
                <th className="th">카테고리</th>
                <th className="th">규격</th>
                <th className="th text-right">가격</th>
                <th className="th text-right">최소수량</th>
                <th className="th">상태</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t border-line">
                  <td className="td font-medium">{p.name}</td>
                  <td className="td text-ink-muted">{catName(p.categoryId)}</td>
                  <td className="td">{p.unit}</td>
                  <td className="td text-right font-semibold">{formatKRW(p.unitPrice)}</td>
                  <td className="td text-right">{p.minOrderQty}</td>
                  <td className="td">
                    <span className={clsx("chip", p.isActive ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-700")}>
                      {p.isActive ? "판매중" : "비활성"}
                    </span>
                  </td>
                  <td className="td">
                    <div className="flex justify-end gap-1.5">
                      <button className="btn-soft" onClick={() => setEditing({
                        id: p.id,
                        categoryId: p.categoryId,
                        name: p.name,
                        unit: p.unit,
                        unitPrice: p.unitPrice,
                        minOrderQty: p.minOrderQty,
                        isActive: p.isActive,
                      })}>
                        <EditIcon width={14} height={14} /> 수정
                      </button>
                      <button className="btn-danger" onClick={() => {
                        if (confirm(`'${p.name}' 품목을 삭제할까요?`)) remove.mutate(p.id);
                      }}>
                        <TrashIcon width={14} height={14} /> 삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <ProductEditor
        draft={editing}
        categories={cats.data ?? []}
        saving={createOrUpdate.isPending}
        onClose={() => setEditing(null)}
        onSave={(d) => createOrUpdate.mutate(d)}
      />

      <CategoryManager open={catModal} onClose={() => setCatModal(false)} categories={cats.data ?? []} />
    </div>
  );
}

function ProductEditor({
  draft, categories, saving, onClose, onSave,
}: {
  draft: ProductDraft | null;
  categories: Category[];
  saving: boolean;
  onClose: () => void;
  onSave: (d: ProductDraft) => void;
}) {
  return (
    <Modal open={!!draft} onClose={onClose} title={draft?.id ? "품목 수정" : "품목 추가"} width="max-w-xl">
      {draft && (
        <ProductForm key={draft.id ?? "new"} initial={draft} categories={categories} saving={saving} onCancel={onClose} onSave={onSave} />
      )}
    </Modal>
  );
}

function ProductForm({
  initial, categories, saving, onCancel, onSave,
}: {
  initial: ProductDraft;
  categories: Category[];
  saving: boolean;
  onCancel: () => void;
  onSave: (d: ProductDraft) => void;
}) {
  const [d, setD] = useState<ProductDraft>(initial);
  const update = (patch: Partial<ProductDraft>) => setD((s) => ({ ...s, ...patch }));
  const canSave = !!d.name.trim() && !!d.categoryId && !saving;
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">카테고리</label>
          <select className="input" value={d.categoryId} onChange={(e) => update({ categoryId: e.target.value })}>
            {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
          </select>
        </div>
        <div>
          <label className="label">상태</label>
          <select className="input" value={d.isActive ? "active" : "inactive"} onChange={(e) => update({ isActive: e.target.value === "active" })}>
            <option value="active">판매중</option>
            <option value="inactive">비활성</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="label">품목명</label>
          <input className="input" value={d.name} onChange={(e) => update({ name: e.target.value })} />
        </div>
        <div>
          <label className="label">규격</label>
          <input className="input" value={d.unit} onChange={(e) => update({ unit: e.target.value })} placeholder="예: 5kg" />
        </div>
        <div>
          <label className="label">가격(원)</label>
          <input type="number" className="input" value={d.unitPrice} onChange={(e) => update({ unitPrice: Number(e.target.value) })} />
        </div>
        <div>
          <label className="label">최소 주문 수량</label>
          <input type="number" className="input" value={d.minOrderQty} onChange={(e) => update({ minOrderQty: Number(e.target.value) })} />
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onCancel} className="btn-ghost">취소</button>
        <button disabled={!canSave} onClick={() => onSave(d)} className="btn-primary min-w-20">
          {saving ? <Spinner className="h-4 w-4 border-white" /> : "저장"}
        </button>
      </div>
    </>
  );
}

function CategoryManager({
  open, onClose, categories,
}: {
  open: boolean;
  onClose: () => void;
  categories: Category[];
}) {
  const qc = useQueryClient();
  const [name, setName] = useState("");

  const create = useMutation({
    mutationFn: () => api.createCategory({ name: name.trim() }),
    onSuccess: () => {
      setName("");
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
  });
  const rename = useMutation({
    mutationFn: (vars: { id: string; name: string }) => api.updateCategory(vars.id, { name: vars.name }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.deleteCategory(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });

  return (
    <Modal open={open} onClose={onClose} title="카테고리 관리"
      footer={<button onClick={onClose} className="btn-ghost">닫기</button>}
    >
      <div className="space-y-4">
        <div className="flex gap-2">
          <input className="input flex-1" placeholder="새 카테고리 이름" value={name} onChange={(e) => setName(e.target.value)} />
          <button disabled={!name.trim() || create.isPending} onClick={() => create.mutate()} className="btn-primary">추가</button>
        </div>
        <ul className="divide-y divide-line rounded-xl border border-line">
          {categories.map((c) => (
            <li key={c.id} className="flex items-center justify-between px-3 py-2">
              <input defaultValue={c.name} className="input mr-2 flex-1"
                onBlur={(e) => {
                  if (e.target.value.trim() && e.target.value !== c.name) {
                    rename.mutate({ id: c.id, name: e.target.value.trim() });
                  }
                }} />
              <button className="btn-danger" onClick={() => {
                if (confirm(`'${c.name}' 카테고리를 삭제할까요?`)) remove.mutate(c.id);
              }}>삭제</button>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
}
