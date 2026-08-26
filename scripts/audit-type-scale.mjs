/** 一次性审计:抓取 dev 渲染产物,验证字阶 token 与 Tailwind utility 的实际编译值。 */
const res = await fetch("http://localhost:3003/command");
const html = await res.text();

// dev 下 CSS 可能内联在 <style> 或以 link 引入
const styles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
const links = [...html.matchAll(/href="(\/_next\/[^"]+\.css[^"]*)"/g)].map((m) => m[1]);
for (const l of [...new Set(links)]) {
  styles.push(await (await fetch(`http://localhost:3003${l}`)).text());
}
const css = styles.join("\n");
console.log(`style blocks: ${styles.length}, total css: ${(css.length / 1024).toFixed(0)}kb`);

const checks = [
  [/--type-page:\s*([^;]+)/, "--type-page", "1.375rem"],
  [/--type-section:\s*([^;]+)/, "--type-section", "1.0625rem"],
  [/--type-subsection:\s*([^;]+)/, "--type-subsection", ".9375rem"],
  [/--type-kpi-hero:\s*([^;]+)/, "--type-kpi-hero", "1.75rem"],
  [/\.text-xl\s*\{([^}]+)/, ".text-xl", "--type-section"],
  [/\.text-2xl\s*\{([^}]+)/, ".text-2xl", "--type-kpi"],
  [/\.text-3xl\s*\{([^}]+)/, ".text-3xl", "--type-kpi-hero"],
  [/\.text-headline\s*\{([^}]+)/, ".text-headline", "--type-page"],
  // 信号色必须是 BRAND_VI §3.3 定稿（Ruud 哑光），不得为 Tandem 亮色板
  [/--signal-green:\s*([^;]+)/, "--signal-green", "#1f8a45"],
  [/--signal-yellow:\s*([^;]+)/, "--signal-yellow", "#b45309"],
  [/--signal-red:\s*([^;]+)/, "--signal-red", "#8b0e04"],
  [/--signal-green-text:\s*([^;]+)/, "--signal-green-text", "var(--signal-green)"],
];
let fail = 0;
for (const [re, name, expect] of checks) {
  const m = css.match(re);
  const got = m ? m[1].trim().replace(/\s+/g, " ").slice(0, 90) : "(NOT FOUND)";
  const ok = m && got.includes(expect);
  if (!ok) fail++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name} => ${got}`);
}
process.exit(fail ? 1 : 0);
