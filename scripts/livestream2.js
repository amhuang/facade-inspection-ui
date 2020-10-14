/*
VIDEO SETTING SLIDERS

Functions that change the brightness/contrast of MJPG streams
and hide/reveal and reset the sliders when the settings button is
clicked.
*/

    var streamLink;
    var whichStream;

    function setLivestreamSrcs() {
        var upperCamerasIP = "http://" + $('#upperpi').val() + ":8080/?action=stream_";
        var lowerCamerasIP = "http://" + $('#lowerpi').val() + ":8080/?action=stream_";

        $('#livestream-1').attr("src", upperCamerasIP + "0");
        $('#livestream-2').attr("src", upperCamerasIP + "1");
        $('#livestream-3').attr("src", upperCamerasIP + "2");
        $('#livestream-4').attr("src", lowerCamerasIP + "0");
        $('#livestream-5').attr("src", lowerCamerasIP + "1");
        $('#livestream-6').attr("src", lowerCamerasIP + "2");
    }

    function fullScreen(x) {
        var srcVideo = $('#livestream-' + x);
        var fullVideo = $('#livestream-0');
        var fullScreen = $('#fullscreen');
        var allVideos = $('#all-videos');

        whichStream = x;
        streamLink = srcVideo.attr("src");

        fullScreen.show();
        allVideos.hide();

        srcVideo.attr("src", "");
        fullVideo.attr("src", streamLink);
    }

    function minimize() {
        var srcVideo = $('#livestream-' + whichStream);
        var fullVideo = $('#livestream-0');
        var fullScreen = $('#fullscreen');
        var allVideos = $('#all-videos');

        fullScreen.hide();
        allVideos.show();

        fullVideo.attr("src", "");
        srcVideo.attr("src", streamLink);
    }

    // @param x = which livestream it is
    function hideSliders(x) {
        var settings = $('#settings-' + x);

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
