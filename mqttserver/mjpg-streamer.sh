# Run this before running this script the first time:
# sudo chmod u+x mjpg-streamer.sh

{
	mjpg_streamer -i "input_uvc.so -d /dev/video0 -r 1920x1080" -i "input_uvc.so -d /dev/video2 -r 1920x1080" -i "input_uvc.so -d /dev/video4 -r 1920x1080" -o "output_http.so -p 8080"
} || {
	mjpg_streamer -i "input_uvc.so -d /dev/video0 -r 1920x1080" -i "input_uvc.so -d /dev/video2 -r 1920x1080" -o "output_http.so -p 8080"
} || {
	mjpg_streamer -i "input_uvc.so -d /dev/video0 -r 1920x1080" -o "output_http.so -p 8080"
}
