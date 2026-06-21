/**
 * Paloma China Strategy Summary — vector icons (no raster crops)
 * Reference: public/brand/china-strategy-reference.png (1024×665)
 */

import type { ReactNode } from "react";
import type { StrategyIconKey } from "@/lib/strategy/china-strategy-summary";

export const PPT = {
  border: "#808080",
  borderLight: "#9e9e9e",
  arrow: "#a6a6a6",
  text: "#000000",
  textBody: "#333333",
  textMuted: "#666666",
  footerTag: "#808080",
  invest: "#70ad47",
  innovate: "#5b9bd5",
  deliver: "#ed7d31",
  leaf: "#70ad47",
  globe: "#5b9bd5",
  channels: "#f4b183",
  talent: "#5b9bd5",
  coin: "#bf8f00",
  ringGray: "#d0d0d0",
  footerRed: "#c00000",
} as const;

export function FlowArrowLarge() {
  return (
    <div className="ppt-flow-arrow" aria-hidden>
      <svg viewBox="0 0 24 160" preserveAspectRatio="xMidYMid meet">
        <path
          fill="none"
          stroke={PPT.arrow}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 8 L16 80 L6 152 M16 80 H22"
        />
      </svg>
    </div>
  );
}

export function IconCart() {
  return (
    <svg viewBox="0 0 64 64" className="ppt-ico ppt-ico--md" aria-hidden>
      <g fill="none" stroke="#666" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 18h34l-4 22H18L12 18z" fill="#888" stroke="#666" />
        <circle cx="22" cy="48" r="3" fill="#666" stroke="none" />
        <circle cx="40" cy="48" r="3" fill="#666" stroke="none" />
        <path d="M8 14h8l3 8" />
      </g>
    </svg>
  );
}

export function IconPlus() {
  return (
    <svg viewBox="0 0 20 20" className="ppt-ico-plus" aria-hidden>
      <path fill="#888" d="M9 2h2v16H9zM2 9h16v2H2z" />
    </svg>
  );
}

export function IconPremiumCoin() {
  return (
    <svg viewBox="0 0 64 64" className="ppt-ico ppt-ico--md" aria-hidden>
      <defs>
        <radialGradient id="coinG" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#ffd966" />
          <stop offset="100%" stopColor={PPT.coin} />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="26" fill="url(#coinG)" stroke="#996515" strokeWidth="1" />
      <text x="32" y="40" textAnchor="middle" fill="#fff" fontSize="26" fontWeight="700" fontFamily="Arial">
        $
      </text>
    </svg>
  );
}

export function IconLeaf() {
  return (
    <svg viewBox="0 0 64 64" className="ppt-ico ppt-ico--md" aria-hidden>
      <circle cx="32" cy="32" r="28" fill="#fff" stroke={PPT.leaf} strokeWidth="2.5" />
      <path
        fill={PPT.leaf}
        d="M32 16c-10 5-15 12-15 19 0 5 4 9 15 9s15-4 15-9c0-7-5-14-15-19z"
      />
    </svg>
  );
}

export function IconExpertise() {
  return (
    <svg viewBox="0 0 72 72" className="ppt-ico ppt-ico--lg" aria-hidden>
      <ellipse cx="36" cy="48" rx="18" ry="20" fill="#404040" />
      <circle cx="36" cy="30" r="17" fill="#595959" />
      <path fill="#ffc000" d="M36 10l3 10h10.5l-8.5 6.5 3.5 10.5-9-6.5-9 6.5 3.5-10.5-8.5-6.5H33z" />
    </svg>
  );
}

export function IconGlobe() {
  return (
    <svg viewBox="0 0 72 72" className="ppt-ico ppt-ico--lg" aria-hidden>
      <circle cx="36" cy="36" r="28" fill={PPT.globe} />
      <ellipse cx="36" cy="36" rx="28" ry="11" fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.8" />
      <ellipse cx="36" cy="36" rx="11" ry="28" fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.8" />
      <path d="M8 36h56M36 8v56" stroke="#fff" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}

export function IconProductTech() {
  return (
    <svg viewBox="0 0 68 68" className="ppt-ico ppt-ico--badge" aria-hidden>
      <circle cx="34" cy="34" r="32" fill="#d9d9d9" stroke="#aaa" strokeWidth="1" />
      <rect x="16" y="24" width="12" height="22" rx="1" fill="#888" />
      <rect x="30" y="18" width="14" height="28" rx="1" fill="#666" />
      <rect x="33" y="22" width="8" height="6" rx="1" fill="#999" />
    </svg>
  );
}

export function IconChannels() {
  return (
    <svg viewBox="0 0 68 68" className="ppt-ico ppt-ico--badge" aria-hidden>
      <circle cx="34" cy="34" r="32" fill={PPT.channels} stroke="#d9966c" strokeWidth="1" />
      <circle cx="26" cy="28" r="6" fill="#fff" />
      <circle cx="42" cy="28" r="6" fill="#fff" />
      <path fill="#fff" d="M18 46c0-6 6-10 16-10s16 4 16 10v4H18v-4z" />
    </svg>
  );
}

export function IconTalent() {
  return (
    <svg viewBox="0 0 68 68" className="ppt-ico ppt-ico--badge" aria-hidden>
      <circle cx="34" cy="34" r="32" fill={PPT.talent} stroke="#4a86c7" strokeWidth="1" />
      <circle cx="34" cy="26" r="6" fill="#fff" />
      <path fill="#fff" d="M20 52c0-8 6-14 14-14s14 6 14 14" />
      <circle cx="18" cy="30" r="4.5" fill="#fff" opacity="0.9" />
      <circle cx="50" cy="30" r="4.5" fill="#fff" opacity="0.9" />
    </svg>
  );
}

type RingProps = { active: "invest" | "innovate" | "deliver" };

function wedge(cx: number, cy: number, r: number, start: number) {
  const rad = (d: number) => ((d - 90) * Math.PI) / 180;
  const x1 = cx + r * Math.cos(rad(start));
  const y1 = cy + r * Math.sin(rad(start));
  const x2 = cx + r * Math.cos(rad(start + 120));
  const y2 = cy + r * Math.sin(rad(start + 120));
  return `M${cx} ${cy} L${x1} ${y1} A${r} ${r} 0 0 1 ${x2} ${y2} Z`;
}

export function DoctrineRing({ active }: RingProps) {
  const cfg = {
    invest: { start: 210, color: PPT.invest, label: "INVEST" },
    innovate: { start: 330, color: PPT.innovate, label: "INNOVATE" },
    deliver: { start: 90, color: PPT.deliver, label: "DELIVER" },
  } as const;
  const keys = ["invest", "innovate", "deliver"] as const;

  return (
    <svg viewBox="0 0 64 64" className="ppt-ring" aria-hidden>
      <circle cx="32" cy="32" r="30" fill="#fff" stroke={PPT.borderLight} strokeWidth="0.75" />
      {keys.map((k) => (
        <path
          key={k}
          d={wedge(32, 32, 28, cfg[k].start)}
          fill={k === active ? cfg[k].color : PPT.ringGray}
          stroke="#fff"
          strokeWidth="1.25"
        />
      ))}
      <circle cx="32" cy="32" r="11" fill="#fff" />
      {keys.map((k) => {
        const a = ((cfg[k].start + 60 - 90) * Math.PI) / 180;
        return (
          <text
            key={`t-${k}`}
            x={32 + 19 * Math.cos(a)}
            y={32 + 19 * Math.sin(a)}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={k === active ? "#fff" : "#777"}
            fontSize={k === "innovate" ? 5 : 5.5}
            fontWeight="700"
            fontFamily="Arial,sans-serif"
          >
            {cfg[k].label}
          </text>
        );
      })}
    </svg>
  );
}

export function RhauttWordmark() {
  return <span className="ppt-brand">Rhautt</span>;
}

export const STRATEGY_ICON_OPTIONS: { id: StrategyIconKey; label: string }[] = [
  { id: "none", label: "无图标" },
  { id: "cart", label: "渠道/购物车" },
  { id: "premium", label: "高端/金币" },
  { id: "leaf", label: "绿色/节能" },
  { id: "expertise", label: "专业能力" },
  { id: "globe", label: "全球/区域" },
  { id: "product", label: "产品技术" },
  { id: "channels", label: "渠道合作" },
  { id: "talent", label: "人才组织" },
  { id: "chart", label: "BSC/图表" },
  { id: "finance", label: "财务" },
  { id: "target", label: "目标/份额" },
  { id: "invest", label: "Invest" },
  { id: "innovate", label: "Innovate" },
  { id: "deliver", label: "Deliver" },
];

export function IconChart() {
  return (
    <svg viewBox="0 0 64 64" className="ppt-ico ppt-ico--md" aria-hidden>
      <rect x="10" y="36" width="10" height="18" fill={PPT.innovate} rx="1" />
      <rect x="27" y="24" width="10" height="30" fill={PPT.invest} rx="1" />
      <rect x="44" y="14" width="10" height="40" fill={PPT.deliver} rx="1" />
      <path d="M8 54h48" stroke="#999" strokeWidth="1.5" />
    </svg>
  );
}

export function IconFinance() {
  return (
    <svg viewBox="0 0 64 64" className="ppt-ico ppt-ico--md" aria-hidden>
      <circle cx="32" cy="32" r="26" fill="#f3f4f6" stroke="#9ca3af" strokeWidth="1.5" />
      <text x="32" y="40" textAnchor="middle" fill="#374151" fontSize="28" fontWeight="700" fontFamily="Arial">
        ¥
      </text>
    </svg>
  );
}

export function IconTarget() {
  return (
    <svg viewBox="0 0 64 64" className="ppt-ico ppt-ico--md" aria-hidden>
      <circle cx="32" cy="32" r="26" fill="none" stroke={PPT.deliver} strokeWidth="2" />
      <circle cx="32" cy="32" r="16" fill="none" stroke={PPT.deliver} strokeWidth="2" />
      <circle cx="32" cy="32" r="5" fill={PPT.deliver} />
    </svg>
  );
}

export function StrategySubmoduleIcon({
  id,
  sizePx,
}: {
  id: StrategyIconKey;
  sizePx?: number;
  /** @deprecated use sizePx */
  inline?: boolean;
}) {
  const wrap = (node: ReactNode) => {
    if (!sizePx) return node;
    return (
      <span className="ppt-placed-icon-svg" style={{ width: sizePx, height: sizePx }}>
        {node}
      </span>
    );
  };

  switch (id) {
    case "cart":
      return wrap(<IconCart />);
    case "premium":
      return wrap(<IconPremiumCoin />);
    case "leaf":
      return wrap(<IconLeaf />);
    case "expertise":
      return wrap(<IconExpertise />);
    case "globe":
      return wrap(<IconGlobe />);
    case "product":
      return wrap(<IconProductTech />);
    case "channels":
      return wrap(<IconChannels />);
    case "talent":
      return wrap(<IconTalent />);
    case "chart":
      return wrap(<IconChart />);
    case "finance":
      return wrap(<IconFinance />);
    case "target":
      return wrap(<IconTarget />);
    case "invest":
      return wrap(<DoctrineRing active="invest" />);
    case "innovate":
      return wrap(<DoctrineRing active="innovate" />);
    case "deliver":
      return wrap(<DoctrineRing active="deliver" />);
    default:
      return null;
  }
}
