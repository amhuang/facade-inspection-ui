''' Upper Pi
'''
import time
import paho.mqtt.client as paho
import subprocess
#import setInterval as thread
import mpu6050
import hoist_control as HOIST
import timer

''' MQTT Setup '''

#getip = subprocess.Popen(['hostname', '-I'], stdout=subprocess.PIPE)
#broker = getip.stdout.read().decode('utf-8')    # IP of broker Pi
broker = "192.168.1.253"
port = 9001                 # Set in mosquitto.conf

angle_error_count = 0
ACC = mpu6050.ACC(offset=0)
ignore_angle = False

topic, msg = '', ''
last_msg_timer = timer.Timer()
exec_shutdown = timer.Timer()

'''
MQTT Callback Functions
'''

def on_connect(client, userdata, flags, rc):
    global angle_thread, timefromground_thread

    client.subscribe("hoist")
    client.subscribe("time/fromground")
    client.subscribe("accelerometer/status")
    print("connected")

    angle_thread = timer.setInterval(0.25, publish_angle)
    angle_thread.start()
    timefromground_thread = timer.setInterval(5, publish_timefromground)
    timefromground_thread.start()

def on_subscribe(client, userdata, mid, granted_qos):
   pass

def on_message(client, userdata, message):
    global topic, msg
    topic = message.topic
    msg = message.payload.decode("utf-8")
    last_msg_timer.start()

def on_disconnect(client, userdata, rc):
    global angle_thread, broker, port
    stop()
    angle_thread.cancel()
    print("client disconnected. Reason code", rc)
    client.connect(broker, port, keepalive=3)

'''
Processing and publishing data
'''

angle_lst = [0,1,2,3,4,5]  # keeps track of prev angles
angle_i = 0

def publish_angle():
    global angle_thread, angle_lst, angle_i, angle_error_count
    try:
        if (angle_i == 6):
            angle_i = 0

        angle = ACC.angle()
        angle_lst[angle_i] = angle
        angle_i += 1

        if (all_same(angle_lst)):
            stop()
            print("all same - accelerometer disconnected")
            client.publish("accelerometer/angle", "Disconnected")
            angle_thread.cancel()
            return

        client.publish("accelerometer/angle", angle)
        angle_error_count = 0

    except:
        accel_disconnect()

def accel_disconnect():
    global angle_error_count, angle_thread

    angle_error_count += 1

    # Stops publishing accel data if disconnected for over 1sec
    if angle_error_count == 10:
        HOIST.stop()
        angle_thread.cancel()
        print("accelerometer disconnect 1s")
        client.publish("accelerometer/angle", "Disconnected")

def all_same(lst):
    return not lst or lst.count(lst[0]) == len(lst)

def publish_timefromground():
    client.publish('time/fromground', str(HOIST.time_from_ground.curr))

'''
Creates and runs an MQTT client
'''
clientID = "upper" + str(time.time())
client = paho.Client(clientID, transport='websockets')
client.on_connect = on_connect
client.on_subscribe = on_subscribe
client.on_message = on_message
client.on_disconnect = on_disconnect

client.will_set("status", "Upper Pi client disconnected", retain=False)
client.connect(broker, port, keepalive=3)

try:
    while True:
        client.loop_start()

        if (last_msg_timer.countup() >= 1 or HOIST.time_from_ground.curr <= -5):
            # timer starts in on_message received
            HOIST.stop()

        elif topic == "hoist":
            #exec_shutdown.start()
            print(msg)

            if msg == "Off":
                HOIST.stop()

            elif msg == "Switch to backup":
                client.unsubscribe("hoist")

            elif msg == "Make level":
                HOIST.make_level()

            elif msg == "Toggle leveling":
                if ignore_angle:
                    ignore_angle = False
                else:
                    ignore_angle = True

            else:
                if msg == "Up":
                    if ignore_angle:
                        HOIST.up_both()
                    else:
                        HOIST.level_up()

                elif msg == "Down":
                    if ignore_angle:
                        HOIST.down_both()
                    else:
                        HOIST.level_down()

                elif msg == "Up left":
                    HOIST.up_left()

                elif msg == "Up right":
                    HOIST.up_right()

                elif msg == "Down left":
                    HOIST.down_left()

                elif msg == "Down right":
                    HOIST.down_right()

        elif topic == "accelerometer/status":

            if msg == "Ignore angle":
                HOIST.ignore_angle = True

            elif msg == "Stop ignoring angle":
                HOIST.ignore_angle = False

            elif msg == "Zero accelerometer":
                ACC.offset = ACC.angle_raw()
                HOIST.set_offset(ACC.offset)
                print("Accelerometer zeroed. Offset: ", ACC.offset)

        elif topic == "time/fromground":
            print('time received ', msg)
            HOIST.set_time(float(msg))
            client.unsubscribe('time/fromground')

        '''
        if (exec_shutdown.countup() > 10):
            while (exec_shutdown.countdown() > 0):
                HOIST.down_both()
            HOIST.stop()

        '''
        msg, topic = '', ''
        client.loop_stop()

finally:
    # opens relays broker keeps running but this file doesnt
    # and disconnect is ungraceful
    client.loop_stop()
    client.disconnect()
    HOIST.stop()
