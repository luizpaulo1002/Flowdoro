import { app as o, BrowserWindow as s, ipcMain as i } from "electron";
import { fileURLToPath as d } from "node:url";
import n from "node:path";
const r = n.dirname(d(import.meta.url));
process.env.APP_ROOT = n.join(r, "..");
const t = process.env.VITE_DEV_SERVER_URL, w = n.join(process.env.APP_ROOT, "dist-electron"), a = n.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = t ? n.join(process.env.APP_ROOT, "public") : a;
let e;
function l() {
  e = new s({
    width: 900,
    height: 700,
    minWidth: 400,
    minHeight: 500,
    frame: !1,
    transparent: !0,
    resizable: !0,
    titleBarStyle: "hidden",
    icon: n.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: n.join(r, "preload.mjs"),
      nodeIntegration: !1,
      contextIsolation: !0
    }
  }), i.on("window-min", () => {
    e && e.minimize();
  }), i.on("window-max", () => {
    e && (e.isMaximized() ? e.restore() : e.maximize());
  }), i.on("window-close", () => {
    e && e.close();
  }), e.webContents.on("did-finish-load", () => {
    e == null || e.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), t ? e.loadURL(t) : e.loadFile(n.join(a, "index.html"));
}
o.on("window-all-closed", () => {
  process.platform !== "darwin" && (o.quit(), e = null);
});
o.on("activate", () => {
  s.getAllWindows().length === 0 && l();
});
o.whenReady().then(l);
export {
  w as MAIN_DIST,
  a as RENDERER_DIST,
  t as VITE_DEV_SERVER_URL
};
