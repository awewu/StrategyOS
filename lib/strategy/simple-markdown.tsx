import type { ReactNode } from "react";

/** Minimal markdown: **bold**, - bullets, plain paragraphs. */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineFormat(text: string): string {
  return escapeHtml(text).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

export function renderSimpleMarkdown(text: string): ReactNode {
  const lines = text.split("\n");
  const nodes: ReactNode[] = [];
  let listItems: string[] = [];
  let key = 0;

  function flushList() {
    if (listItems.length === 0) return;
    nodes.push(
      <ul key={`ul-${key++}`} className="ppt-md-list">
        {listItems.map((item, i) => (
          <li key={i} dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
        ))}
      </ul>
    );
    listItems = [];
  }

  for (const raw of lines) {
    const line = raw.trimEnd();
    const bullet = line.match(/^[-·•]\s+(.*)$/);
    if (bullet) {
      listItems.push(bullet[1]);
      continue;
    }
    flushList();
    if (!line.trim()) {
      nodes.push(<br key={`br-${key++}`} />);
      continue;
    }
    nodes.push(
      <p
        key={`p-${key++}`}
        className="ppt-md-p"
        dangerouslySetInnerHTML={{ __html: inlineFormat(line) }}
      />
    );
  }
  flushList();
  return <>{nodes}</>;
}
