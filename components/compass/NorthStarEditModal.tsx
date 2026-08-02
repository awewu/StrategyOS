"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/primitives";
import type { NorthStar } from "@/lib/compass/types";

export interface NorthStarForm {
  mission: string;
  vision: string;
  targetYear: number;
  revenueTarget: number;
  profitMarginTarget: number;
  marketPositionDesc: string | null;
  geographyDesc: string | null;
  brandDesc: string | null;
}

export function NorthStarEditModal({
  northStar,
  saving,
  onClose,
  onSave,
}: {
  northStar: NorthStar | null;
  saving: boolean;
  onClose: () => void;
  onSave: (data: NorthStarForm) => void;
}) {
  const currentYear = new Date().getFullYear();
  const [form, setForm] = useState<NorthStarForm>({
    mission: northStar?.mission ?? "",
    vision: northStar?.vision ?? "",
    targetYear: northStar?.targetYear ?? currentYear + 5,
    revenueTarget: northStar?.revenueTarget ?? 0,
    profitMarginTarget: northStar?.profitMarginTarget ?? 0,
    marketPositionDesc: northStar?.marketPositionDesc ?? null,
    geographyDesc: northStar?.geographyDesc ?? null,
    brandDesc: northStar?.brandDesc ?? null,
  });
  const hasText = Boolean(form.mission.trim() && form.vision.trim());
  const hasMetrics = form.targetYear > currentYear && form.revenueTarget > 0;
  const valid = northStar ? hasText : hasText && hasMetrics;
  const validationHint = !hasText
    ? "请填写使命与愿景"
    : !northStar && !hasMetrics
      ? "首次录入还需填写目标年（大于今年）与终点营收"
      : null;

  return (
    <Modal onClose={onClose} size="lg" title={northStar ? "编辑使命愿景" : "录入使命愿景"} subtitle="5 年终极方向；与战略罗盘同源，保存后两处同步更新。">
        <div className="space-y-3">
          <div>
            <label className="label-xs">使命 · 为何存在</label>
            <Textarea
              rows={2}
              fullWidth
              value={form.mission}
              onChange={(e) => setForm((f) => ({ ...f, mission: e.target.value }))}
              placeholder="如：让每个中国家庭和建筑用上高效、可靠的热能系统"
            />
          </div>
          <div>
            <label className="label-xs">愿景 · 终点形态</label>
            <Textarea
              rows={2}
              fullWidth
              value={form.vision}
              onChange={(e) => setForm((f) => ({ ...f, vision: e.target.value }))}
              placeholder="如：2030 年成为中国热泵与热水领域综合竞争力第一的民营品牌集团"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label-xs">目标年</label>
              <Input
                type="number"
                inputSize="sm"
                fullWidth
                value={form.targetYear}
                onChange={(e) => setForm((f) => ({ ...f, targetYear: +e.target.value }))}
              />
            </div>
            <div>
              <label className="label-xs">终点营收（万元）</label>
              <Input
                type="number"
                inputSize="sm"
                fullWidth
                value={form.revenueTarget}
                onChange={(e) => setForm((f) => ({ ...f, revenueTarget: +e.target.value }))}
              />
            </div>
            <div>
              <label className="label-xs">目标利润率 {Math.round(form.profitMarginTarget * 100)}%</label>
              <input
                type="range"
                min={0}
                max={50}
                value={Math.round(form.profitMarginTarget * 100)}
                onChange={(e) => setForm((f) => ({ ...f, profitMarginTarget: +e.target.value / 100 }))}
                className="mt-2 w-full accent-[var(--color-accent)]"
              />
            </div>
          </div>
          <Input
            fullWidth
            inputSize="sm"
            value={form.marketPositionDesc ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, marketPositionDesc: e.target.value || null }))}
            placeholder="市场地位（可选）"
          />
          <Input
            fullWidth
            inputSize="sm"
            value={form.geographyDesc ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, geographyDesc: e.target.value || null }))}
            placeholder="地理覆盖（可选）"
          />
          <Input
            fullWidth
            inputSize="sm"
            value={form.brandDesc ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, brandDesc: e.target.value || null }))}
            placeholder="品牌格局（可选）"
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          {validationHint ? (
            <p className="mr-auto text-caption text-[var(--signal-red)]">{validationHint}</p>
          ) : null}
          <button type="button" onClick={onClose} className="stratos-btn stratos-btn--ghost">
            取消
          </button>
          <button
            type="button"
            disabled={saving || !valid}
            onClick={() => onSave(form)}
            className="stratos-btn stratos-btn--primary"
          >
            {saving ? "保存中…" : "保存"}
          </button>
        </div>
    </Modal>
  );
}

export async function saveNorthStarToApi(
  form: NorthStarForm,
  northStar: NorthStar | null,
): Promise<{ id: string }> {
  const persisted = northStar?.id && !northStar.id.startsWith("demo");
  const res = await fetch("/api/compass/northstar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(persisted ? { ...form, id: northStar!.id } : form),
  });
  const json = (await res.json()) as { id?: string; error?: string };
  if (!res.ok) throw new Error(json.error ?? "保存失败");
  if (!json.id) throw new Error("保存失败");
  return { id: json.id };
}
