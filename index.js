const fs = require("fs");
const http = require("http");
const { logsToHtml } = require("./utils");
let rpio;

const restartThenQuit = process.argv.includes("--restart-once");

const RESTART_LOG_FILE = "../restart_log.txt";
const MIN_TIME_BETWEEN_ACTIONS = 1000 * 30; // 30 seconds
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
const DEFAULT_POSITION = 1500;
const PRESS_IN_POSITION = 1000; // was 1100. Smaller number means more pressed in...

const servo = new rpio(PIN, { mode: rpio.OUTPUT });

const readFile = (fileName) => {
  if (!fs.existsSync(fileName)) {
    fs.writeFileSync(fileName, "");
  }

  return fs.readFileSync(fileName, { encoding: "utf-8" });
};

const pressButton = async () => {
  console.log(`Pressing boiler button`);
  await servo.servoWrite(PRESS_IN_POSITION);
  await waitFor(800);
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
  await waitFor(8000);
  await pressButton();
  await waitFor(8000);

  console.log("Boiler restart complete!");
  fs.appendFileSync(
    RESTART_LOG_FILE,
    `${new Date().toISOString()} RESTART COMPLETE\n`
  );
};

const toggleBoilerState = async () => {
  fs.appendFileSync(RESTART_LOG_FILE, `${new Date().toISOString()} TOGGLING\n`);
  await pressButton();

  console.log("Boiler toggle complete!");
  fs.appendFileSync(
    RESTART_LOG_FILE,
    `${new Date().toISOString()} TOGGLE COMPLETE\n`
  );
};

const requestListener = async (req, res) => {
  if (req.url == "/restart" || req.url == "/toggle") {
    if (lastRestartTime > Date.now() - MIN_TIME_BETWEEN_ACTIONS) {
      res.writeHead(400);
      res.end("Too many requests! Try again later!");
      return;
    }
    lastRestartTime = Date.now();
    if (req.url == "/restart") {
      await restartBoiler();
      res.writeHead(200);
      res.end("Boiler restart complete!");
    } else if (req.url === "/toggle") {
      await toggleBoilerState();
      res.writeHead(200);
      res.end("Boiler toggle complete!");
    }
  } else if (req.url === "/logs-raw") {
    const logs = readFile(RESTART_LOG_FILE, { encoding: "utf-8" });
    res.writeHead(200);
    res.end(logsToHtml(logs));
  } else if (req.url === "/logs") {
    const logs = readFile(RESTART_LOG_FILE, { encoding: "utf-8" });
    res.writeHead(200);
    res.end(logsToHtml(logs));
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
};

if (restartThenQuit) {
  fs.appendFileSync(
    RESTART_LOG_FILE,
    `${new Date().toISOString()} RUNNING RESTART ONCE MODE\n`
  );
  restartBoiler();
}

if (!restartThenQuit) {
  const server = http.createServer();
  server.on("request", requestListener);

  server.listen(process.env.PORT || 8080);

  fs.appendFileSync(
    RESTART_LOG_FILE,
    `${new Date().toISOString()} SERVER RUNNING\n`
  );
}
