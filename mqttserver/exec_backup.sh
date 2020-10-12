#!/bin/bash
cd /home/pi/facadeinspection/mqttserver

sleep 10
python3 backup_mqtt.py

function finish
{
    sudo service mosquitto stop
    echo cleaned up
}
trap finish EXIT

