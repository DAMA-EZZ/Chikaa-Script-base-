console.clear()
const http = require('http');
const os = require('os');
const Cfonts = require ('cfonts')
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

let isRunning = false;
function start(file) {
  if (isRunning) return;
  isRunning = true;
  const args = [path.join(__dirname, file), ...process.argv.slice(2)];
  const p = spawn(process.argv[0], args, {
    stdio: ["inherit", "inherit", "inherit", "ipc"],
  });
  p.on("message", (data) => {
    console.log(`[ Chikaà ] ${data}`);
    switch (data) {
      case "reset":
        p.kill();
        isRunning = false;
        start.apply(this, arguments);
        break;
      case "uptime":
        p.send(process.uptime());
        break;
    }
  });
  p.on("exit", (code) => {
    isRunning = false;
    console.error(`❌ sistem bot mati dengan kode: ${code}`);
   // start("main.js");
    if (code === 0) return;
    fs.watchFile(args[0], () => {
      fs.unwatchFile(args[0]);
      start("main.js");
    });
  });
  p.on("error", (err) => {
    console.error('\x1b[31m%s\x1b[0m', `Error: ${err}`);
    p.kill();
    isRunning = false;
    start("main.js");
  });
  const pluginsFolder = path.join(__dirname, "plugins");
  fs.readdir(pluginsFolder, (err, files) => {
    if (err) {
      console.error(`Error reading plugins folder: ${err}`);
      return;
    }
  });
}
start("main.js");

process.on('unhandledRejection', () => {
  console.error('\x1b[31m%s\x1b[0m', 'Unhandled promise rejection. Script will restart...');
  start('main.js');
});

process.on('exit', (code) => {
  console.error(`Exited with code: ${code}`);
  console.error('Script will restart...');
  start('main.js');
});