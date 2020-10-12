#!/bin/bash
cd /home/pi/facadeinspection/mqttserver

(sleep 10
python3 start_stream.py) &

(sleep 3
python3 lower_mqtt.py)

function finish
{
    sudo killall mjpg_streamer
    sudo service mosquitto stop
    echo cleaned up
}
trap finish EXIT

