const { ipcRenderer } = require("electron");
const fs = require("fs");

let g_directory = "";
let g_files = [];

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

const getFiles = (directory) => {
  return fs.readdirSync(directory);
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

const setProgress = (progress) => {
  document.getElementById("progress-bar").style["width"] = progress;
  document.getElementById("progress-bar").innerHTML = progress;
};

const renameTempFiles = (files) => {
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

    fs.renameSync(g_directory + "/" + file, g_directory + "/" + newFileName);

    const percentage = ((index + 1) / files.length) * 50 + "%";

    setProgress(percentage);
  });
};

const renameFiles = (files) => {
  files.forEach((file, index) => {
    fs.renameSync(
      g_directory + "/" + file,
      g_directory + "/" + file.replace(".tmp", "")
    );

    const percentage =
      ((index + files.length + 1) / (files.length * 2)) * 100 + "%";

    setProgress(percentage);
  });
};

const prefixField = document.getElementById('prefix');

prefixField.addEventListener("keyup", () => {
  if(document.getElementById("prefix").value === ""){
    document.getElementById("prefix").classList.add("is-invalid");
  }else{
    document.getElementById("prefix").classList.remove("is-invalid");
  }
});

const submitButton = document.getElementById("submit-button");

submitButton.addEventListener("click", () => {
  if(document.getElementById("prefix").value === ""){
    document.getElementById("prefix").classList.add("is-invalid");
    return;
  }else{
    document.getElementById("prefix").classList.remove("is-invalid");
  }
  document.getElementById("submit-button").setAttribute("disabled", "true");
  document.getElementById("submit-button").removeAttribute("hidden");
  document.getElementById("spinner").removeAttribute("hidden");
  document.getElementById("progress-bar-container").removeAttribute("hidden");

  renameTempFiles(g_files);

  g_files = getFiles(g_directory);

  renameFiles(g_files);

  g_files = getFiles(g_directory);
  fillTable(g_files);

  document.getElementById("spinner").setAttribute("hidden", "true");
  document.getElementById("submit-button").removeAttribute("disabled");
});
