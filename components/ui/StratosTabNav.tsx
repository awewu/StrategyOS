import Link from "next/link";

export type StratosTabItem = {
  href: string;
  label: string;
  active?: boolean;
};

/** URL-based tab bar (finance, monitor, etc.) */
export function StratosTabNav({ tabs }: { tabs: StratosTabItem[] }) {
  return (
    <nav className="stratos-segment flex-wrap" aria-label="页面分区">
      {tabs.map((tab) =>
        tab.active ? (
          <span
            key={tab.href}
            className="stratos-segment__item stratos-segment__item--active"
            aria-current="page"
          >
            {tab.label}
          </span>
        ) : (
          <Link key={tab.href} href={tab.href} className="stratos-segment__item no-underline">
            {tab.label}
          </Link>
        ),
      )}
    </nav>
  );
}

/** Client button tabs */
export function StratosTabButtons({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="stratos-segment flex-wrap" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={`stratos-segment__item ${active === tab.id ? "stratos-segment__item--active" : ""}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
