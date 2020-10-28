/*
MQTT Javascript Client
*/

var mqtt = function() {

    /* ----- MODULE-WIDE VARIABLES ----- */

    var DOM = {};
    var client;
    var minPress = 300;         // min ms to hold for key/mouse
    var firstPress = true;      // limit keypress to firing only once
    var indivHoistMode = false;
    var levelingEnabled = true;
    var sendFreq = 900;         // how often msg sent (hoist checks level)
    var reconnectAttempt = 0;   // only equals 0 the first time GUI is loaded

    var currHeight;
    var maxHeight = 1000;
    var maxHeightReached = false;
    var timeFromGnd = 0;            // sec from ground determined from hoistTimer
    var operationTime = 0;
    var accelDisconnected = false;
    var backupBroker = false;       // UI connected to backup broker

    // Timeouts
    var holdTimeout;            // delays hoist operation by minPress
    var reload;                 // delay before page reload

    // Intervals
    var movingInterval;         // sends msgs while arrows held down at sendFreq
    var connectedNoMsg;         // interval reconnect tried when no message received
    var hoistTimer;           // interval to keep track off timeFromGnd
    var recoverTimeHeight;     // interval that sends time from ground on disconnects
    var cycleTimer;             // times active duty time

    /* ----- INITIALIZING FUNCTIONS ----- */

    function cache() {

        getSessionStorage();

        // For MQTT connection
        DOM.document = $(document);
        DOM.port = 9001;
        if (backupBroker)
            DOM.host = $('#lowerpi').val();
        else
            DOM.host = $('#upperpi').val();

        // Hoist control buttons
        DOM.upArrow = $('#up-arrow');
        DOM.downArrow = $('#down-arrow');
        DOM.upLeftBox = $("#up-left-box");
        DOM.upRightBox = $("#up-right-box");
        DOM.downLeftBox = $("#down-left-box");
        DOM.downRightBox = $("#down-right-box");
        DOM.hoistMode = $("#hoist-mode");

        // Error popup and options
        DOM.popupError = $("#popup-error");
        DOM.errorMsg = $('#error-msg');
        DOM.closeError = $('#close-error');
        DOM.noLeveling = $("#no-leveling");
        DOM.switchBackup = $("#switch-backup");
        DOM.replaceWithBackup = $("#replace-with-backup");

        // Confirm popup and options
        DOM.popupConfirm = $("#popup-confirm");
        DOM.confirmMsg = $('#confirm-msg');
        DOM.confirmHeader = $("#confirm-header");
        DOM.confirmYes = $('#confirm-yes');
        DOM.confirmNo = $('#confirm-no');

        // Settings popup and option
        DOM.popupSettings = $('#popup-settings');
        DOM.showSettings = $('#show-settings');
        DOM.closeSettings = $('#close-settings');
        DOM.makeLevel = $('#make-level');
        DOM.toggleLeveling = $('#toggle-leveling');
        DOM.timeFromGnd = $('#time-from-ground');
        DOM.operationTime = $('#operation-time');
        DOM.resetIpAddr = $('#set-ip-addr');
        DOM.maxHeightInput = $('#max-height');
        DOM.setMaxHeight = $('#set-max-height');
        //DOM.setCycleTime = $('#set-cycle-time');

        // Data
        DOM.angle = $('#angle');
        DOM.height = $('#height');
        DOM.angleAnimation = $("#angle-animation");
        DOM.zeroAngle = $('#zero-angle');
        DOM.zeroHeight = $('#zero-height');
    }

    function getSessionStorage() {
        // retrieves stored session data for use in cache() if it exists

        if (sessionStorage.getItem("upper-ip") != null)
            $('#upperpi').val(sessionStorage.getItem("upper-ip"));

        if (sessionStorage.getItem("lower-ip") != null)
            $('#lowerpi').val(sessionStorage.getItem("lower-ip"));

        if (sessionStorage.getItem("backup-broker") != null)
            backupBroker = sessionStorage.getItem("backup-broker");

        if (sessionStorage.getItem("max-height") != null) {
            maxHeight = sessionStorage.getItem("max-height");
            $('#max-height').val(maxHeight + " ft");
        }
    }

    function bindEvents() {
        /* These are all the event listeners that need to be able to send MQTT
        or receive MQTT messages. This gets called in mqttConnect() instead of
        init() to avoid errors when not connected. */
        DOM.document.on({
            keydown: keyPress,
            keyup: keyRelease
        });
        DOM.upArrow.on({
            mousedown: arrowPress.bind(DOM.upArrow, "Up"),
            mouseup: arrowRelease.bind(DOM.upArrow),
            mouseleave: arrowRelease.bind(DOM.upArrow)
        });
        DOM.downArrow.on({
            mousedown: arrowPress.bind(DOM.downArrow, "Down"),
            mouseup: arrowRelease.bind(DOM.downArrow),
            mouseleave: arrowRelease.bind(DOM.downArrow)
        });
        DOM.upRightBox.on({
            mousedown: arrowPress.bind(DOM.upRightBox, "Up right"),
            mouseup: arrowRelease.bind(DOM.upRightBox.children()),
            mouseleave: arrowRelease.bind(DOM.upRightBox.children())
        });
        DOM.upLeftBox.on({
            mousedown: arrowPress.bind(DOM.upLeftBox.children(), "Up left"),
            mouseup: arrowRelease.bind(DOM.upLeftBox.children()),
            mouseleave: arrowRelease.bind(DOM.upLeftBox.children())
        });
        DOM.downRightBox.on({
            mousedown: arrowPress.bind(DOM.downRightBox.children(), "Down right"),
            mouseup: arrowRelease.bind(DOM.downRightBox.children()),
            mouseleave: arrowRelease.bind(DOM.downRightBox.children())
        });
        DOM.downLeftBox.on({
            mousedown: arrowPress.bind(DOM.downLeftBox.children(), "Down left"),
            mouseup: arrowRelease.bind(DOM.downLeftBox.children()),
            mouseleave: arrowRelease.bind(DOM.downLeftBox.children())
        });
        DOM.hoistMode.on('click', toggleHoistMode);

        // Settings and options
        DOM.makeLevel.on('click', function () {
            client.send(newMsg('Make level', 'hoist'));
        });
        DOM.toggleLeveling.on('click', toggleLeveling);

        // Zeroing data
        DOM.zeroAngle.on('click', zeroAngle);
        DOM.zeroHeight.on('click', zeroHeight);

        // Error popup and options
        DOM.closeError.on('click', closeError);
        DOM.noLeveling.on('click', closeError.bind(null, "Disable leveling"));
        DOM.switchBackup.on('click', closeError.bind(null, "Switch to backup"));
    }

    function bindSettings() {
        /* Binds event listeners in settings which don't rely on sending MQTT
        messages so they're accessible even when the GUI isn't connected */
        DOM.showSettings.on('click', toggleSettings);
        DOM.closeSettings.on('click', toggleSettings);
        DOM.replaceWithBackup.on('click', connectBackupPi);
        DOM.resetIpAddr.on('click', resetIpAddr);
        DOM.setMaxHeight.on('click', setMaxHeight);
        DOM.maxHeightInput.on('click', function() {
            DOM.maxHeightInput.val('');
        });
        DOM.confirmNo.on('click', function() {
            DOM.popupConfirm.hide()
        });
    }


    /* ----- MQTT CALLBACK & HELPER FUNCTIONS ----- */

    function mqttConnect() {
        var clientId = "gui"+new Date().getTime();
        client = new Paho.MQTT.Client(DOM.host, DOM.port, clientId);
        client.onConnectionLost = onConnectionLost;
        client.onMessageArrived = onMessageArrived;

        var options = {
            timeout: 3,
            onSuccess: onConnect,
            onFailure: onFailure,
            keepAliveInterval: 5,
            willMessage: newMsg('Off', 'hoist')
        };

        console.log('Connecting to: ' + DOM.host + ' on port: ' + DOM.port);
        client.connect(options);
    }

    function onConnect() {

        client.subscribe("status");
        client.subscribe("accelerometer/angle");
        client.subscribe("accelerometer/status");
        client.subscribe("height");

        bindEvents();

        // Retrieves in case of page refresh (last time msg received from Pi)
        if (sessionStorage.getItem("accel-disconnected") != null) {
            accelDisconnected = sessionStorage.getItem("accel-disconnected");
        } if (sessionStorage.getItem('time-from-ground') != null) {
            timeFromGnd = Number(sessionStorage.getItem('time-from-ground'));
        } if (sessionStorage.getItem('operation-time') != null) {
            operationTime = Number(sessionStorage.getItem('operation-time'));
        }

        displayTime(timeFromGnd, DOM.timeFromGnd);
        displayTime(operationTime, DOM.operationTime);

        currHeight = sessionStorage.getItem("curr-height");
        if (currHeight == null) {
            DOM.height.html("Disconnected");
        } else {
            DOM.height.html(currHeight + " ft");
        }

        // Setup for disconnected accelerometer. UI not expecting messages
        if (accelDisconnected) {
            levelingEnabled = false;
            DOM.toggleLeveling.hide();
            DOM.makeLevel.hide();
            DOM.hoistMode.children().html('Not Leveling');
            DOM.angle.html("Disconnected");
            DOM.angleAnimation.css({
                '-webkit-transform': 'rotate(0deg)',
                'transform': 'rotate(0deg)',
                'background': 'grey'
            });
        }

        // UI expecting messages but isn't getting them
        else if (!accelDisconnected) {
            // Connection to broker and should be receiving angle but it isn't
            // (client not running)
            connectedNoMsg = setTimeout(function() {
                onFailure();
                console.log('no message received');
            }, 4000);
            // Tries to send last stored timeFromGnd continuously in case of
            // disconnect so next Pi connected doesn't reset it to 0
            recoverTimeHeight = setInterval( function() {
                try {
                    client.send(newMsg(timeFromGnd.toString(), 'time/fromground'));
                    if (currHeight != null) {
                        client.send(newMsg(currHeight.toString(), 'height'));
                    }
                    console.log('sending time ', timeFromGnd.toString() + " and height " + currHeight);
                } catch {
                    console.log('send time failed');
                }
            }, 200);
        }
    }

    function onMessageArrived(message)  {
        var msg = message.payloadString;
        var topic = message.destinationName;

        clearTimeout(connectedNoMsg);
        clearInterval(recoverTimeHeight);

        // Not sub'd initially so it doesn't get its own messages
        // Relies on getting accelerometer messages to get time + height
        client.subscribe('time/fromground');
        client.subscribe('height');

        if ( reconnectAttempt > 0 ) {
            DOM.popupError.hide();
            notification('Hoist ready for operation.', 'Reconnected');
            reconnectAttempt = 0;
            console.log('reconnected');
        }

        if (topic == "status") {
            if (msg == "Upper Pi client disconnected") {
                console.log(msg);
                client.unsubscribe('time/fromground');
                client.unsubscribe('height');
            } else if (msg == "Backup Pi client connected") {
                console.log(msg);
            }
        } else if (topic == "accelerometer/status") {
            if (msg == "Disconnected") {
                accelerometerError();
                console.log('accelerometer disconnect');
            } else if (msg == "Backup disconnected") {
                accelerometerError(backup=true);
                console.log('accelerometer disconnect');
            }
        } else if (topic == "accelerometer/angle") {
            renderAngle(msg);
        } else if (topic == "time/fromground") {
            timeFromGnd = Number(msg);
            //console.log('time from ground received: ' + timeFromGnd);
            sessionStorage.setItem("time-from-ground", timeFromGnd);
            displayTime(timeFromGnd, DOM.timeFromGnd);
        } else if (topic == "height") {
            renderHeight(msg);
        }

    }

    function onFailure() {
        console.log('on failure');
        reconnect();
    }

    function onConnectionLost(responseObject) {
        console.log('Connection lost');
        console.log(responseObject);

        if (responseObject.errorCode == 5){
            //location.reload();
        }
        else {
            reconnect();
        }
    }

    function reconnect() {
        if (reconnectAttempt == 0) {
            DOM.popupError.show();
            DOM.closeError.hide();
            DOM.noLeveling.hide();
            DOM.switchBackup.hide();
            if (!backupBroker) {
                DOM.replaceWithBackup.show();
            }
            reconnectAttempt++;
        } else if (reconnectAttempt >= 20) {
            reconnectAttempt = 0;
            reload = setTimeout(function() {
                location.reload();
            }, 3000);
        }

        clearTimeout(reload);
        clearInterval(recoverTimeHeight);
        console.log('reconnecting');
        DOM.errorMsg.html("Hoist controls disconnected. Reconnect attempt: " + reconnectAttempt);

        setTimeout(function() {
            reconnectAttempt++;
            mqttConnect();
        }, 3000);
    }

    function newMsg(message, topic) {
        var msg = new Paho.MQTT.Message(message);
        msg.destinationName = topic;
        return msg;
    }

    function connectBackupPi() {
        sessionStorage.setItem("accel-disconnected", false);
        DOM.height.html("Disconnected");
        try {
            client.send(newMsg("Switch to backup", 'hoist'));
        } catch {
            backupBroker = true;
            sessionStorage.setItem('backup-broker', true);
            DOM.host = $('#lowerpi').val();
            DOM.errorMsg.append("<br><br>Connecting to backup...");
            DOM.replaceWithBackup.hide();
            mqttConnect();
        }
    }


    /* ----- DATA HANDLING & ANIMATIONS ----- */

    function accelerometerError(backup=false) {
        DOM.popupError.show();
        DOM.closeError.show();
        DOM.replaceWithBackup.hide();
        DOM.noLeveling.show();

        if (backup) {
            DOM.noLeveling.addClass("center");
            DOM.switchBackup.hide();
            DOM.noLeveling.on('click', closeError.bind(null, "Disable leveling"));
        } else {
            DOM.noLeveling.removeClass("center");
            DOM.switchBackup.show();
        }

        DOM.errorMsg.html("The accelerometer is disconnected. If you continue, there will be no leveling.");
        DOM.angle.html("Disconnected");
        DOM.angleAnimation.css({
            '-webkit-transform': 'rotate(0deg)',
            'transform': 'rotate(0deg)',
            'background': 'grey'
        });
    }

    // Processes accelerometer data from MQTT msg, displays and animates it
    function renderAngle(msg) {
        degrees = Number(msg).toFixed(1);
        DOM.angle.html(degrees + "&deg");

        if (degrees > 25 || degrees < -25) {
            DOM.angleAnimation.css({'background': '#ff8a65'});
        }
        else if (degrees > 2 || degrees < -2) {
            DOM.angleAnimation.css({
                '-webkit-transform': 'rotate('+degrees+'deg)',
                'transform': 'rotate('+degrees+'deg)',
                'background': '#ffe680'
            });
        } else {
            DOM.angleAnimation.css({
                '-webkit-transform': 'rotate('+degrees+'deg)',
                'transform': 'rotate('+degrees+'deg)',
                'background': '#a5d6a7'
            });
        }
    }

    // Processes rotary encoder data from MQTT messages and displays it
    function renderHeight(msg) {
        currHeight = Number(msg).toFixed(2);
        sessionStorage.setItem("curr-height", currHeight);
        DOM.height.html(currHeight + " ft");

        if (currHeight <= maxHeight - 2.7 && currHeight >= maxHeight - 3.3) {
            notification('You are 3 feet away from reaching the maximum height of ' + maxHeight + ' feet.', null);
            client.send(newMsg('Off', 'hoist'));
        } else if (currHeight >= maxHeight && !maxHeightReached) {
           notification('You have reached the maximum operating height of ' + maxHeight + ' feet.', null);
           maxHeightReached = true;
           client.send(newMsg('Off', 'hoist'));
        }
    }

    function timer(msg) {
        if (msg == 'Up') {
            hoistTimer = setInterval(function() {
                timeFromGnd += 1;
                operationTime += 1;
                displayTime(timeFromGnd, DOM.timeFromGnd);
                displayTime(operationTime, DOM.operationTime);
            }, 1000);
        } else if (msg == 'Down') {
            hoistTimer = setInterval(function() {
                timeFromGnd -= 1;
                operationTime += 1;
                displayTime(timeFromGnd, DOM.timeFromGnd);
                displayTime(operationTime, DOM.operationTime)
                if (timeFromGnd < 5.5 && timeFromGnd > 4.5) {
                    notification('You are ' + Math.round(timeFromGnd) + ' seconds away from the ground.', null);
                }
            }, 1000);
        } else if (msg == 'Up left' || msg == 'Up right') {
            hoistTimer = setInterval(function() {
                timeFromGnd += 0.5;
                operationTime += 1;
                displayTime(timeFromGnd, DOM.timeFromGnd);
                displayTime(operationTime, DOM.operationTime);
            }, 1000);
        } else if (msg == 'Down left' || msg == 'Down right') {
            hoistTimer = setInterval(function() {
                timeFromGnd -= 0.5;
                operationTime += 1;
                displayTime(timeFromGnd, DOM.timeFromGnd);
                displayTime(operationTime, DOM.operationTime);
            }, 1000);
        } else if (msg = 'Off') {
            clearInterval(hoistTimer);
        }
        sessionStorage.setItem("operation-time", operationTime);
    }

    function displayTime(time, text) {
        // Takes time as seconds
        var min = Math.floor(Math.abs(time)/60);
        var sec = Math.floor(Math.abs(time)%60);
        if (sec < 10) {
            sec = '0' + sec;
        }
        if (time < 0) {
            text.html('-' + min + ':' + sec);
        }
        else {
            text.html(min + ':' + sec);
        }
    }

    function notification(message, header) {
        client.send(newMsg('Off', 'hoist'));
        DOM.popupConfirm.toggle();

        if (DOM.confirmHeader.html() == null) {
            DOM.confirmHeader.hide();
        } else {
            DOM.confirmHeader.html(header);
        }

        DOM.confirmMsg.html(message);
        DOM.confirmYes.addClass('center');
        DOM.confirmYes.children().html('Continue');
        DOM.confirmNo.hide();

        DOM.confirmYes.on('click', function() {
            DOM.popupConfirm.hide();
            DOM.confirmHeader.show();
            DOM.confirmYes.removeClass('center');
            DOM.confirmYes.children().html('Confirm');
            DOM.confirmNo.show();
        });
    }


    /* ----- EVENT HANDLERS  ----- */

    function keyPress(event) {
        if ( firstPress && !indivHoistMode ) {
            firstPress = false;

            if (event.key == "ArrowUp") {
                // timeout forces key to be held for minPress to run
                holdTimeout = setTimeout( function() {
                    DOM.upArrow.addClass('active');
                    // starts timer counting up
                    timer('Up');
                    // sends initial message
                    client.send(newMsg('Up', 'hoist'));
                    // sends subsequent messages in intervals of sendFreq ms
                    movingInterval = setInterval( function() {
                        client.send(newMsg('Up', 'hoist'));
                    }, sendFreq);
                }, minPress);
            } else if (event.key == "ArrowDown") {
                holdTimeout = setTimeout( function() {
                    DOM.downArrow.addClass('active');
                    timer('Down');
                    client.send(newMsg('Down', 'hoist'));
                    movingInterval = setInterval( function() {
                        client.send(newMsg('Down', 'hoist'));
                    }, sendFreq);
                }, minPress);
            }

        }
    }

    function keyRelease(event) {
        clearTimeout(holdTimeout);
        clearInterval(movingInterval);
        firstPress = true;

        if ( (event.key == "ArrowUp" || event.key == "ArrowDown") &&
                !indivHoistMode ) {
            client.send(newMsg('Off', 'hoist'));
            DOM.upArrow.removeClass('active');
            DOM.downArrow.removeClass('active');
            timer('Off');
        }
    }

    function arrowPress(message) {
        if (firstPress == true) {
            firstPress = false;

            // timeout forces key to be held for minPress to run
            holdTimeout = setTimeout( function() {
                // sends initial message
                client.send(newMsg(message, 'hoist'));
                // starts timer counting in whichever direction message sets
                timer(message);
                // sends subsequent messages in intervals of sendFreq ms
                movingInterval = setInterval( function() {
                    client.send(newMsg(message, 'hoist'));
                    console.log(message);
                }, sendFreq);
            }, minPress);

            $(this).delay(minPress).addClass('active');
        }
    }

    function arrowRelease() {
        firstPress = true;
        clearTimeout(holdTimeout);
        clearInterval(movingInterval);
        timer('Off');
        client.send(newMsg('Off', 'hoist'));
        $(this).removeClass('active');
    }

    function toggleHoistMode() {

        client.send(newMsg('Off', 'hoist'));

        DOM.upArrow.removeClass('active');
        DOM.downArrow.removeClass('active');
        DOM.upArrow.toggle();
        DOM.downArrow.toggle();
        DOM.upLeftBox.toggle();
        DOM.upRightBox.toggle();
        DOM.downLeftBox.toggle();
        DOM.downRightBox.toggle();

        if (!indivHoistMode) {
            indivHoistMode = true;
            DOM.hoistMode.children().html('Individual');
        } else if (levelingEnabled) {
            indivHoistMode = false;
            DOM.hoistMode.children().html('Leveling');
        } else {
            indivHoistMode = false;
            DOM.hoistMode.children().html('No Leveling');
        }
    }

    function closeError(action = "default") {

        DOM.popupError.hide();
        DOM.noLeveling.hide();
        DOM.switchBackup.hide();
        DOM.errorMsg.html("");

        if (action == "default") {
            DOM.replaceWithBackup.show();
        } else if (action == "Disable leveling") {
            client.send(newMsg(action, 'hoist'));
            DOM.hoistMode.children().html('Not Leveling');
            DOM.toggleLeveling.hide();
            DOM.makeLevel.hide();
            levelingEnabled = false;
            sessionStorage.setItem("accel-disconnected", true);
        } else if (action == "Switch to backup") {
            client.send(newMsg(action, 'hoist'));
            DOM.height.html("Disconnected");
            // no longer disconnected w new Pi
            accelDisconnected = false;
            sessionStorage.setItem("accel-disconnected", false);
        }
    }

    function zeroAngle() {
        DOM.popupSettings.hide();
        DOM.popupConfirm.toggle();

        DOM.confirmHeader.html('Are you sure?');
        DOM.confirmMsg.html('Click confirm to zero the angle. The hoist should be on the ground to maximize accuracy.');

        DOM.confirmYes.on('click', function() {
            client.send(newMsg('Zero accelerometer', 'accelerometer/status'));
            DOM.popupConfirm.hide();
        });
    }

    function zeroHeight() {
        DOM.popupSettings.hide();
        DOM.popupConfirm.toggle();

        DOM.confirmHeader.html('Are you sure?');
        DOM.confirmMsg.html('Click confirm to zero the height from the ground. This will delete ALL height data from this session.');

        DOM.confirmYes.on('click', function() {
            client.send(newMsg('Zero height', 'height/status'));
            DOM.popupConfirm.hide();
            sessionStorage.setItem("curr-height", 0);
        });
    }

    function toggleSettings() {
        DOM.popupSettings.toggle();
        DOM.popupConfirm.hide();
    }

    function toggleLeveling() {
        client.send(newMsg('Toggle leveling', 'hoist'));

        if (levelingEnabled) {
            DOM.toggleLeveling.children().html('Enable leveling');
            DOM.hoistMode.children().html('Not Leveling');
            levelingEnabled = false;
        }
        else {
            DOM.toggleLeveling.children().html('Disable leveling');
            DOM.hoistMode.children().html('Leveling');
            levelingEnabled = true;
        }
    }

    function resetIpAddr(e) {
        e.preventDefault();
        DOM.popupSettings.hide();
        DOM.popupConfirm.toggle();
        DOM.popupConfirm.css({'z-index': '3'});
        DOM.confirmMsg.html('Click confirm to change the IP addresses you are connected to and to and reload the page.');

        DOM.confirmYes.on('click', function() {
            DOM.popupConfirm.hide();
            DOM.popupConfirm.css({'z-index': '1'});
            sessionStorage.setItem("upper-ip", $('#upperpi').val());
            sessionStorage.setItem("lower-ip", $('#lowerpi').val());
            location.reload();
        });
    }

    function setMaxHeight(e) {
        e.preventDefault();
        DOM.popupSettings.hide();
        DOM.popupConfirm.toggle();
        DOM.popupConfirm.css({'z-index': '3'});

        var tempVal = parseFloat(DOM.maxHeightInput.val());
        DOM.confirmMsg.html("Click confirm to set the maximum operating height to " + tempVal + " feet.");

        DOM.confirmYes.on('click', function() {
            DOM.popupConfirm.hide();
            DOM.popupConfirm.css({'z-index': '1'});
            maxHeight = tempVal;
            DOM.maxHeightInput.val(maxHeight + " ft");
            sessionStorage.setItem("max-height", maxHeight);
        });
    }


    /* ----- PUBLIC METHODS & EXPORT ----- */

    function init() {
        cache();
        bindSettings();
        mqttConnect();
    }

    return {
        init: init
    };
}();
