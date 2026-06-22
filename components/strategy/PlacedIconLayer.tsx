"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { PlacedStrategyIcon, StrategyIconKey } from "@/lib/strategy/china-strategy-summary";
import { STRATEGY_ICON_OPTIONS, StrategySubmoduleIcon } from "@/components/strategy/china-strategy-icons";

const SELECTABLE_ICONS = STRATEGY_ICON_OPTIONS.filter((o) => o.id !== "none");
const DEFAULT_SIZE = 28;
const MIN_SIZE = 14;
const MAX_SIZE = 72;

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function newIconId() {
  return `pi-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function PlacedIconItem({
  item,
  editable,
  selected,
  onSelect,
  onChange,
  onRemove,
}: {
  item: PlacedStrategyIcon;
  editable: boolean;
  selected: boolean;
  onSelect: () => void;
  onChange: (next: PlacedStrategyIcon) => void;
  onRemove: () => void;
}) {
  const drag = useRef<{ mode: "move" | "resize"; startX: number; startY: number; base: PlacedStrategyIcon } | null>(
    null
  );

  function pctFromEvent(e: ReactPointerEvent, slide: HTMLElement) {
    const r = slide.getBoundingClientRect();
    return {
      xPct: clamp(((e.clientX - r.left) / r.width) * 100, 0, 98),
      yPct: clamp(((e.clientY - r.top) / r.height) * 100, 0, 98),
    };
  }

  function onMovePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (!editable || e.button !== 0) return;
    e.stopPropagation();
    onSelect();
    drag.current = { mode: "move", startX: e.clientX, startY: e.clientY, base: item };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onResizePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (!editable || e.button !== 0) return;
    e.stopPropagation();
    onSelect();
    drag.current = { mode: "resize", startX: e.clientX, startY: e.clientY, base: item };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d) return;
    const slide = e.currentTarget.closest(".china-strategy-one-pager") as HTMLElement | null;
    if (!slide) return;

    if (d.mode === "move") {
      const { xPct, yPct } = pctFromEvent(e, slide);
      onChange({ ...d.base, xPct, yPct });
      return;
    }

    const delta = (e.clientX - d.startX + (e.clientY - d.startY)) / 2;
    onChange({ ...d.base, sizePx: clamp(Math.round(d.base.sizePx + delta), MIN_SIZE, MAX_SIZE) });
  }

  function onPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    drag.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  }

  return (
    <div
      className={`ppt-placed-icon ${selected ? "ppt-placed-icon--selected" : ""} ${editable ? "ppt-placed-icon--editable" : ""}`}
      style={{ left: `${item.xPct}%`, top: `${item.yPct}%`, width: item.sizePx, height: item.sizePx }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <div
        className="ppt-placed-icon__body"
        onPointerDown={onMovePointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <StrategySubmoduleIcon id={item.icon} sizePx={item.sizePx} />
      </div>
      {editable && selected ? (
        <>
          <div
            className="ppt-placed-icon__resize"
            aria-label="调整大小"
            onPointerDown={onResizePointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          />
          <button type="button" className="ppt-placed-icon__remove print:hidden" aria-label="删除图标" onClick={onRemove}>
            ×
          </button>
        </>
      ) : null}
    </div>
  );
}

export function PlacedIconLayer({
  icons,
  editable,
  onChange,
}: {
  icons: PlacedStrategyIcon[];
  editable: boolean;
  onChange: (icons: PlacedStrategyIcon[]) => void;
}) {
  const [collapsed, setCollapsed] = useState(true);
  const [pick, setPick] = useState<StrategyIconKey>("invest");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const paletteDrag = useRef<{ icon: StrategyIconKey } | null>(null);

  const updateIcon = useCallback(
    (id: string, next: PlacedStrategyIcon) => {
      onChange(icons.map((i) => (i.id === id ? next : i)));
    },
    [icons, onChange]
  );

  const removeIcon = useCallback(
    (id: string) => {
      onChange(icons.filter((i) => i.id !== id));
      setSelectedId((cur) => (cur === id ? null : cur));
    },
    [icons, onChange]
  );

  function addIconAt(icon: StrategyIconKey, xPct: number, yPct: number) {
    if (icon === "none") return;
    const placed: PlacedStrategyIcon = {
      id: newIconId(),
      icon,
      xPct,
      yPct,
      sizePx: DEFAULT_SIZE,
    };
    onChange([...icons, placed]);
    setSelectedId(placed.id);
  }

  function onPaletteChipDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (!editable || e.button !== 0) return;
    paletteDrag.current = { icon: pick };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPaletteChipMove(_e: ReactPointerEvent<HTMLDivElement>) {
    if (!paletteDrag.current) return;
  }

  function onPaletteChipUp(e: ReactPointerEvent<HTMLDivElement>) {
    const d = paletteDrag.current;
    if (!d) return;
    paletteDrag.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);

    const slide = e.currentTarget.closest(".china-strategy-one-pager") as HTMLElement | null;
    if (!slide) return;
    const r = slide.getBoundingClientRect();
    const inside =
      e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (!inside) return;

    const xPct = clamp(((e.clientX - r.left) / r.width) * 100, 0, 98);
    const yPct = clamp(((e.clientY - r.top) / r.height) * 100, 0, 98);
    addIconAt(d.icon, xPct, yPct);
  }

  useEffect(() => {
    if (!editable) return;
    function onKey(e: KeyboardEvent) {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        const t = e.target as HTMLElement;
        if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT") return;
        removeIcon(selectedId);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editable, selectedId, removeIcon]);

  return (
    <>
      <div
        className="ppt-placed-icons-layer print:block"
        onPointerDown={() => editable && setSelectedId(null)}
        aria-hidden={icons.length === 0 && !editable}
      >
        {icons.map((item) => (
          <PlacedIconItem
            key={item.id}
            item={item}
            editable={editable}
            selected={selectedId === item.id}
            onSelect={() => setSelectedId(item.id)}
            onChange={(next) => updateIcon(item.id, next)}
            onRemove={() => removeIcon(item.id)}
          />
        ))}
      </div>

      {editable ? (
        <div className={`ppt-icon-palette print:hidden ${collapsed ? "ppt-icon-palette--collapsed" : ""}`}>
          <button
            type="button"
            className="ppt-icon-palette__toggle"
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? "打开 Icon 工具" : "收起"}
          >
            Icon
          </button>
          {!collapsed ? (
            <div className="ppt-icon-palette__panel">
              <label className="ppt-icon-palette__label">
                选择
                <select
                  className="ppt-icon-palette__select"
                  value={pick}
                  onChange={(e) => setPick(e.target.value as StrategyIconKey)}
                >
                  {SELECTABLE_ICONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <div
                className="ppt-icon-palette__chip"
                title="按住拖到画布上的目标位置"
                onPointerDown={onPaletteChipDown}
                onPointerMove={onPaletteChipMove}
                onPointerUp={onPaletteChipUp}
                onPointerCancel={onPaletteChipUp}
              >
                <StrategySubmoduleIcon id={pick} sizePx={22} />
                <span>拖到画布</span>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
