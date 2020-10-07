''' For LowerPi
'''
import RPi.GPIO as GPIO
import time
import paho.mqtt.client as paho
import bmp280_I2C as ALT
import subprocess
import setInterval as thread

''' Motor Setup '''

livestreams = subprocess.Popen(['sh', 'mjpg-streamer.sh'])
time.sleep(1)
broker = "192.168.1.235"    # IP of MAIN broker Pi
backupBroker = "192.168.1.113"
port = 9001                 # Set in mosquitto.conf

''' MQTT Setup '''

def on_connect(client, userdata, flags, rc):
    global altitude_thread
    altitude_thread = thread.setInterval(0.5, publish_all_alti)
    print("connected")

def on_subscribe(client, userdata, mid, granted_qos):
    pass

def on_message(client, userdata, message):
    # Not listening to anything bc the only time you would have to do switch
    # brokers is on disconnect
    pass

def on_disconnect(client, userdata, rc):
    global altitude_thread
    print("I'm disconnected")
    altitude_thread.cancel()

    # Connects to new broker on backup when main loses power
    broker = backupBroker
    client.connect(broker,port,keepalive=5)
    client.loop_forever()

def publish_all_alti():
    try:
        alt = "%.1f" % ALT.altitude()
        client.publish("altimeter/altitude", alt)

        temp = "%.1f" % ALT.temperature()
        client.publish("altimeter/temperature", temp)

        press = "%.1f" % ALT.pressure()
        client.publish("altimeter/pressure", press)

    except:
        altitude_thread.cancel()
        client.publish("altimeter/altitude", "Disconnected")
        client.publish("altimeter/temperature", "Disconnected")
        client.publish("altimeter/pressure", "Disconnected")

# Instantiates new client. Make sure the name is diff from others
clientID = "lower" + str(time.time())
client = paho.Client(clientID, transport='websockets')

# Callback functions for client set when .loop_start() called
client.on_connect = on_connect
client.on_subscribe = on_subscribe
client.on_message = on_message
client.on_disconnect = on_disconnect

# Subscribes to "hoist" first time connected
client.connect(broker, port, keepalive=5)
client.loop_forever()
