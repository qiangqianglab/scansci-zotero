# Zotero 10 Compatibility Report

Audit target: scansci-pdf Zotero Helper `v0.3.2`

Audit date: 2026-10-29

Supported Zotero versions declared by this release: `7.0` through `10.0.*`.

## Sources

- [Zotero 10 for Developers](https://www.zotero.org/support/dev/zotero_10_for_developers)
- [Zotero 8 for Developers](https://www.zotero.org/support/dev/zotero_8_for_developers)
- [Zotero 7 for Developers](https://www.zotero.org/support/dev/zotero_7_for_developers)
- [Zotero sample plugin](https://github.com/zotero/make-it-red)
- [Current Zotero attachment implementation](https://github.com/zotero/zotero/blob/main/chrome/content/zotero/xpcom/attachments.js)

## APIs Verified Unchanged

| API or surface | Usage | Result |
| --- | --- | --- |
| Bootstrap lifecycle hooks | `startup`, `shutdown`, `onMainWindowLoad`, `onMainWindowUnload` | Supported. The plugin now relies on Zotero's window hooks instead of an additional native window listener. |
| `ZoteroPane.getSelectedItems()` | Reads selected library items | Supported in Zotero 10. Zotero 10 specifically documents item-list selection methods as unchanged. |
| `Zotero.Prefs.get()` / `set()` | Reads and initializes plugin settings | Supported. Root-level `prefs.js` remains the supported default-preference mechanism. |
| `Zotero.PreferencePanes.register()` | Registers the settings page | Supported. The fragment is now loaded directly from `rootURI`, matching Zotero's sample plugin. |
| `Zotero.Attachments.importFromFile()` | Imports and attaches the downloaded PDF | Supported. `file`, `parentItemID`, and `moveFile` remain accepted options in current Zotero source. |
| `Zotero.Items.get()` and item attachment APIs | Detects existing PDF attachments | No Zotero 10 change identified. |
| `item.getField()`, `item.addTag()`, `item.saveTx()` | Reads DOI/title and saves the optional tag | Supported. Zotero 10 adds optional undo metadata but does not require it. |
| `Zotero.ProgressWindow` | Displays download progress | No Zotero 10 change identified. |
| `Zotero.Promise.delay()` | Batch delay and polling | Explicitly retained for compatibility on the Firefox 140 platform. |
| `Services`, XPCOM `nsIFile`, and `Subprocess.sys.mjs` | Prompts, file access, and external CLI execution | Zotero 10 uses the same Firefox 140 ESR base as Zotero 9, so no platform change applies. |

## APIs and Integration Points Modified

| Area | Previous implementation | v0.3.0 implementation |
| --- | --- | --- |
| Manifest compatibility | `strict_max_version: 9.*` | `strict_min_version: 7.0`, `strict_max_version: 10.0.*`, as required by Zotero 10 guidance. |
| Item context menu | Manual `zotero-itemmenu` DOM injection for every version | Official `Zotero.MenuManager` on Zotero 10; existing DOM fallback retained for Zotero 7-9. The handler uses `context.items` and does not access the removed singular collection context. The Zotero 10 label is assigned in `onShowing` so an unresolved Fluent resource cannot create a blank menu item. |
| Menu cleanup | Manual DOM cleanup only | Explicit `Zotero.MenuManager.unregisterMenu()` on Zotero 10; manual cleanup remains for the fallback. Zotero 10 also automatically removes plugin menu DOM on shutdown. |
| Preference pane URL | Runtime `chrome://scanscipdf/...` registration | Direct `rootURI + chrome/content/preferences.xhtml`, matching the official sample plugin and removing an unnecessary internal registration dependency. |
| Main-window discovery | Bootstrap hooks plus a native `Services.wm` listener | Bootstrap hooks plus an initial existing-window pass. This avoids duplicate registration paths. |
| External process module | Direct ESM/JSM selection | Guarded `Subprocess.sys.mjs` import for Zotero 8-10 with a deprecated `Subprocess.jsm` fallback retained only for Zotero 7 environments. |
| Update manifest | Version compatibility only | Zotero 7-10 compatibility plus the release XPI SHA-256 hash. |

## Zotero 10 Changes That Do Not Affect This Plugin

- The plugin does not use the removed singular collection getters such as `getSelectedCollection()` or `getSelectedLibraryID()`.
- It does not access `context.collectionTreeRow`; the Zotero 10 menu callback uses only `context.items`.
- It does not use Zotero Search, FullText, CookieSandbox, the local HTTP API, or direct SQLite access.
- It does not set attachment paths directly, so Zotero 10's stricter attachment-path validation does not apply.

## Remaining Compatibility Risks

1. No Zotero 10 executable is installed in the audit environment, so the XPI could not receive an end-to-end runtime smoke test. Installation, preference rendering, repeated context-menu opening, CLI execution, attachment import, tagging, and batch operation should be tested in a clean Zotero 10 profile before publishing.
2. `Subprocess.sys.mjs` and XPCOM file APIs are Mozilla platform internals rather than stable Zotero APIs. They are unchanged between Zotero 9 and 10 because both use Firefox 140 ESR, but they remain candidates for future platform breakage.
3. The Zotero 7-9 menu fallback depends on the internal DOM ID `zotero-itemmenu`. It is intentionally retained to avoid the MenuManager regressions observed on earlier Zotero versions, but it is less stable than the official Zotero 10 menu API.
4. scansci-pdf sources can return a valid PDF container containing the wrong article. Version 0.3.2 blocks the known-unreliable `CrossrefPage` result, prefers the exact CLI-reported path, and rejects paths outside the configured directory, but other sources cannot be semantically verified by the plugin.
5. Adding the `scansci-pdf` tag is not registered as an undoable Zotero 10 action. The save remains valid, but users cannot undo that tag change through Zotero's new undo history.

The deprecated `ChromeUtils.import(...Subprocess.jsm)` path remains only as a Zotero 7 fallback. Zotero 8-10 use `ChromeUtils.importESModule(...Subprocess.sys.mjs)`.

## Release Verification Checklist

- Install `scansci.xpi` in a clean Zotero 7 profile and verify settings, single download, and batch download.
- Install it in a clean Zotero 10 profile and open the item context menu repeatedly on single and multiple selections.
- Verify all preference controls persist after restarting Zotero.
- Verify a successful CLI download is imported beneath the selected parent item and removed from the download directory via `moveFile`.
- Verify missing DOI, existing PDF, command failure, timeout, and missing PDF errors.
- Upload the exact generated `scansci.xpi` to GitHub Release `v0.3.2`; `update.json` contains the SHA-256 of that file.
