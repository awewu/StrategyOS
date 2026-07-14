"use client";

import React, { useMemo } from "react";

/**
 * 行编辑器通用原语：useRowsEditor + RowTable + AddRowButton
 *
 * 消除表单巨石组件中重复的 set / addRow / removeRow 三件套与表格样板。
 * 适用于「表单对象中某个 key 是行数组」的受控编辑场景。
 */

export interface RowsEditor<T> {
  /** 更新第 idx 行的某个字段 */
  update: <F extends keyof T>(idx: number, field: F, value: T[F]) => void;
  /** 追加一行（可传部分字段覆盖空行模板） */
  add: (partial?: Partial<T>) => void;
  /** 删除第 idx 行 */
  remove: (idx: number) => void;
}

export function useRowsEditor<Form, T>(
  setForm: React.Dispatch<React.SetStateAction<Form>>,
  key: keyof Form & string,
  makeEmpty: () => T,
): RowsEditor<T> {
  return useMemo<RowsEditor<T>>(() => ({
    update(idx, field, value) {
      setForm((f) => {
        const rows = [...(f[key] as unknown as T[])];
        rows[idx] = { ...rows[idx], [field]: value };
        return { ...f, [key]: rows };
      });
    },
    add(partial) {
      setForm((f) => ({
        ...f,
        [key]: [...(f[key] as unknown as T[]), { ...makeEmpty(), ...partial }],
      }));
    },
    remove(idx) {
      setForm((f) => ({
        ...f,
        [key]: (f[key] as unknown as T[]).filter((_, i) => i !== idx),
      }));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [setForm, key]);
}

export interface RowTableColumn {
  label: string;
  align?: "left" | "center" | "right";
  className?: string;
  colSpan?: number;
}

/** 横向滚动表格外壳 + 统一表头；children 为 <tr> 行 */
export function RowTable({
  columns,
  extraHeadRow,
  children,
}: {
  columns: RowTableColumn[];
  /** 可选第二行表头（如季度数量/收入细分） */
  extraHeadRow?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-[var(--surface-border)] text-[var(--color-text-muted)]">
            {columns.map((c, i) => (
              <th
                key={i}
                colSpan={c.colSpan}
                className={
                  `px-2 py-1.5 text-${c.align ?? "left"} font-medium` +
                  (c.className ? " " + c.className : "")
                }
              >
                {c.label}
              </th>
            ))}
          </tr>
          {extraHeadRow}
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

/** 虚线「+ 新增」整宽按钮 */
export function AddRowButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded border border-dashed border-[var(--surface-border)] py-2 text-xs text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
    >
      + {label}
    </button>
  );
}

/** 行内删除按钮（红色 ×/删除） */
export function RemoveRowButton({ onClick, label = "×" }: { onClick: () => void; label?: string }) {
  return (
    <button onClick={onClick} className="text-xs text-[var(--signal-red)] hover:underline">
      {label}
    </button>
  );
}
