# boiler-server

A simple server application which can be run on a raspberry pi to turn an appliance off and on. Like a Switchbot but stronger.

[Why I built this](https://www.georgegillams.co.uk/blog/diy-switchbot).

# Local development

- Install dependencies using `yarn`.
- Run the server using `DEBUG=true yarn start`.
- Visit http://192.168.0.95:8080/

# Deployment

- Follow the [pigpio installation instructions](https://www.npmjs.com/package/pigpio#installation).
- Run yarn
- Configure the Pi to run `yarn start` on boot using PM2, crontab, or similar.
