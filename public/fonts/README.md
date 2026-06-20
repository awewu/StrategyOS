# StratOS PDF 中文字体

服务端中文 PDF（`/api/print/panorama?lang=zh`）需要 **Noto Sans SC** 字体文件。

## 自动下载（推荐）

```bash
npm run fonts:fetch
```

脚本从 jsDelivr 拉取 Google Noto CJK **Subset OTF**（约 8 MB）到本目录：

- `NotoSansSC-Regular.otf`

## 手动安装

若 CI/内网无法访问 CDN，请手动放置以下任一文件：

| 文件名 | 说明 |
|--------|------|
| `NotoSansSC-Regular.otf` | Subset OTF（推荐，体积小） |
| `NotoSansSC-Regular.ttf` | 完整 TTF 亦可 |

来源：[googlefonts/noto-cjk](https://github.com/googlefonts/noto-cjk) → `Sans/SubsetOTF/SC/`

## 无字体时的行为

`lib/pdf/fonts.ts` 检测不到字体时，PDF 自动 **fallback 至 Helvetica 英文**，页脚注明：

> 中文字体未安装，运行 npm run fonts:fetch

`?lang=en` 可显式请求英文版。
