
scansci-pdf Zotero Helper

中文￼ | English￼

⸻

中文说明

scansci-pdf Zotero Helper 是一个适用于 Zotero 7 的轻量级插件。

它可以直接在 Zotero 中调用 scansci-pdf，自动下载 PDF，并挂载到当前文献条目。

无需 webpack、React 或 TypeScript，结构简单，便于二次开发。

⸻

功能特点

* 在 Zotero 文献右键菜单中增加：
    用 scansci-pdf 下载 PDF
* 自动读取当前文献 DOI
* 调用本地 scansci-pdf 下载 PDF
* 自动检测下载目录中的最新 PDF
* 自动将 PDF 附加到当前文献（可选）
* 已存在 PDF 时自动跳过（可选）
* 下载成功后自动添加 scansci-pdf 标签（可选）
* 支持多选文献批量下载
* 支持下载间隔控制，降低请求频率

⸻

插件设置

安装后：

Zotero → Settings → scansci-pdf

可配置：

* scansci-pdf 可执行文件路径
* PDF 下载目录
* 自动挂载 PDF
* 跳过已有 PDF
* 自动添加标签
* 批量下载间隔（秒）

默认间隔：

20 秒

⸻

安装 scansci-pdf

本插件依赖外部命令行工具：

scansci-pdf

默认路径：

~/.local/bin/scansci-pdf

推荐使用 uv 安装：

curl -LsSf https://astral.sh/uv/install.sh | sh
uv tool install scansci-pdf
uv tool update-shell

安装 GitHub 最新版本：

uv tool install git+https://github.com/Rimagination/scansci-pdf.git

也可使用：

pipx install scansci-pdf

安装完成后测试：

scansci-pdf --help
scansci-pdf check

如果路径不同，请在 Zotero 设置页中修改。

⸻

构建插件

./build.sh

构建后生成：

scansci.xpi

⸻

安装插件

1. 打开 Zotero
2. 进入：
    Tools → Plugins
3. 点击右上角齿轮按钮
4. 选择：
    Install Plugin From File
5. 选择：
    scansci.xpi
6. 重启 Zotero

⸻

使用方法

右键带 DOI 的文献：

用 scansci-pdf 下载 PDF

插件会：

1. 调用 scansci-pdf
2. 下载 PDF
3. 自动挂载附件

⸻

批量下载

支持多选文献：

* 无 DOI 自动跳过
* 逐篇下载
* 自动统计：
    * 成功
    * 失败
    * 跳过

并按设置自动等待间隔时间。

⸻

English

scansci-pdf Zotero Helper is a lightweight plugin for Zotero 7.

It allows Zotero to directly call scansci-pdf for automatic PDF downloading and attachment management.

The plugin is intentionally minimal and does not use webpack, React, or TypeScript.

⸻

Features

* Adds a Zotero context menu item:
    Download PDF via scansci-pdf
* Automatically reads DOI from selected items
* Calls local scansci-pdf
* Detects the newest downloaded PDF automatically
* Optionally attaches PDF to the current item
* Optionally skips items with existing PDFs
* Optionally adds a scansci-pdf tag
* Supports batch downloading
* Supports configurable delay between downloads

⸻

Plugin Settings

After installation:

Zotero → Settings → scansci-pdf

Configurable options:

* scansci-pdf executable path
* PDF download directory
* Auto attach PDF
* Skip existing PDF
* Auto add tag
* Batch download delay (seconds)

Default delay:

20 seconds

⸻

Install scansci-pdf

This plugin depends on the external CLI tool:

scansci-pdf

Default path:

~/.local/bin/scansci-pdf

Recommended installation using uv:

curl -LsSf https://astral.sh/uv/install.sh | sh
uv tool install scansci-pdf
uv tool update-shell

Install latest GitHub version:

uv tool install git+https://github.com/Rimagination/scansci-pdf.git

Or use:

pipx install scansci-pdf

Verify installation:

scansci-pdf --help
scansci-pdf check

If the executable path differs, update it in the Zotero plugin settings.

⸻

Build

./build.sh

Generated file:

scansci.xpi

⸻

Install Plugin

1. Open Zotero
2. Go to:
    Tools → Plugins
3. Click the gear icon
4. Choose:
    Install Plugin From File
5. Select:
    scansci.xpi
6. Restart Zotero

⸻

Usage

Right-click a Zotero item with a DOI:

Download PDF via scansci-pdf

The plugin will:

1. Call scansci-pdf
2. Download the PDF
3. Attach the PDF automatically

⸻

Batch Download

Multiple items are supported.

The plugin will:

* Skip items without DOI
* Process items one by one
* Report:
    * Success
    * Failed
    * Skipped

A delay between downloads can be configured in settings.
