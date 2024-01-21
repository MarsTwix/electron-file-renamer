const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("node:path");

var win = null;

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  const isDev = process.env.NODE_ENV === "development";
  if (isDev) {
    win.webContents.openDevTools();
  }

  win.loadFile("index.html");
};

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.on("select-directory", (event) => {
  const { dialog } = require("electron");

  dialog
    .showOpenDialog(win, {
      properties: ["openDirectory"],
    })
    .then((result) => {
      if (!result.canceled && result.filePaths.length > 0) {
        event.reply("selected-directory", result.filePaths[0]);
      }
    })
    .catch((err) => {
      console.error(err);
    });
});
