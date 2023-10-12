const fs = require("fs");
const http = require("http");
let rpio;

const restartOnceMode = process.argv.includes("--restart-once");

const RESTART_LOG_FILE = "../restart_log.txt";
const TIME_BETWEEN_RESTARTS = 1000 * 30; // 30 seconds
let lastRestartTime = 0;

if (process.env.DEBUG) {
  rpio = class {
    constructor() {
      console.log("Gpio created");
    }
    servoWrite(value) {
      console.log("servoWrite", value);
    }

    static OUTPUT = "OUTPUT";
  };
} else {
  rpio = require("pigpio").Gpio;
}

const PIN = 12;
const PRESS_IN_POSITION = 1100;
const DEFAULT_POSITION = 1500;

const servo = new rpio(PIN, { mode: rpio.OUTPUT });

const pressButton = async () => {
  console.log(`Pressing boiler button`);
  await servo.servoWrite(PRESS_IN_POSITION);
  await waitFor(1000);
  await servo.servoWrite(DEFAULT_POSITION);
};

const waitFor = async (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const restartBoiler = async () => {
  fs.appendFileSync(
    RESTART_LOG_FILE,
    `${new Date().toISOString()} RESTARTING\n`
  );
  await pressButton();
  await waitFor(10000);
  await pressButton();
  await waitFor(10000);

  console.log("Boiler restart complete!");
  fs.appendFileSync(
    RESTART_LOG_FILE,
    `${new Date().toISOString()} RESTART COMPLETE\n`
  );
};

const requestListener = async (req, res) => {
  if (req.url == "/restart") {
    if (lastRestartTime > Date.now() - TIME_BETWEEN_RESTARTS) {
      res.writeHead(400);
      res.end("Boiler is already restarting!");
      return;
    }
    lastRestartTime = Date.now();
    await restartBoiler();
    res.writeHead(200);
    res.end("Boiler restart complete!");
  } else if (req.url === "/logs") {
    const logs = fs.readFileSync(RESTART_LOG_FILE, { encoding: "utf-8" });
    res.writeHead(200);
    res.end(logs);
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
};

if (restartOnceMode) {
  fs.appendFileSync(
    RESTART_LOG_FILE,
    `${new Date().toISOString()} RUNNING RESTART ONCE MODE\n`
  );
  restartBoiler();
}

if (!restartOnceMode) {
  const server = http.createServer();
  server.on("request", requestListener);

  server.listen(process.env.PORT || 8080);

  fs.appendFileSync(
    RESTART_LOG_FILE,
    `${new Date().toISOString()} SERVER RUNNING\n`
  );
}
