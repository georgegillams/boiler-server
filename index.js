const http = require("http");
let rpio;
if (process.env.DEBUG) {
  rpio = class {
    // constructor() {
    //   console.log("Gpio created");
    // }
    // servoWrite(value) {
    //   console.log("servoWrite", value);
    // }

    static PWM = "PWM";
    static open(pin, mode) {
      console.log("open", pin, mode);
    }
    static pwmSetClockDivider(divider) {
      console.log("pwmSetClockDivider", divider);
    }
    static pwmSetRange(pin, range) {
      console.log("pwmSetRange", pin, range);
    }
    static pwmSetData(pin, data) {
      console.log("pwmSetData", pin, data);
    }
  };
} else {
  rpio = require("rpio");
}

const PIN = 12;
const PRESS_IN_POSITION = 0;
const DEFAULT_POSITION = 1000;

// const motor = new Gpio(10, { mode: Gpio.OUTPUT });
rpio.open(PIN, rpio.PWM);
rpio.pwmSetClockDivider(64);
rpio.pwmSetRange(PIN, 1024);

const pressButton = async () => {
  console.log(`Pressing boiler button`);
  await rpio.pwmSetData(PIN, PRESS_IN_POSITION);
  // await motor.servoWrite(PRESS_IN_POSITION);
  await waitFor(2000);
  await rpio.pwmSetData(PIN, DEFAULT_POSITION);
  // await motor.servoWrite(DEFAULT_POSITION);
};

const waitFor = async (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const requestListener = async (req, res) => {
  await pressButton();
  await waitFor(10000);
  await pressButton();
  await waitFor(10000);

  console.log("Boiler restart complete!");

  res.writeHead(200);
  res.end("Boiler restart complete!");
};

const server = http.createServer();
server.on("request", requestListener);

server.listen(process.env.PORT || 8080);
