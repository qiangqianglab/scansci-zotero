# scansci-pdf Zotero Helper

这是一个最小 Zotero 7 bootstrap 插件，不使用 webpack、React 或 TypeScript。

功能：

- 在 Zotero 文献右键菜单中增加“用 scansci-pdf 下载 PDF”
- 读取当前选中文献的 DOI
- 从插件设置读取 scansci-pdf 可执行文件路径和 PDF 下载目录
- 自动找到下载目录中的最新 PDF
- 可选：将 PDF 作为附件挂载到当前文献
- 可选：已有 PDF 时跳过下载
- 可选：成功后给文献添加 `scansci-pdf` 标签
- 支持多选文献批量下载，逐篇执行并统计成功、失败、跳过数量

## 设置

安装后打开 Zotero 设置，在左侧选择 `scansci-pdf`。

可配置：

- scansci-pdf 可执行文件路径
- PDF 下载目录
- 是否自动挂载 PDF
- 是否跳过已有 PDF
- 是否自动添加 tag
- 批量下载间隔秒数，默认 `20`

## 安装 scansci-pdf

本插件依赖外部命令行工具 `scansci-pdf`。插件默认读取：

```text
~/.local/bin/scansci-pdf
```

推荐使用 `uv tool` 安装：

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
uv tool install scansci-pdf
uv tool update-shell
```

如果需要直接从 GitHub 安装最新代码：

```bash
uv tool install git+https://github.com/Rimagination/scansci-pdf.git
```

也可以使用 `pipx`：

```bash
pipx install scansci-pdf
```

安装后检查：

```bash
scansci-pdf --help
scansci-pdf check
```

如果命令不在 `~/.local/bin/scansci-pdf`，请在 Zotero 的 `scansci-pdf` 设置页中修改“scansci-pdf 可执行文件路径”。

## 构建

```bash
./build.sh
```

构建完成后会在当前目录生成：

```text
scansci.xpi
```

## 版本管理

版本号统一维护在 `VERSION` 文件中。

发布新版本时：

1. 修改 `VERSION`
2. 更新 `CHANGELOG.md`
3. 运行 `./build.sh`

`build.sh` 会自动同步 `manifest.json` 版本号，生成 `update.json`，并打包 `scansci.xpi`。

## 安装

1. 打开 Zotero
2. 进入 `Tools` → `Plugins`
3. 点击齿轮按钮
4. 选择 `Install Plugin From File`
5. 选择当前目录下的 `scansci.xpi`
6. 重启 Zotero

## 使用

在 Zotero 中右键一篇带 DOI 的文献，点击：

```text
用 scansci-pdf 下载 PDF
```

插件会下载 PDF 并自动挂载到该文献下。

也可以多选文献后右键执行同一菜单。批量模式下插件会逐篇下载；无 DOI 的文献会自动跳过；每篇之间会按设置等待一段时间。
