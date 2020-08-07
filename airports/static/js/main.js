/*jshint*/
/*jslint*/

/*global
    Airport, $, event, ga, google, window
*/

$.fn.pressEnter = function (fn) {
    'use strict';
    return this.each(() => {
        $(this).bind('enterPress', fn);
        $(this).keyup((event) => {
            if (event.keyCode === 13) {
                $(this).trigger("enterPress");
            }
        });
    });
};

var App = {};

App.init = (google_maps_key, airport_json) => {
    'use strict';
    var self = this;

    this.google_maps_key = google_maps_key;
    this.base_url = 'BASE_URL';
    this.loading = false;
    this.load_timer_running = false;
    this.load_timer = null;
    this.current = null;
    this.max_zoom = -1;
    this.autoplay = false;
    this.autoplay_timer = null;
    this.hide_message_timer = null;
    this.additional_copyright_div = null;

    this.map = new google.maps.Map(
        $('#map')[0],
        {
            mapTypeId: google.maps.MapTypeId.SATELLITE,
            disableDefaultUI: true,
            mapTypeControl: false,
            navigationControl: false,
            disableDoubleClickZoom: false,
            draggable: false,
            scrollwheel: false,
            streetViewControl: false,
            backgroundColor: '#000000'
        }
    );
    this.max_zoom_service = new google.maps.MaxZoomService();

    this.loadAirportFromJson(airport_json);

    // setup event handlers
    google.maps.event.addListener(this.map, 'click', () => {
        self.track('map', 'click');
        self.loadAirport("");
    });

    google.maps.event.addDomListener(window, 'resize', () => {
        google.maps.event.trigger(self.map, 'resize');
        self.fitMap();
    });

    $('#control-about').click(() => {
        self.track('sidebar', 'open about');
        self.openAboutOverlay();
    });
    $('#control-fullscreen').click(() => {
        self.track('sidebar', 'fullscreen');
        self.toggleFullScreen();
    });
    $('#label-container').click(() => {
        self.track('label', 'open info', self.current.get_icao());
        self.openInfoOverlay();
    });
    $('#control-random').click(() => {
        self.track('sidebar', 'random');
        self.loadAirport("");
    });
    $('#control-play').click(() => {
        self.track('sidebar', 'play');
        self.toggleAutoPlay();
    });

    $('#about-overlay').click((event) => {
        // don't close info overlay when clicking on a link
        if (event.target && event.target.tagName === 'A') {
            event.stopPropagation();
            return;
        }
        self.closeAboutOverlay();
    });
    $('#about-overlay .close-button').click((event) => {
        event.stopPropagation();
        self.closeAboutOverlay();
    });

    $('#message-container').click(() => {
        self.closeMessage();
    });

    $('#info-overlay').click(() => {
        self.closeInfoOverlay();
    });
    $('#info-overlay .close-button').click(() => {
        self.closeInfoOverlay();
    });

    $('#info-overlay #open-google-maps').click((event) => {
        self.track('info', 'google maps', self.current.get_icao());
        event.stopPropagation();
        self.openGoogleMaps();
    });
    $('#info-overlay #info-minimap').click((event) => {
        self.track('info', 'mini map', self.current.get_icao());
        event.stopPropagation();
        self.openGoogleMaps();
    });
    $('#info-overlay #open-ourairports').click((event) => {
        self.track('info', 'ourairports', self.current.get_icao());
        event.stopPropagation();
        self.openOurAirports();
    });

    $('#control-search').click(() => {
        self.track('sidebar', 'search');
        self.showSearch();
    });
    $('#search-overlay-search').click(() => {
        self.performSearch();
    });
    $('#search-overlay-query').pressEnter(() => {
        self.performSearch();
    });
    $('#search-overlay .close-button').click(() => {
        self.closeSearch();
    });
    $('#onboarding-overlay').click(() => {
        self.closeOnboarding();
    });
    $('#onboarding-overlay .close-button').click(() => {
        self.closeOnboarding();
    });
    if (self.getCookie('alreadybeenhere') === "") {
        self.showOnboarding();
    }
    self.setCookie('alreadybeenhere', 'yes', 30);
};

App.displayMessage = (message) => {
    'use strict';

    var self = this;

    this.track('map', 'message', message);
    $('#message-container').text(message);
    $('#message-container').fadeIn(500);

    if (this.hide_message_timer) {
        clearInterval(this.hide_message_timer);
    }
    this.hide_message_timer = setInterval(() => {
        self.closeMessage();
    }, 10 * 1000);
};

App.closeMessage = () => {
    'use strict';

    $('#message-container').fadeOut(500);
    if (this.hide_message_timer) {
        clearInterval(this.hide_message_timer);
    }
    this.hide_message_timer = null;
};

App.showSearch = () => {
    'use strict';

    this.stopAutoPlay();
    $('#controls').fadeOut(500);
    $('#label-container').fadeOut(500);
    $('#search-overlay').fadeIn(500);
    $('#search-overlay-query').val('');
    $('#search-overlay-query').focus();
};

App.closeSearch = () => {
    'use strict';

    $('#controls').fadeIn(500);
    $('#label-container').fadeIn(500);
    $('#search-overlay').fadeOut(500);
};

App.showOnboarding = () => {
    'use strict';

    this.stopAutoPlay();
    $('#controls').hide();
    $('#label-container').hide();
    $('#onboarding-overlay').show();
};

App.closeOnboarding = () => {
    'use strict';

    $('#controls').fadeIn(500);
    $('#label-container').fadeIn(500);
    $('#onboarding-overlay').fadeOut(500);
};

App.sanitize_query = (query) => {
    'use strict';

    return query.trim().replace(/\s+/g, ' ').toUpperCase().replace(/[^A-Za-z0-9\-\ ]/g, '');
};

App.performSearch = () => {
    'use strict';

    var self = this,
        query = $('#search-overlay-query').val();
    this.closeSearch();
    this.track('search', 'query', query);
    $.post("/api/search", {
        q: query
    }, (data) => {
        if (data.airport) {
            self.loadAirportFromJson(data.airport);
        } else {
            self.displayMessage('Cannot find airport matching "' + query + '".');
        }
    });
};

App.getBoundsZoomLevel = (bounds) => {
    'use strict';

    var WORLD_DIM = {
        height: 256,
        width: 256
    };
    var ZOOM_MAX = 21;

    latRad = (lat) => {
        var sin = Math.sin(lat * Math.PI / 180);
        var radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
        return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
    };

    zoom = (mapPx, worldPx, fraction) => {
        return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
    };

    var ne = bounds.getNorthEast();
    var sw = bounds.getSouthWest();

    var latFraction = (latRad(ne.lat()) - latRad(sw.lat())) / Math.PI;

    var lngDiff = ne.lng() - sw.lng();
    var lngFraction = ((lngDiff < 0)
        ? (lngDiff + 360)
        : lngDiff) / 360;

    var latZoom = zoom($('#map').height(), WORLD_DIM.height, latFraction);
    var lngZoom = zoom($('#map').width(), WORLD_DIM.width, lngFraction);

    return Math.min(latZoom, lngZoom, ZOOM_MAX);
};

App.adjustZoom = () => {
    'use strict';

    var needed_zoom = this.current.get_zoom();
    if (!this.current.get_bounds().getNorthEast().equals(this.current.get_bounds().getSouthWest())) {
        needed_zoom = this.getBoundsZoomLevel(this.current.get_bounds());
    }

    if (this.max_zoom < 0) {
        this.map.setZoom(needed_zoom);
    } else {
        this.map.setZoom(Math.min(needed_zoom, this.max_zoom));
    }
};

App.fitMap = () => {
    'use strict';

    if (!this.current) {
        return;
    }

    google.maps.event.trigger(this.map, 'resize');
    this.map.setCenter(this.current.get_pos());

    if (this.max_zoom < 0) {
        var self = this;
        this.max_zoom_service.getMaxZoomAtLatLng(this.current.get_pos(), (response) => {
            if (response.status === google.maps.MaxZoomStatus.OK) {
                self.max_zoom = response.zoom;
            } else {
                self.max_zoom = -1;
            }
            self.adjustZoom();
        });
    } else {
        this.adjustZoom();
    }
};

App.startAutoPlay = () => {
    'use strict';

    var self = this;

    this.autoplay = true;
    $('#control-play > i').removeClass('fa-play').addClass('fa-pause');
    if (this.autoplay_timer) {
        clearInterval(this.autoplay_timer);
    }
    this.autoplay_timer = setInterval(() => {
        self.loadAirport("");
    }, 30 * 1000);
};

App.stopAutoPlay = () => {
    'use strict';

    if (this.autoplay_timer) {
        clearInterval(this.autoplay_timer);
        this.autoplay_timer = null;
    }
    $('#control-play > i').removeClass('fa-pause').addClass('fa-play');
    this.autoplay = false;
};

App.toggleAutoPlay = () => {
    'use strict';

    if (this.autoplay) {
        this.stopAutoPlay();
    } else {
        this.startAutoPlay();
    }
};

App.openGoogleMaps = () => {
    'use strict';

    if (!this.current) {
        return;
    }

    var url = `https://www.google.com/maps/@${this.map.getCenter().lat().toFixed(6)},${this.map.getCenter().lng().toFixed(6)},${this.map.getZoom()}z`;

    window.open(url, '_blank');
};

App.openOurAirports = () => {
    'use strict';

    if (!this.current) {
        return;
    }

    var url = `http://ourairports.com/airports/${this.current.get_icao()}`;

    window.open(url, '_blank');
};

App.openAboutOverlay = () => {
    'use strict';

    $('#controls').fadeOut(500);
    $('#label-container').fadeOut(500);
    $('#about-overlay').fadeIn(500);
};

App.closeAboutOverlay = () => {
    'use strict';

    $('#about-overlay').fadeOut(500);
    $('#controls').fadeIn(500);
    $('#label-container').fadeIn(500);
};

App.jumpTo = (id) => {
    'use strict';

    event.stopPropagation();
    this.closeInfoOverlay();
    this.closeSearch();
    this.loadAirport(id);
};

App.openInfoOverlay = () => {
    'use strict';

    this.stopAutoPlay();
    $('#info-label').text(this.current.get_label());
    $('#info-location').text(this.current.get_location_name());

    const lat = this.map.getCenter().lat();
    const lng = this.map.getCenter().lng();
    const x = (512 * (lng + 180)) / 360;
    const y = 200 - (512 * Math.log(Math.tan((Math.PI / 4) + (lat * Math.PI / 360))) / (2 * Math.PI));
    $("#info-minimap-marker").css({top: y - 16, left: x - 16});

    if (this.current.get_wiki_data()) {
        $('#wiki').removeClass('hidden');
        $('#wiki_data').text(this.current.get_wiki_data());
        $('#wiki_url a').attr("href", this.current.get_wiki_url());
    } else {
        $('#wiki').addClass('hidden');
    }

    $('#controls').fadeOut(500);
    $('#label-container').fadeOut(500);
    $('#info-overlay').fadeIn(500);
};

App.closeInfoOverlay = () => {
    'use strict';

    $('#info-overlay').fadeOut(500);
    $('#controls').fadeIn(500);
    $('#label-container').fadeIn(500);
};

App.updateLabel = () => {
    'use strict';

    if (this.current) {
        window.history.replaceState({}, `${this.current.get_label()} [Random Aiports]`, `/a/${this.current.get_icao()}`);
        $('link[rel="canonical"]').attr('href', `${this.base_url}/a/${this.current.get_icao()}`);
        $('#label').html(this.current.get_label());
        $('#location').html(this.current.get_location_name());
        document.title = `${this.current.get_label()} [Random Aiports]`;
    } else {
        window.history.replaceState({}, "[Random Aiports]", "/");
        $('link[rel="canonical"]').attr('href', this.base_url);
        $('#label').html('Random Airports');
        $('#location').html('');
        document.title = "[Random Aiports]";
    }
};

App.onStartLoading = () => {
    'use strict';

    if (!this.loading) {
        return;
    }

    if (this.load_timer_running) {
        clearTimeout(this.load_timer);
        this.load_timer = null;
        this.load_timer_running = false;
    }

    google.maps.event.clearListeners(this.map, 'tilesloaded');

    var map_buffer = $('#map-buffer');
    if (map_buffer) {
        map_buffer.remove();
    }

    $('#control-random > i').addClass('fa-spin');
    $('#container').prepend($('#map').clone(false).attr('id', 'map-buffer'));
};

App.onFinishLoading = () => {
    'use strict';

    if (!this.loading) {
        return;
    }

    if (this.load_timer_running) {
        clearTimeout(this.load_timer);
        this.load_timer = null;
        this.load_timer_running = false;
    }

    google.maps.event.clearListeners(this.map, 'tilesloaded');

    var map_buffer = $('#map-buffer');
    if (map_buffer) {
        map_buffer.remove();
    }

    $('#control-random > i').removeClass('fa-spin');
    this.loading = false;
};

App.loadAirport = (icao) => {
    'use strict';

    if (this.loading) {
        return;
    }
    this.loading = true;
    this.onStartLoading();

    var self = this,
        sanitized_icao = this.sanitize_query(icao);

    if (sanitized_icao !== "") {
        $.get(`/api/get/${sanitized_icao}`, (data) => {
            if (data.airport !== undefined) {
                self.loadAirportFromJson(data.airport);
            } else {
                self.displayMessage(`Error loading requested airport (${sanitized_icao}). Loading a random airport instead.`);
                self.current = null;
                self.onFinishLoading();
                self.loadAirport("");
            }
        });
    } else {
        $.get("/api/random", (json_data) => {
            if (json_data.airport !== undefined) {
                self.loadAirportFromJson(json_data.airport);
            } else {
                self.displayMessage('Error loading random airport.');
                self.current = null;
                self.onFinishLoading();
            }
        });
    }
};

App.loadAirportFromJson = (json_airport) => {
    'use strict';

    if (json_airport.icao === undefined) {
        return;
    }

    var self = this;

    this.current = new Airport();
    this.current.load_from_json(json_airport);
    this.track('map', 'load', this.current.get_icao());

    google.maps.event.addListenerOnce(this.map, 'tilesloaded', () => {
        $('#map-buffer').fadeOut(500, () => {
            self.onFinishLoading();
        });
        self.updateLabel();
    });
    this.load_timer_running = true;
    this.load_timer = setTimeout(() => {
        $('#map-buffer').fadeOut(500, () => {
            self.onFinishLoading();
        });
        self.updateLabel();
    }, 5000);

    this.max_zoom = -1;
    this.fitMap();
};

App.setCookie = (cname, cvalue, exdays) => {
    'use strict';
    const d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    document.cookie = `${cname}=${cvalue}; expires=${d.toUTCString()}`;
};

App.getCookie = (cname) => {
    'use strict';
    var name = cname + "=",
        ca = document.cookie.split(';'),
        i,
        c;
    for (i = 0; i < ca.length; i += 1) {
        c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
};

App.toggleFullScreen = () => {
    'use strict';
    var doc = window.document,
        docEl = doc.documentElement,
        requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen,
        cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

    if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
        requestFullScreen.call(docEl);
    } else {
        cancelFullScreen.call(doc);
    }
};

App.track = (...args) => {
    'use strict';
    if (typeof ga === 'function') {
        ga('send', 'event', ...args);
    }
};
