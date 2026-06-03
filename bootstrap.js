var Services =
  globalThis.Services ||
  ChromeUtils.importESModule("resource://gre/modules/Services.sys.mjs").Services;

var ScansciPDFPlugin = {
  id: "scansci-pdf@zhuzhiqiang.local",
  prefBranch: "extensions.zotero.scanscipdf.",
  menuItemID: "scansci-pdf-download-menuitem",
  separatorID: "scansci-pdf-download-separator",
  managedMenuID: null,
  chromeHandle: null,
  rootURI: null,
  windowListener: null,
  defaultPrefs: {
    executablePath: "~/.local/bin/scansci-pdf",
    outputDir: "~/Downloads/papers",
    autoAttach: true,
    skipExistingPDF: true,
    autoTag: true,
    batchIntervalSeconds: 20
  },

  startup(data) {
    this.rootURI = data.rootURI || data.resourceURI.spec;
    this.registerChrome();
    this.ensureDefaultPrefs();
    this.registerPreferencesPane();
    this.addToExistingWindows();
    this.registerWindowListener();
  },

  shutdown() {
    this.unregisterWindowListener();
    this.removeFromExistingWindows();
    if (this.chromeHandle) {
      this.chromeHandle.destruct();
      this.chromeHandle = null;
    }
  },

  registerChrome() {
    let aomStartup = Components.classes["@mozilla.org/addons/addon-manager-startup;1"]
      .getService(Components.interfaces.amIAddonManagerStartup);
    let manifestURI = Services.io.newURI(this.rootURI + "manifest.json");
    this.chromeHandle = aomStartup.registerChrome(manifestURI, [
      ["content", "scanscipdf", "chrome/content/"],
      ["locale", "scanscipdf", "en-US", "locale/en-US/"],
      ["locale", "scanscipdf", "zh-CN", "locale/zh-CN/"]
    ]);
  },

  registerPreferencesPane() {
    try {
      Zotero.PreferencePanes.register({
        pluginID: this.id,
        rawLabel: "scansci-pdf",
        src: "chrome://scanscipdf/content/preferences.xhtml"
      });
    } catch (error) {
      Zotero.debug("scansci-pdf: failed to register preferences pane: " + error);
    }
  },

  ensureDefaultPrefs() {
    for (let name in this.defaultPrefs) {
      let key = this.prefBranch + name;
      if (Zotero.Prefs.get(key, true) === undefined) {
        Zotero.Prefs.set(key, this.defaultPrefs[name], true);
      }
    }
  },

  getPref(name) {
    let value = Zotero.Prefs.get(this.prefBranch + name, true);
    if (value === undefined) {
      value = this.defaultPrefs[name];
    }
    return value;
  },

  getSettings() {
    return {
      executablePath: this.expandUserPath(String(this.getPref("executablePath") || "").trim()),
      outputDir: this.expandUserPath(String(this.getPref("outputDir") || "").trim()),
      autoAttach: !!this.getPref("autoAttach"),
      skipExistingPDF: !!this.getPref("skipExistingPDF"),
      autoTag: !!this.getPref("autoTag"),
      batchIntervalSeconds: Math.max(0, Number(this.getPref("batchIntervalSeconds")) || 0)
    };
  },

  addToExistingWindows() {
    let windows = typeof Zotero.getMainWindows === "function" ? Zotero.getMainWindows() : this.getZoteroWindows();
    for (let win of windows) {
      if (win.ZoteroPane && win.document) {
        this.addMenuItem(win);
      }
    }
  },

  removeFromExistingWindows() {
    let windows = typeof Zotero.getMainWindows === "function" ? Zotero.getMainWindows() : this.getZoteroWindows();
    for (let win of windows) {
      if (win.document) {
        this.removeMenuItem(win);
      }
    }
  },

  getZoteroWindows() {
    let windows = [];
    let enumerator = Services.wm.getEnumerator("navigator:browser");
    while (enumerator.hasMoreElements()) {
      let win = enumerator.getNext();
      if (win.ZoteroPane && win.document) {
        windows.push(win);
      }
    }
    return windows;
  },

  registerWindowListener() {
    this.windowListener = {
      onOpenWindow: xulWindow => {
        let win = xulWindow.docShell.domWindow;
        win.addEventListener(
          "load",
          () => {
            if (win.ZoteroPane) {
              this.addMenuItem(win);
            }
          },
          { once: true }
        );
      },
      onCloseWindow: () => {},
      onWindowTitleChange: () => {}
    };
    Services.wm.addListener(this.windowListener);
  },

  unregisterWindowListener() {
    if (this.windowListener) {
      Services.wm.removeListener(this.windowListener);
      this.windowListener = null;
    }
  },

  addMenuItem(win) {
    let doc = win.document;
    let menu = doc.getElementById("zotero-itemmenu");
    if (!menu) {
      return;
    }

    if (!menu._scanscipdfPopupHandler) {
      menu._scanscipdfPopupHandler = () => {
        this.ensureMenuItem(win);
      };
      menu.addEventListener("popupshowing", menu._scanscipdfPopupHandler);
      menu.setAttribute("data-scanscipdf-listener", "true");
    }

    this.ensureMenuItem(win);
  },

  ensureMenuItem(win) {
    let doc = win.document;
    let menu = doc.getElementById("zotero-itemmenu");
    if (!menu || doc.getElementById(this.menuItemID)) {
      return;
    }

    let separator = doc.createXULElement("menuseparator");
    separator.id = this.separatorID;

    let menuItem = doc.createXULElement("menuitem");
    menuItem.id = this.menuItemID;
    menuItem.className = "menuitem-iconic";
    menuItem.setAttribute("label", "用 scansci-pdf 下载 PDF");
    menuItem.addEventListener("command", () => {
      this.runCommand(win);
    });

    menu.appendChild(separator);
    menu.appendChild(menuItem);

    Zotero.debug("scansci-pdf: added item context menu entry");
  },

  runCommand(win, items) {
    let progress = this.createProgressWindow(win);
    this.handleCommand(win, progress, items).catch(error => {
      this.failProgress(progress, error && error.message ? error.message : String(error));
      this.alert(win, "scansci-pdf 下载失败", error && error.message ? error.message : String(error));
    });
  },

  removeMenuItem(win) {
    let menuItem = win.document.getElementById(this.menuItemID);
    if (menuItem) {
      menuItem.remove();
    }
    let separator = win.document.getElementById(this.separatorID);
    if (separator) {
      separator.remove();
    }
    let menu = win.document.getElementById("zotero-itemmenu");
    if (menu) {
      if (menu._scanscipdfPopupHandler) {
        menu.removeEventListener("popupshowing", menu._scanscipdfPopupHandler);
        delete menu._scanscipdfPopupHandler;
      }
      menu.removeAttribute("data-scanscipdf-listener");
    }
  },

  async handleCommand(win, progress, selectedItems) {
    this.updateProgress(progress, "读取当前选中文献", 5);
    let items = selectedItems ? Array.from(selectedItems) : Array.from(win.ZoteroPane.getSelectedItems());
    if (!items.length) {
      throw new Error("未选中文献");
    }

    let settings = this.getSettings();
    if (!settings.executablePath) {
      throw new Error("未设置 scansci-pdf 可执行文件路径");
    }
    if (!settings.outputDir) {
      throw new Error("未设置 PDF 下载目录");
    }

    this.updateProgress(progress, "准备下载目录", 20);
    await this.ensureDirectory(settings.outputDir);

    let stats = { success: 0, failed: 0, skipped: 0, errors: [] };
    for (let i = 0; i < items.length; i++) {
      let item = items[i];
      let prefix = "[" + (i + 1) + "/" + items.length + "] ";
      try {
        let result = await this.processItem(item, settings, progress, prefix);
        stats[result.status]++;
        if (result.status !== "success") {
          stats.errors.push(prefix + this.getItemTitle(item) + "：" + result.reason);
        }
      } catch (error) {
        stats.failed++;
        stats.errors.push(prefix + this.getItemTitle(item) + "：" + (error && error.message ? error.message : String(error)));
      }

      if (i < items.length - 1) {
        await this.waitBetweenBatchItems(settings.batchIntervalSeconds, progress);
      }
    }

    this.updateProgress(
      progress,
      "完成：成功 " + stats.success + "，失败 " + stats.failed + "，跳过 " + stats.skipped,
      100
    );
    this.closeProgress(progress);
    this.alert(win, "scansci-pdf", this.formatBatchSummary(stats));
  },

  async processItem(item, settings, progress, prefix) {
    let line = this.addProgressLine(progress, prefix + this.getItemTitle(item), 1);
    let doi = this.cleanDOI(item.getField("DOI"));
    if (!doi) {
      this.updateProgress(progress, prefix + "跳过：无 DOI", 100, line);
      return { status: "skipped", reason: "无 DOI" };
    }
    if (settings.skipExistingPDF && this.hasPDFAttachment(item)) {
      this.updateProgress(progress, prefix + "跳过：已有 PDF", 100, line);
      return { status: "skipped", reason: "已有 PDF" };
    }

    this.updateProgress(progress, prefix + "调用 scansci-pdf 下载 PDF", 35, line);
    let downloadStartTime = Date.now();
    await this.runScansciPDF(doi, settings, progress, line);

    this.updateProgress(progress, prefix + "查找下载完成的 PDF", 65, line);
    let pdfPath = this.findLatestPDF(settings.outputDir, downloadStartTime - 2000);
    if (!pdfPath) {
      throw new Error("未在下载目录中找到 PDF");
    }

    this.updateProgress(progress, prefix + "等待 PDF 文件写入稳定", 75, line);
    await this.waitForStableFile(pdfPath);

    if (settings.autoAttach) {
      this.updateProgress(progress, prefix + "挂载 PDF 到 Zotero 文献", 85, line);
      await Zotero.Attachments.importFromFile({
        file: pdfPath,
        parentItemID: item.id,
        moveFile: true
      });
    }

    if (settings.autoTag) {
      item.addTag("scansci-pdf");
      await item.saveTx();
    }
    if (settings.autoAttach) {
      await this.removeFile(pdfPath);
    }

    this.updateProgress(progress, prefix + "成功", 100, line);
    return { status: "success", reason: "" };
  },

  async runScansciPDF(doi, settings, progress, line) {
    let Subprocess = this.getSubprocess();
    Zotero.debug("scansci-pdf: starting download for DOI " + doi);
    let process = await Subprocess.call({
      command: settings.executablePath,
      arguments: ["get", doi, "--output", settings.outputDir],
      stdout: "pipe",
      stderr: "pipe"
    });

    let stdoutPromise = process.stdout.readString();
    let stderrPromise = process.stderr.readString();
    this.updateProgress(progress, "scansci-pdf 正在运行", 50, line);
    let result = await this.waitForProcess(process, 10 * 60 * 1000);
    let [stdout, stderr] = await Promise.all([stdoutPromise, stderrPromise]);
    Zotero.debug("scansci-pdf: finished DOI " + doi + " with exit code " + result.exitCode);

    if (result.exitCode !== 0) {
      let details = stderr || stdout || "scansci-pdf 执行失败";
      throw new Error(details.trim());
    }
  },

  cleanDOI(doi) {
    return String(doi || "")
      .trim()
      .replace(/^https?:\/\/doi\.org\//i, "")
      .replace(/^http:\/\/dx\.doi\.org\//i, "")
      .replace(/^doi:\s*/i, "")
      .trim();
  },

  async waitBetweenBatchItems(seconds, progress) {
    if (!seconds) {
      return;
    }
    let line = this.addProgressLine(progress, "等待 " + seconds + " 秒后继续下一篇", 1);
    for (let remaining = seconds; remaining > 0; remaining--) {
      this.updateProgress(progress, "等待 " + remaining + " 秒后继续下一篇", Math.max(1, Math.round((seconds - remaining) / seconds * 100)), line);
      await Zotero.Promise.delay(1000);
    }
    this.updateProgress(progress, "继续下一篇", 100, line);
  },

  formatBatchSummary(stats) {
    let lines = [
      "批量下载完成",
      "成功：" + stats.success,
      "失败：" + stats.failed,
      "跳过：" + stats.skipped
    ];
    if (stats.errors.length) {
      lines.push("");
      lines.push("详情：");
      lines = lines.concat(stats.errors.slice(0, 12));
      if (stats.errors.length > 12) {
        lines.push("还有 " + (stats.errors.length - 12) + " 条未显示");
      }
    }
    return lines.join("\n");
  },

  getItemTitle(item) {
    return item.getField("title") || item.key || String(item.id);
  },

  expandUserPath(path) {
    if (!path || path === "~") {
      return path ? Services.dirsvc.get("Home", Components.interfaces.nsIFile).path : "";
    }
    if (path.indexOf("~/") === 0) {
      return Services.dirsvc.get("Home", Components.interfaces.nsIFile).path + path.slice(1);
    }
    return path;
  },

  hasPDFAttachment(item) {
    let attachmentIDs = item.getAttachments();
    for (let id of attachmentIDs) {
      let attachment = Zotero.Items.get(id);
      if (!attachment || !attachment.isAttachment()) {
        continue;
      }
      let contentType = attachment.attachmentContentType;
      let path = attachment.getFilePath && attachment.getFilePath();
      if (contentType === "application/pdf" || (path && /\.pdf$/i.test(path))) {
        return true;
      }
    }
    return false;
  },

  createProgressWindow(win) {
    let progressWindow = new Zotero.ProgressWindow({ window: win, closeOnClick: false });
    progressWindow.show();
    progressWindow.changeHeadline("scansci-pdf");
    let itemProgress = new progressWindow.ItemProgress("attachment-pdf", "准备下载 PDF");
    itemProgress.setProgress(1);
    return {
      window: progressWindow,
      item: itemProgress
    };
  },

  addProgressLine(progress, text, percent) {
    if (!progress) {
      return null;
    }
    let line = new progress.window.ItemProgress("attachment-pdf", text);
    line.setProgress(percent || 1);
    progress.item = line;
    return line;
  },

  updateProgress(progress, text, percent, line) {
    if (!progress) {
      return;
    }
    let itemProgress = line || progress.item;
    itemProgress.setText(text);
    itemProgress.setProgress(percent);
  },

  failProgress(progress, message) {
    if (!progress) {
      return;
    }
    progress.item.setText(message);
    progress.item.setError();
    progress.window.startCloseTimer(8000);
  },

  closeProgress(progress) {
    if (!progress) {
      return;
    }
    progress.window.startCloseTimer(2500);
  },

  async waitForProcess(process, timeout) {
    let timedOut = false;
    let timer = new Promise(async resolve => {
      await Zotero.Promise.delay(timeout);
      timedOut = true;
      resolve(null);
    });
    let result = await Promise.race([process.wait(), timer]);
    if (timedOut) {
      await process.kill();
      throw new Error("scansci-pdf 执行超时");
    }
    return result;
  },

  getSubprocess() {
    if (ChromeUtils.importESModule) {
      return ChromeUtils.importESModule("resource://gre/modules/Subprocess.sys.mjs").Subprocess;
    }
    return ChromeUtils.import("resource://gre/modules/Subprocess.jsm").Subprocess;
  },

  async ensureDirectory(path) {
    let dir = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsIFile);
    dir.initWithPath(path);
    if (!dir.exists()) {
      dir.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0o755);
    }
  },

  findLatestPDF(path, minModifiedTime) {
    let dir = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsIFile);
    dir.initWithPath(path);

    if (!dir.exists() || !dir.isDirectory()) {
      return null;
    }

    let latestFile = null;
    let latestTime = 0;
    let entries = dir.directoryEntries;

    while (entries.hasMoreElements()) {
      let file = entries.nextFile;
      if (!file.isFile() || !/\.pdf$/i.test(file.leafName)) {
        continue;
      }
      if (minModifiedTime && file.lastModifiedTime < minModifiedTime) {
        continue;
      }
      if (file.lastModifiedTime > latestTime) {
        latestTime = file.lastModifiedTime;
        latestFile = file;
      }
    }

    return latestFile ? latestFile.path : null;
  },

  async waitForStableFile(path) {
    let previousSize = -1;
    let previousModified = -1;
    let stableChecks = 0;

    for (let i = 0; i < 20; i++) {
      let file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsIFile);
      file.initWithPath(path);
      if (!file.exists() || !file.isFile()) {
        throw new Error("下载后的 PDF 文件不存在");
      }

      let size = file.fileSize;
      let modified = file.lastModifiedTime;
      if (size > 0 && size === previousSize && modified === previousModified) {
        stableChecks++;
        if (stableChecks >= 2) {
          return;
        }
      } else {
        stableChecks = 0;
      }
      previousSize = size;
      previousModified = modified;
      await Zotero.Promise.delay(500);
    }

    throw new Error("PDF 文件仍在写入，暂不导入");
  },

  async removeFile(path) {
    let file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsIFile);
    file.initWithPath(path);
    if (file.exists() && file.isFile()) {
      file.remove(false);
    }
  },

  alert(win, title, message) {
    Services.prompt.alert(win, title, message);
  }
};

function install() {}

function uninstall() {}

function startup(data, reason) {
  ScansciPDFPlugin.startup(data, reason);
}

function onMainWindowLoad({ window }, reason) {
  ScansciPDFPlugin.addMenuItem(window);
}

function onMainWindowUnload({ window }, reason) {
  ScansciPDFPlugin.removeMenuItem(window);
}

function shutdown(data, reason) {
  if (reason === APP_SHUTDOWN) {
    return;
  }
  ScansciPDFPlugin.shutdown(data, reason);
}
