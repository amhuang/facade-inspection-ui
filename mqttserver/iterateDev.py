import subprocess
import re
import time

v4l2_dev = subprocess.Popen(['v4l2-ctl', '--list-devices'], stdout=subprocess.PIPE)
dev_info = str(v4l2_dev.stdout.read())

pattern = re.compile(r'(?<=\(usb-0000:01:00.0-1.[1-4]\):\\n\\t)/dev/video.')
devices = re.findall(pattern, dev_info)

port = 9010

for device in devices:
    print(device)
    subprocess.Popen(['mjpg_streamer',
                      '-i', "input_uvc.so -d " + device + " -r 1920x1080",
                      '-o', "output_http.so -p " + str(port)])
    port += 1
    time.sleep(2)
    