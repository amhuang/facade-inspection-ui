/*
VIDEO SETTING SLIDERS

Functions that change the brightness/contrast of MJPG streams
and hide/reveal and reset the sliders when the settings button is
clicked.
*/

    var streamLink;
    var whichStream;

    function setLivestreamSrcs() {
        var upperCamerasIP = "http://" + document.getElementById('upperpi').value + ":8080/?action=stream_";
        var lowerCamerasIP = "http://" + document.getElementById('lowerpi').value + ":8080/?action=stream_";

        document.getElementById('livestream-1').src = upperCamerasIP + "0";
        document.getElementById('livestream-2').src = upperCamerasIP + "1";
        document.getElementById('livestream-3').src = upperCamerasIP + "2";
        document.getElementById('livestream-4').src = lowerCamerasIP + "0";
        document.getElementById('livestream-5').src = lowerCamerasIP + "1";
        document.getElementById('livestream-6').src = lowerCamerasIP + "2";
    }

    function fullScreen(x) {
        var srcVideo = document.getElementById('livestream-' + x);
        var fullVideo = document.getElementById('livestream-0');
        var fullScreen = document.getElementById('fullscreen');
        var allVideos = document.getElementById('all-videos');

        whichStream = x;
        streamLink = srcVideo.src;

        fullScreen.style.display = "block";
        allVideos.style.display = "none";

        srcVideo.src = "";
        fullVideo.src = streamLink;
    }

    function minimize() {
        var srcVideo = document.getElementById('livestream-' + whichStream);
        var fullVideo = document.getElementById('livestream-0');
        var fullScreen = document.getElementById('fullscreen');
        var allVideos = document.getElementById('all-videos');

        fullScreen.style.display = "none";
        allVideos.style.display = "block";

        fullVideo.src = "";
        srcVideo.src = streamLink;
    }

    // @param x = which livestream it is
    function hideSliders(x) {
        whichSetting = "settings-" + x;
        var settings = document.getElementById(whichSetting);

        if (settings.style.opacity == 0) {
            settings.style.visibility = "visible";
            settings.style.opacity = 1;
        }
        else {
            settings.style.visibility = "hidden";
            settings.style.opacity = 0;

            // reset video
            var video = document.getElementById('livestream-' + x);
            video.style.filter = "contrast(100%) brightness(100%)";

            setTimeout(function() {
                document.getElementById('contrast-' + x).value = 100;
                document.getElementById('brightness-' + x).value = 100;
            }, 200);

        }
    }

    // @param value = this.value of the input slider (see HTML)
    //        x = which livestream it is
    function brightness(value, x) {
        var video = document.getElementById('livestream-' + x);
        var contrast = document.getElementById('contrast-' + x).value;

        video.style.filter = "contrast(" + contrast + "%) brightness(" + value + "%)";
    }

    function contrast(value, x) {
        var video = document.getElementById('livestream-' + x);
        var brightness = document.getElementById('brightness-' + x).value;

        video.style.filter = "contrast(" + value + "%) brightness(" + brightness + "%)";
    }
