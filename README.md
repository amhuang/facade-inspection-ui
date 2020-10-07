# Facade Inspection Robot Setup

This includes the instructions for the hardware setup for the Imaging Robot, as well as the operation instructions below.

## **Hardware Setup Instructions**

To start, you'll need the following parts:

- 3 Raspberry Pis (upper, lower, and backup)
- 2 hoists. The 4 cables coming from the two internal relays (2 ground, 2 input) should be accessible from outside of the control box.
- 2 MPU6050 acceleormeters (the ADXL345 works as well, just import that file instead in the leveling algorithms)
- 1 BMP280 altimeter
- 6 USB cameras

All communication utilizes MQTT with Websockets. You'll to know the IP addresses of the Pis' on the network you're using in order to interface with them via VNC/SSH, so it might be helpful to have an IP address scanner (I use Angry IP Scanner). These addresses are also necessary for the GUI for connecting to the MQTT broker and viewing the livestreams.

The instructions for installing necessary dependencies on the Pis are in the Google Doc "Pi Setup from Scratch". Internal wiring instructions for the hoist control boxes are also in the Drive, but wiring of various parts to the Pi is detailed below.

---

### Upper Pi

What this Pi does:

- Given commands from the GUI, can run the two hoists together using a leveling algorithm or each one independently
- Runs an MQTT broker (port: 9001), to which all Pi's and the GUI are connected
- Publishes pitch data from accelerometer via MQTT to the broker
- Upon losing connecting with its accelerometer will either a) transfer hoist control and accelerometer data publishing capabilities to the backup Pi, or b) continue to operate both hoists without leveling. The operator can choose one of these two options from the GUI.
- Streams input from three USB cameras via mjpg-streamer (port: 8080)

What files this Pi needs:

- `upperMqtt.py`
- `mqttBroker.sh`
- `mjpg-streamer.sh`
- `mpu6050.py` or `adxl345.py`
- `setInterval.py`

What this Pi is connected to:

- Accelerometer (MPU6050 or ADXL345)
- Both hoists
- 3 USB cameras

---

### Backup Pi

What this Pi does:

- Stays subscribed to the MQTT broker on the upper Pi at all times
- Acts as a backup if the upper Pi disconnects from its accelerometer and the operator chooses to switch to the backup Pi to operate. Upon receiving the "Switch to backup" message on the topic "hoist", this Pi does two things:
  1. It enables listens and executes up/down commands from the GUI instead of the upper Pi, and
  2. Publishes accelerometer pitch data to the GUI

- Acts as a backup in the case of upper Pi losing power. Upon disconnecting from the MQTT broker, this Pi does the following:
  1. Runs the shell script that starts another MQTT broker on this Pi (port: 9001). The GUI and lower Pi try to connect to this when they disconnect from the original broker (upper Pi).
  2. Gains control over hoists by subscribing to topic "hoist"
  3. Publishes pitch from accelerometer to the GUI

Files needed:

- `backupMqtt.py`
- `mqttBroker.sh`
- `setInterval.py`
- `mpu6050.py`

What this Pi is connected to:

- Accelerometer (MPU6050 or ADXL345)
- Both hoists

---

### Lower Pi

What this Pi does:

- Publishes data from altimeter to the MQTT broker (UpperPi) on topic "altimeter/altitude", "altimeter/temperature", and "altimeter/pressure"
- Upon disconnecting from its broker (upper Pi), reconnects to the broker on the backup Pi
- Streams input from three USB cameras via mjpg-streamer (port: 8080)

What files this Pi needs

- `lowerMqtt.py`
- `bmp280_I2C.py`
- `mjpg-streamer.sh`
- `setInterval.py`

What this Pi is connected to:

- Altimeter (via I2C)
- 3 USB cameras

---

### Wiring Instructions

**Wiring for the accelerometer (MPU6050 and ADXL345)**

Connect one each to the backup and upper Pis.

1. VIN/VCC goes to 5V power on Pi
2. GND goes to ground on Pi
3. SDA goes to SDA (GPIO2)
4. SCL goes to SCL (GPIO3)

**Wiring for altimeter (BMP280)**

We use this sensor with I2C. Connect one to the lower Pi.

1. VIN goes to 5V power
2. GND goes to ground
3. SDI goes to I2C SDA pin (GPIO2)
4. SCK goes to I2C SCL pin (GPIO3)

**Wiring for hoist**

1. Using a breadboard, connect the two - input wires from the control box to ground.
2. Connect + input wire from the relay connected to the +15V cable (spins forward and spools when connected to SIG) to the breadboard. For the left hoist, this wire should be split to go to GPIO19 on both the upper Pi and backup Pi. For the right hoist, this wire should be split to got to GPIO20 on the upper and backup Pis.
3. Connect + input wire from the relay connected to the -15V cable (spins reverse and unspools when connected to SIG) to the breadboard. For the left hoist, this wire should split and connect to GPIO26 on the upper and backup Pis. For the right hoist, this wire should split and connect to GPIO21 on the upper and backup Pis.

---

## **Operation Instructions**

On your laptop, you'll need:

- A VNC Viewer connection to each of the 3 Pis. You might need an IP scanner if you don't know their IP addresses already.
- `index.html`

---

### Raspberry Pi Setup (accessed through VNC Viewer)

1. On the upper Pi:
    a. Run `mjpg-streamer.sh` (in terminal) to start the livestreams. You should be able to see the upper 3 livestreams on the GUI, provided that the GUI has the correct IP address of the Pi
    b. Run `mqttBroker.sh` (in terminal) to start the MQTT broker (andrea will eventually make this step a subprocess in upperMqtt.py)
    c. Run `upperMqtt.py` to start the MQTT client. This should tell you when this Pi is connected to the MQTT broker, as well as respond to key presses (e.g. "up", "down", "off", "down left", etc.) from the GUI.

2. On the lower Pi:
    a. Run `mjpg-streamer.sh` to start the lifestreams. The bottom 3 livestreams should now be visible on the GUI, provided that the correct IP address is provided on the GUI.
    b. Run `lowerMqtt.py`. This should tell you when this Pi is connected to the MQTT broker. Once this is run, you should be able to see the altimeter data on the GUI.

3. On the backup Pi, run `backupMqtt.py`. This should tell you when this Pi is connected to the MQTT broker.

---

### GUI Use

Upon starting the scripts on each of the Pi's, the following data should be visible from the GUI, `index.html`:

- 6 livestreams. Each of these can be viewed full screen, and brightness and contrast can be adjusted if necessary with the buttons each window's top right corner
- Angle of the beam (pitch) and the animation
- Altitude, temperature, and pressure (altitude is taken from sea level and may need to be zeroed with the button in the top right corner)

**Controlling the hoists**

- The rectanglar button in the middle displays which mode of hoist operation the GUI is set at.
- **"Leveling"** displays two arrows which are responsive to the up and down key being held down, as well as being held down by the mouse. This mode operates both hoists at once to lift the entire frame, and has a build in leveling algorithm.
- **"Individual"** displays 4 arrows which are responsive to being held down by the mouse. This allows control of each individual hoist in both directions. The arrows on the left and right sides correspond to the left and right hoists when facing the wall.
