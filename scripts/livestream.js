/*
VIDEO SETTING SLIDERS

Functions that change the brightness/contrast of MJPG streams
and hide/reveal and reset the sliders when the settings button is
clicked.
*/
var livestream = function() {

    var whichVid;
    var DOM = {};

    /* ----- INITIALIZING FUNCTIONS ----- */

    function cache() {
        DOM.upperIp = "http://" + $('#upperpi').val() + ":8080/?action=stream_";
        DOM.lowerIp = "http://" + $('#lowerpi').val() + ":8080/?action=stream_";

        // Imgs
        DOM.vid0 = $('#livestream-0'); // video occupying fullscreen
        DOM.vid1 = $('#livestream-1'); // smaller 1/6 videos
        DOM.vid2 = $('#livestream-2');
        DOM.vid3 = $('#livestream-3');
        DOM.vid4 = $('#livestream-4');
        DOM.vid5 = $('#livestream-5');
        DOM.vid6 = $('#livestream-6');

        // Containers
        DOM.fullScreen = $('#fullscreen');
        DOM.allVideos = $('#all-videos');
        DOM.settings = $('.multi-slider');

        // Buttons
        DOM.editing = $('.show-editing');
        DOM.maximize = $('.show-fullscreen');

        // Sliders
        DOM.br = $('.slider.brightness');
        DOM.con = $('.slider.contrast');
    }

    function bindEvents() {
        for (let i=0; i < 7; i++) {
            DOM.maximize.eq(i).on('click', fullScreen.bind(null, i));
        }
        for (let i=0; i < 7; i++) {
            DOM.editing.eq(i).on('click', toggleEdit.bind(null, i));
        }
        for (let i=0; i < 7; i++) {
            DOM.br.eq(i).on('input', brightness.bind(DOM.br.eq(i), i));
        }
        for (let i=0; i < 7; i++) {
            DOM.con.eq(i).on('input', contrast.bind(DOM.con.eq(i), i));
        }
    }

    function setSrc() {
        DOM.vid1.attr("src", DOM.upperIp + "0");
        DOM.vid2.attr("src", DOM.upperIp + "1");
        DOM.vid3.attr("src", DOM.upperIp + "2");
        DOM.vid4.attr("src", DOM.lowerIp + "0");
        DOM.vid5.attr("src", DOM.lowerIp + "1");
        DOM.vid6.attr("src", DOM.lowerIp + "2");
    }


    /* ----- EVENT HANDLERS ----- */

    // @param x = which livestream it is
    function fullScreen(x) {
        if (x == 0) {   // currently full screen
            var link = DOM.vid0.attr("src");
            DOM.vid0.attr("src", "");
            getVideo(whichVid).attr("src", link);
        } else {        // currently minimzed
            whichVid = x;
            var link = getVideo(whichVid).attr("src");
            getVideo(whichVid).attr("src", "");
            DOM.vid0.attr("src", link);
        }

        DOM.fullScreen.toggle();
        DOM.allVideos.toggle();
    }

    function toggleEdit(x) {
        var settings = DOM.settings.eq(x);
        if (settings.css('display') == 'none') {
            settings.fadeIn(100);
        } else {
            settings.fadeOut(100);
            // resets video settings
            var video = getVideo(x);
            video.css('filter', 'contrast(100%) brightness(100%)');

            setTimeout(function() {
                DOM.br.val(100);
                DOM.con.val(100);
            }, 200);
        }
    }

    function brightness(x) {
        var brightness = $(this).val();
        var contrast = DOM.con.eq(x).val();
        var video = getVideo(x);
        video.css('filter', "contrast(" + contrast + "%) brightness(" + brightness + "%)");
    }

    function contrast(x) {
        var contrast = $(this).val();
        var brightness = DOM.br.eq(x).val();
        var video = getVideo(x);
        video.css('filter', "contrast(" + contrast + "%) brightness(" + brightness + "%)");
    }

    function getVideo(x) {
        switch(x) {
            case 0: return DOM.vid0;
            case 1: return DOM.vid1;
            case 2: return DOM.vid2;
            case 3: return DOM.vid3;
            case 4: return DOM.vid4;
            case 5: return DOM.vid5;
            case 6: return DOM.vid6;
        }
    }

    /* ----- PUBLIC METHODS & EXPORT ----- */

    function init() {
        cache();
        setSrc();
        bindEvents();
    }

    return {
        init: init
    };
}();
