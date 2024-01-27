const { ipcRenderer } = require("electron");
const fs = require("fs");
const os = require("os");

let g_directory = "";
let g_files = [];
let totalProgress = 0;
let currentProgress = 0;

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
  progress =
    progress ?? Math.ceil((currentProgress / totalProgress) * 99) + "%";
  document.getElementById("progress-bar").style["width"] = progress;
  document.getElementById("progress-bar").innerHTML = progress;
};

const pathSeparator = os.platform() === "win32" ? "\\" : "/";

const renameTempFiles = async (files) => {
  setLoadingInfo("Renaming files..");

  const renamePromises = files.map((file, i) => {
    return new Promise((resolve, reject) => {
      const fileExtension = file.split(".")[1];
      const prefix = document.getElementById("prefix").value;

      const newFileName =
        prefix +
        "0".repeat(maxNumberLength - i.toString().length) +
        i.toString() +
        "." +
        fileExtension +
        ".tmp";

      fs.rename(
        g_directory + pathSeparator + file,
        g_directory + pathSeparator + newFileName,
        (error) => {
          if (error) {
            reject(error);
          } else {
            addProgress();
            resolve();
          }
        }
      );
    });
  });

  await Promise.all(renamePromises);
};

const renameFiles = async (files) => {
  setLoadingInfo("Cleaning up files...");

  const renamePromises = files.map((file) => {
    return new Promise((resolve, reject) => {
      fs.rename(
        g_directory + pathSeparator + file,
        g_directory + pathSeparator + file.replace(".tmp", ""),
        (error) => {
          if (error) {
            reject(error);
          } else {
            addProgress();
            resolve();
          }
        }
      );
    });
  });

  await Promise.all(renamePromises);
};

const restoreFiles = async () => {
  setLoadingInfo("An error occured. Restoring files...");
  const filesToRestore = getFiles(g_directory);

  const restorePromises = filesToRestore.map((file, index) => {
    if (file === g_files[index]) return Promise.resolve();
    return fs.promises.rename(
      g_directory + pathSeparator + file,
      g_directory + pathSeparator + g_files[index]
    );
  });

  await Promise.all(restorePromises);
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

submitButton.addEventListener("click", async () => {
  if (document.getElementById("prefix").value === "") {
    document.getElementById("prefix").classList.add("is-invalid");
    return;
  } else {
    document.getElementById("prefix").classList.remove("is-invalid");
  }
  document.getElementById("submit-button").setAttribute("disabled", "true");
  document.getElementById("submit-button").removeAttribute("hidden");
  document.getElementById("spinner").removeAttribute("hidden");

  document.getElementById("progress-bar").classList.remove("bg-danger");
  document.getElementById("progress-bar").classList.add("bg-info");
  document.getElementById("progress-bar").innerHTML = "0%";
  document.getElementById("progress-bar").style["width"] = "0%";
  document.getElementById("progress-bar-container").removeAttribute("hidden");

  currentProgress = 0;
  totalProgress = g_files.length * 2;

  try {
    await renameTempFiles(g_files);

    const tempFiles = getFiles(g_directory);

    await renameFiles(tempFiles);

    addProgress("100%");
    setLoadingInfo("Done!");
  } catch (error) {
    document.getElementById("progress-bar").classList.remove("bg-info");
    document.getElementById("progress-bar").classList.add("bg-danger");
    document.getElementById("progress-bar").innerHTML = "Error!";
    document.getElementById("progress-bar").style["width"] = "100%";
    console.error(error);
    alert(error);

    await restoreFiles();
    setLoadingInfo("An error occured!");
  }

  g_files = getFiles(g_directory);
  fillTable(g_files);

  document.getElementById("spinner").setAttribute("hidden", "true");
  document.getElementById("submit-button").removeAttribute("disabled");
});
