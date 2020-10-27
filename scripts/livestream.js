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

        // Img
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
        DOM.maximize.eq(0).on('click', fullScreen.bind(null, 0));
        DOM.maximize.eq(1).on('click', fullScreen.bind(null, 1));
        DOM.maximize.eq(2).on('click', fullScreen.bind(null, 2));
        DOM.maximize.eq(3).on('click', fullScreen.bind(null, 3));
        DOM.maximize.eq(4).on('click', fullScreen.bind(null, 4));
        DOM.maximize.eq(5).on('click', fullScreen.bind(null, 5));
        DOM.maximize.eq(6).on('click', fullScreen.bind(null, 6));

        DOM.editing.eq(0).on('click', toggleEdit.bind(null, 0));
        DOM.editing.eq(1).on('click', toggleEdit.bind(null, 1));
        DOM.editing.eq(2).on('click', toggleEdit.bind(null, 2));
        DOM.editing.eq(3).on('click', toggleEdit.bind(null, 3));
        DOM.editing.eq(4).on('click', toggleEdit.bind(null, 4));
        DOM.editing.eq(5).on('click', toggleEdit.bind(null, 5));
        DOM.editing.eq(6).on('click', toggleEdit.bind(null, 6));

        DOM.br.eq(0).on('input', brightness.bind(DOM.br.eq(0), 0));
        DOM.br.eq(1).on('input', brightness.bind(DOM.br.eq(1), 1));
        DOM.br.eq(2).on('input', brightness.bind(DOM.br.eq(2), 2));
        DOM.br.eq(3).on('input', brightness.bind(DOM.br.eq(3), 3));
        DOM.br.eq(4).on('input', brightness.bind(DOM.br.eq(4), 4));
        DOM.br.eq(5).on('input', brightness.bind(DOM.br.eq(5), 5));
        DOM.br.eq(6).on('input', brightness.bind(DOM.br.eq(6), 6));

        DOM.con.eq(0).on('input', contrast.bind(DOM.con.eq(0), 0));
        DOM.con.eq(1).on('input', contrast.bind(DOM.con.eq(1), 1));
        DOM.con.eq(2).on('input', contrast.bind(DOM.con.eq(2), 2));
        DOM.con.on(3).on('input', contrast.bind(DOM.con.eq(3), 3));
        DOM.con.eq(4).on('input', contrast.bind(DOM.con.eq(4), 4));
        DOM.con.eq(5).on('input', contrast.bind(DOM.con.eq(5), 5));
        DOM.con.eq(6).on('input', contrast.bind(DOM.con.eq(6), 6));
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
