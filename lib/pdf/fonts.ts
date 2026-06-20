import fs from "fs";
import path from "path";

const FONT_CANDIDATES = [
  path.join(process.cwd(), "public/fonts/NotoSansSC-Regular.otf"),
  path.join(process.cwd(), "public/fonts/NotoSansSC-Regular.ttf"),
];

export function chineseFontAvailable(): boolean {
  return FONT_CANDIDATES.some((p) => {
    try {
      return fs.existsSync(p);
    } catch {
      return false;
    }
  });
}

export function resolvePdfFonts(preferChinese = true): {
  regular: string;
  useChinese: boolean;
} {
  if (preferChinese) {
    for (const p of FONT_CANDIDATES) {
      if (fs.existsSync(p)) {
        return { regular: p, useChinese: true };
      }
    }
  }
  return { regular: "Helvetica", useChinese: false };
}
