var shell = require("shelljs");
var dev = process.env.NODE_ENV !== "production";

var devHost = "https://yaidevstraccwebapp.blob.core.windows.net";
var prodHost = "https://nahtuhprodstasset.blob.core.windows.net";
var distDir = shell.ls("./dist").map((dirname) => "./dist/" + dirname);

if (dev) shell.sed("-i", prodHost, devHost, distDir);
else shell.sed("-i", devHost, prodHost, distDir);
