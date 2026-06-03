# Changelog

## 0.2.14

- 修复 Zotero 9 条目右键菜单可能被重建后插件菜单项丢失的问题：在每次 `zotero-itemmenu` 弹出前检查并恢复菜单项，同时避免重复绑定监听。

## 0.2.13

- 修复 Zotero 9 右键菜单后续无法正常弹出的问题：移除 `Zotero.MenuManager` 注册路径，仅保留最小 DOM 菜单注入，并移除额外 `popupshowing` 监听。

## 0.2.12

- 修复 Zotero 9 右键菜单第一次有效、后续无法正常弹出的问题：官方 `MenuManager` 注册成功时不再同时注入 DOM fallback，避免重复菜单 ID 和重复事件干扰。

## 0.2.11

- 修复 Zotero 9 设置页内容不显示的问题，使用官方最小 `PreferencePanes.register()` 参数并补充 XHTML 命名空间。
- 菜单注册不再依赖设置页注册成功；同时保留官方 `MenuManager` 和 DOM fallback，避免右键菜单缺失。
- 运行时 chrome/locale 注册改回 Zotero 官方示例的相对路径写法。

## 0.2.10

- 修复 Zotero 9 中 JSM 模块导入不兼容问题，改用 `ChromeUtils.importESModule()` 加载 `Services` 和 `Subprocess`。
- 在 Zotero 8/9 中优先使用官方 `Zotero.MenuManager` 注册右键菜单，旧版保留 DOM 注入 fallback。

## 0.2.9

- 最小改动支持 Zotero 9，将兼容上限从 `8.*` 更新为 `9.*`。

## 0.2.8

- README 增加 `scansci-pdf` 命令行工具安装和检查方法。
- 更新插件主页和自动更新地址为 `qiangqianglab/scansci-zotero`。

## 0.2.7

- 移除默认配置中的个人绝对路径，支持 `~` 展开。
- 增加仓库清理忽略规则。

## 0.2.6

- 将设置页改为纯静态 Zotero Preferences UI，避免影响其他插件设置页显示。
- 保留批量下载、进度提示、设置项和 DOI 清洗功能。
