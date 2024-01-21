const { ipcRenderer } = require("electron");
const fs = require("fs");
const os = require("os");

let g_directory = "";
let g_files = [];
let totalProgress = 0;
let currentProgress = 0;
const phases = {
  backup: 0,
  renameTemp: 1,
  rename: 2,
};

const maxNumberLength = 5;

var buttonAddon = document.getElementById("button-addon");

buttonAddon.addEventListener("click", () => {
  ipcRenderer.send("select-directory");
});

ipcRenderer.on("selected-directory", (_event, directory) => {
  g_directory = directory;
  document
    .getElementById("selected-directory")
    .setAttribute("placeholder", directory);
  g_files = getFiles(directory);
  fillTable(g_files);
  document.getElementById("submit-button").removeAttribute("disabled");
  document.getElementById("file-list-container").removeAttribute("hidden");
});

const setLoadingInfo = (info) => {
  document.getElementById("loading-info").innerHTML = info;
};

const getCreationDate = (filePath) => {
  const stats = fs.statSync(filePath);
  return stats.birthtime;
};

const sortFilesByCreationDate = (files, directory) => {
  return files.sort((fileA, fileB) => {
    const creationDateA = getCreationDate(directory + pathSeparator + fileA);
    const creationDateB = getCreationDate(directory + pathSeparator + fileB);

    return creationDateA - creationDateB;
  });
};

const getFiles = (directory) => {
  const files = fs.readdirSync(directory).filter((file) => {
    return fs.statSync(directory + pathSeparator + file).isFile();
  });
  return sortFilesByCreationDate(files, directory);
};

const fillTable = (files) => {
  var fileList = document.getElementById("file-list");
  fileList.innerHTML = "";
  files.forEach((element) => {
    var option = document.createElement("option");
    option.innerHTML = element;
    fileList.appendChild(option);
  });
};

const addProgress = (progress) => {
  currentProgress++;
  progress = progress ?? (currentProgress / totalProgress) * 99 + "%";
  document.getElementById("progress-bar").style["width"] = progress;
  document.getElementById("progress-bar").innerHTML = progress;
};

const pathSeparator = os.platform() === "win32" ? "\\" : "/"

const renameTempFiles = (files) => {
  setLoadingInfo("Renaming files..");

  files.forEach((file, index) => {
    const fileExtension = file.split(".")[1];
    const prefix = document.getElementById("prefix").value;

    const newFileName =
      prefix +
      "0".repeat(maxNumberLength - index.toString().length) +
      index.toString() +
      "." +
      fileExtension +
      ".tmp";

    fs.renameSync(
      g_directory + pathSeparator + file,
      g_directory + pathSeparator + newFileName
    );

    addProgress();
  });
};

const renameFiles = (files) => {
  setLoadingInfo("Cleaning up files...");

  files.forEach((file) => {
    fs.renameSync(
      g_directory + pathSeparator + file,
      g_directory + pathSeparator + file.replace(".tmp", "")
    );
    addProgress();
  });
};

const backupFiles = (files) => {
  setLoadingInfo("Creating backup.");

  fs.mkdirSync(g_directory + pathSeparator + ".bak");
  files.forEach((file) => {
    fs.copyFileSync(
      g_directory + pathSeparator + file,
      g_directory + pathSeparator + ".bak" + pathSeparator + file
    );
    addProgress();
  });
};

const restoreFiles = (files) => {
  setLoadingInfo("An error occured. Restoring files...");
  files.forEach((file) => {
    fs.unlinkSync(g_directory + pathSeparator + file);
  });

  const backupFiles = fs.readdirSync(g_directory + pathSeparator + ".bak");

  backupFiles.forEach((file) => {
    fs.renameSync(
      g_directory + pathSeparator + ".bak" + pathSeparator + file,
      g_directory + pathSeparator + file
    );
  });

  fs.rmdirSync(g_directory + pathSeparator + ".bak");
};

const prefixField = document.getElementById("prefix");

prefixField.addEventListener("keyup", () => {
  if (document.getElementById("prefix").value === "") {
    document.getElementById("prefix").classList.add("is-invalid");
  } else {
    document.getElementById("prefix").classList.remove("is-invalid");
  }
});

const submitButton = document.getElementById("submit-button");

submitButton.addEventListener("click", () => {
  if (document.getElementById("prefix").value === "") {
    document.getElementById("prefix").classList.add("is-invalid");
    return;
  } else {
    document.getElementById("prefix").classList.remove("is-invalid");
  }
  document.getElementById("submit-button").setAttribute("disabled", "true");
  document.getElementById("submit-button").removeAttribute("hidden");
  document.getElementById("spinner").removeAttribute("hidden");
  document.getElementById("progress-bar-container").removeAttribute("hidden");

  totalProgress = g_files.length * phases.length;

  backupFiles(g_files);

  try {
    renameTempFiles(g_files);

    g_files = getFiles(g_directory);

    renameFiles(g_files);

    g_files = getFiles(g_directory);
    fillTable(g_files);

    fs.rmdirSync(g_directory + pathSeparator + ".bak", { recursive: true });

    addProgress("100%");
    setLoadingInfo("Done!");
  } catch (error) {
    document.getElementById("progress-bar").classList.remove("bg-info");
    document.getElementById("progress-bar").classList.add("bg-danger");
    document.getElementById("progress-bar").innerHTML = "Error!";
    document.getElementById("progress-bar").style["width"] = "100%";
    console.error(error);
    alert(error);

    restoreFiles(g_files);

    setLoadingInfo("An error occured!");

    g_files = getFiles(g_directory);
    fillTable(g_files);
  }

  document.getElementById("spinner").setAttribute("hidden", "true");
  document.getElementById("submit-button").removeAttribute("disabled");
});
