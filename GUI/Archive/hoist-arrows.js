/*
HOIST CONTROL - NOT USING THIS ANYMORE

Event listeners for up/down key presses that control movement
of the hoist. Include this at bottom of body tag in index.html
*/

var hoistIP = document.getElementById('pi-connections').dataset.upperpi
    + document.getElementById('pi-connections').dataset.hoistPort ;
var minPress = 300;  // ms to hold for key press to register
var pressTime = 0;
var currentTime;
var firstPress = true;

var hoistUp = new Paho.MQTT.Message("up");
var hoistDown = new Paho.MQTT.Message("down");
var hoistOff = new Paho.MQTT.Message("off");
hoistUp.destinationName = "hoist";
hoistDown.destinationName = "hoist";
hoistOff.destinationName = "hoist";

var arrowUp = document.getElementById('up-arrow');
var arrowDown = document.getElementById('down-arrow');

// Event listeners for up and down key presses
document.body.addEventListener("keydown", e => {
	// pressTime set the moment the key is pressed
	if (pressTime == 0) {
		pressTime = new Date();
	}
	// currentTime refreshes as key is held down
	currentTime = new Date();

	/* If first time X key has been pressed AND X key has been held down for
		over Y ms, and firstPress change arrow color and the Flask pg the
		hidden iframe src links to (runs motor) */
	if ( firstPress && (currentTime - pressTime > minPress) ) {
		firstPress = false;

		if (event.key == "ArrowUp") {
			arrowUp.style.opacity = "0.9";
		}
		if (event.key == "ArrowDown") {
			arrowDown.style.opacity = "0.9";
		}
	}
});
document.body.addEventListener("keyup", e => {
	// pressTime resets every time key is let go
	firstPress = true;
	pressTime = 0;

	// Resets arrow color and iframe src
	arrowUp.style.opacity = "0.6";
	arrowDown.style.opacity = "0.6";
});


// Event listeners for mouse presses

arrowUp.addEventListener('mousedown', event => {
	if (pressTime == 0) {
		pressTime = new Date();
	}
	while (true) {
		currentTime = new Date();

		if (currentTime - pressTime > minPress) {
			arrowUp.style.opacity = "0.9";
			break;
		}
	}
});

arrowDown.addEventListener('mousedown', event => {
	if (pressTime == 0) {
		pressTime = new Date();
	}
	while (true) {
		currentTime = new Date();

		if (currentTime - pressTime > minPress) {
			arrowDown.style.opacity = "0.9";
			break;
		}
	}
});

arrowUp.addEventListener('mouseup', event => {
	pressTime = 0;
	arrowUp.style.opacity = "0.6";
});

arrowDown.addEventListener('mouseup', event => {
	pressTime = 0;
	arrowDown.style.opacity = "0.6";
});
