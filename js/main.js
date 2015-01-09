$.fn.pressEnter = function(fn) {  
    return this.each(function() {  
        $(this).bind('enterPress', fn);
        $(this).keyup(function(e){
            if(e.keyCode == 13)
            {
              $(this).trigger("enterPress");
            }
        })
    });  
}; 


var app = {
  init : function() {
    app.loading = false;
    app.load_timeout = -1;
    app.current = null;
    app.max_zoom = -1;
    app.autoplay = false;
    app.autoplay_timer = null;
    app.hide_message_timer = null;
    app.additional_copyright_div = null;
    
    var opt = {
      mapTypeId: google.maps.MapTypeId.SATELLITE,
      disableDefaultUI: true, mapTypeControl: false, navigationControl: false, disableDoubleClickZoom: false,
      draggable: false, scrollwheel: false, streetViewControl: false,
      backgroundColor: '#000000'};
    app.map = new google.maps.Map($('#map')[0],opt);
    app.max_zoom_service = new google.maps.MaxZoomService();
    
    app.mapquest_tiles = new google.maps.ImageMapType({
      getTileUrl: function(coord, zoom) { return app.tileUrl("http://otile%s.mqcdn.com/tiles/1.0.0/osm/%z/%x/%y.png", ["1","2","3","4"], coord, zoom); },
      tileSize: new google.maps.Size(256, 256),
      name: "Mapquest",
      alt: "MapQuest (OSM)",
      maxZoom: 18 });
    app.map.mapTypes.set(app.mapquest_tiles.name, app.mapquest_tiles);
    app.mapquest_copyright_notice = '<div>Map data &copy; by <a href="http://www.openstreetmap.org/">OpenStreetMap.org</a> and its contributors; <a href="http://opendatacommons.org/licenses/odbl/">Open Database License</a>, tiles &copy; by <a href="http://mapquest.com">MapQuest</a></div>';
    
    // close welcome page if an airport is specified in the url
    if (History.getHash() != "") {
      app.closeWelcomeOverlay(true);
    }
    app.loadAirport(History.getHash());
    
    // setup event handlers
    google.maps.event.addListener(app.map, 'click', function(event) {
      app.track("map", "click");
      app.loadAirport("");
    });

    google.maps.event.addDomListener(window, 'resize', function() {
      google.maps.event.trigger(app.map, 'resize');
      app.fitMap();
    });   
    
    $('#control-about').click(function() {
      app.track("control", "about");
      app.openAboutOverlay();
      });
    $('#control-info').click(function() {
      app.track("control", "info");
      app.openInfoOverlay();
      });
    $('#control-random').click(function() {
      app.track("control", "random");
      app.loadAirport("");
      });
    $('#control-play').click(function() {
      app.track("control", "play");
      app.toggleAutoPlay();
      });
    $('#control-switch-map').click(function() {
      app.track("control", "switch-map");
      app.switchMapStyle();
      });
    
    $('#welcome-overlay').click(function() {
      app.track('welcome-overlay', 'background-click');
      app.closeWelcomeOverlay(false);
      });
    $('#welcome-overlay .close-button').click(function(){
      app.track('welcome-overlay', 'close-button-click');
      app.closeWelcomeOverlay(false);
    });
    
    $('#about-overlay').click(function(event) {
      // don't close info overlay when clicking on a link
      if (event.target && event.target.tagName == 'A') {
        event.stopPropagation();
        app.track('about-overlay', event.target.href);
        return;
      }
      app.track('about-overlay', 'background-click');
      app.closeAboutOverlay();
      });
    $('#about-overlay .close-button').click(function(event){
      event.stopPropagation();
      app.track('about-overlay', 'close-button-click');
      app.closeAboutOverlay();
    });
    
    $('#message-container').click(function(){
      app.track('message-container', 'background-click');
      app.closeMessage();
    });
    
    $('#info-overlay').click(function(){
      app.closeInfoOverlay();
    });
    $('#info-overlay .close-button').click(function(){
      app.closeInfoOverlay();
    });
    
    $('#info-overlay #open-google-maps').click(function(event){
      event.stopPropagation();
      app.openGoogleMaps();
    });
    $('#info-overlay #info-minimap').click(function(event){
      event.stopPropagation();
      app.openGoogleMaps();
    });
    $('#info-overlay #open-ourairports').click(function(event){
      event.stopPropagation();
      app.openOurAirports();
    });
    $('#info-overlay #open-flightradar24').click(function(event){
      event.stopPropagation();
      app.openFlightRadar24();
    });
    
    $('#control-search').click(function() {
      app.showSearch();
    });
    $('#search-overlay-search').click(function(){
      app.performSearch();
    });
    $('#search-overlay-query').pressEnter(function(){
      app.performSearch();
    });
    $('#search-overlay .close-button').click(function(){
      app.closeSearch();
    });
  },

  displayMessage : function(message) {
    $('#message-container').html(message);
    $('#message-container').fadeIn(500);
    
    if (app.hide_message_timer) {
      clearInterval(app.hide_message_timer);
    }
    app.hide_message_timer = setInterval(function() { 
      app.closeMessage();
    }, 10 * 1000);
  },
  
  closeMessage : function() {
    $('#message-container').fadeOut(500);
    if (app.hide_message_timer) {
      clearInterval(app.hide_message_timer);
    }
    app.hide_message_timer = null;
  },
  
  showSearch : function() {
    app.track("control", "search");
    app.stopAutoPlay();
    $('#controls').fadeOut(500);
    $('#label-container').fadeOut(500);
    $('#search-overlay').fadeIn(500);
    $('#search-overlay-query').val('');
    $('#search-overlay-query').focus();
  },
  
  closeSearch : function() {
    $('#controls').fadeIn(500);
    $('#label-container').fadeIn(500);
    $('#search-overlay').fadeOut(500);
  },
  
  sanitize_query : function(query) {
    return query.trim().replace(/\s+/g, ' ').toUpperCase().replace(/[^A-Za-z0-9- ]/g, '');
  },

  performSearch : function() {
    var query = app.sanitize_query($('#search-overlay-query').val());
    app.trackSearch(query);
    app.closeSearch();
    
    $.get("api.php?search=" + query.replace(/ /g, '%20'), function(data) {
      var json = $.parseJSON(data);
      if (typeof(json.airport) !== 'undefined' && typeof(json.airport.id) !== 'undefined') {
        app.loadAirport(json.airport.id);
      } else {
        app.track('error', 'searched airport not found: ' + query);
        app.displayMessage('Cannot find airport matching "' + query + '".');
      }
    });
  },

  getBoundsZoomLevel : function(bounds) {
    var WORLD_DIM = { height: 256, width: 256 };
    var ZOOM_MAX = 21;

    function latRad(lat) {
        var sin = Math.sin(lat * Math.PI / 180);
        var radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
        return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
    }

    function zoom(mapPx, worldPx, fraction) {
        return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
    }

    var ne = bounds.getNorthEast();
    var sw = bounds.getSouthWest();

    var latFraction = (latRad(ne.lat()) - latRad(sw.lat())) / Math.PI;

    var lngDiff = ne.lng() - sw.lng();
    var lngFraction = ((lngDiff < 0) ? (lngDiff + 360) : lngDiff) / 360;

    var latZoom = zoom($('#map').height(), WORLD_DIM.height, latFraction);
    var lngZoom = zoom($('#map').width(), WORLD_DIM.width, lngFraction);

    return Math.min(latZoom, lngZoom, ZOOM_MAX);
  },
  
  adjustZoom : function() {
      var needed_zoom = app.current.get_zoom();
      if (!app.current.get_bounds().getNorthEast().equals(app.current.get_bounds().getSouthWest())) {
        needed_zoom = app.getBoundsZoomLevel(app.current.get_bounds());
      }
      
      if (app.max_zoom < 0) {
        app.map.setZoom(needed_zoom);
      } else {
        app.map.setZoom(Math.min(needed_zoom, app.max_zoom));
      }
  },
    
  fitMap : function() {
    if (!app.current) return;
    
    google.maps.event.trigger(app.map, 'resize');
    app.map.setCenter(app.current.get_pos());
    
    if (app.max_zoom < 0) {
      app.max_zoom_service.getMaxZoomAtLatLng(app.current.get_pos(), function(response) {
        if (response.status == google.maps.MaxZoomStatus.OK) {
          app.max_zoom = response.zoom;
        } else {
          app.max_zoom = -1;
        }
        app.adjustZoom();
      });
    } else {
      app.adjustZoom();
    }
  },
  
  tileUrl : function(template, servers, coord, zoom) {
    var limit = Math.pow(2, zoom);
    var x = ((coord.x % limit) + limit) % limit;
    var y = coord.y;
    var s = servers[(Math.abs(x + y)) % servers.length];
    return template.replace(/%s/, s).replace(/%x/, x).replace(/%y/, y).replace(/%z/, zoom);
  },
   
  switchMapStyle : function() {
    if (app.map.getMapTypeId() == google.maps.MapTypeId.SATELLITE) {
      if (!app.additional_copyright_div) {
        app.additional_copyright_div = $('<div>', { id: "map-copyright" });
        app.map.controls[google.maps.ControlPosition.BOTTOM_RIGHT].push(app.additional_copyright_div[0]);
      }
      
      app.additional_copyright_div.html(app.mapquest_copyright_notice);
      app.additional_copyright_div.show();
      
      app.map.setMapTypeId(app.mapquest_tiles.name);
      app.fitMap();
    } else {
      if (app.additional_copyright_div) {
        app.additional_copyright_div.hide();
      }
      app.map.setMapTypeId(google.maps.MapTypeId.SATELLITE);
      app.fitMap();
    }
  },
  
  startAutoPlay : function() {
    app.autoplay = true;
    $('#control-play > i').removeClass('fa-play').addClass('fa-pause');
    if (app.autoplay_timer) {
      clearInterval(app.autoplay_timer);
    }
    app.autoplay_timer = setInterval(function() { 
      app.track("autoplay", "load");
      app.loadAirport(""); 
      }, 60 * 1000);
  },
  
  stopAutoPlay : function() {
    if (app.autoplay_timer) {
      clearInterval(app.autoplay_timer);
      app.autoplay_timer = null;
    }
    $('#control-play > i').removeClass('fa-pause').addClass('fa-play');
    app.autoplay = false;
  },
  
  toggleAutoPlay : function () {
    if (app.autoplay) {
      app.stopAutoPlay();
    } else {
      app.startAutoPlay();
    }
  },
  
  openGoogleMaps : function() {
    if (!app.current) return;
    app.track("google-maps", app.current.get_label());
    var url = "https://www.google.com/maps/@" + app.map.getCenter().lat().toFixed(6) + "," + app.map.getCenter().lng().toFixed(6) + "," + app.map.getZoom() + "z";
    window.open(url, '_blank');
  },
  
  openOurAirports : function() {
    if (!app.current) return;
    app.track("ourairports", app.current.get_label());
    var url = "http://ourairports.com/airports/" + app.current.get_code();
    window.open(url, '_blank');
  },
  
  openFlightRadar24 : function() {
    if (!app.current) return;
    app.track("flightradar24", app.current.get_label());
    var url = "http://www.flightradar24.com/" + app.map.getCenter().lat().toFixed(6) + "," + app.map.getCenter().lng().toFixed(6) + "/" + Math.min(15, app.map.getZoom());
    window.open(url, '_blank');
  },

  closeWelcomeOverlay : function(instant) {
    if (instant === true) {
      $('#welcome-overlay').hide();
      $('#controls').show();
      $('#label-container').show();
    } else {
      $('#welcome-overlay').fadeOut(500);
      $('#controls').fadeIn(500);
      $('#label-container').fadeIn(500);
    }
  },
  
  openAboutOverlay : function() {
    $('#controls').fadeOut(500);
    $('#label-container').fadeOut(500);
    $('#about-overlay').fadeIn(500);
  },

  closeAboutOverlay : function() {
    $('#about-overlay').fadeOut(500);
    $('#controls').fadeIn(500);
    $('#label-container').fadeIn(500);
  },

  openInfoOverlay : function() {
    app.stopAutoPlay();
    $('#info-label').html(app.current.get_label());
    $('#info-location').html(app.current.get_location_name());
    $('#info-minimap').attr("src", "http://maps.googleapis.com/maps/api/staticmap?key=GOOGLE_MAPS_API_KEY&zoom=2&size=500x300&markers=color:blue|" + app.map.getCenter().lat().toFixed(6) + "," + app.map.getCenter().lng().toFixed(6));
    
    $('#controls').fadeOut(500);
    $('#label-container').fadeOut(500);
    $('#info-overlay').fadeIn(500);
  },

  closeInfoOverlay : function() {
    $('#info-overlay').fadeOut(500);
    $('#controls').fadeIn(500);
    $('#label-container').fadeIn(500);
  },

  updateLabel : function() {
    if (app.current) {
      History.setTitle({ title: app.current.get_label() + ' - Random Airports'});
      History.setHash(app.current.get_code(), false);
      $('#label').html(app.current.get_label());
      $('#location').html(app.current.get_location_name());
    } else {
      History.setTitle({ title: 'Random Airports'});
      History.setHash('', false);
      $('#label').html('Random Airports');
      $('#location').html('');
    }
  },

  onStartLoading : function() {
    if (!app.loading) {
      return;
    }
    
    if (app.load_timeout != -1) {
      clearTimeout(app.load_timeout);
      app.load_timeout = -1;
    }
    
    google.maps.event.clearListeners(app.map, 'tilesloaded');
    
    var map_buffer = $('#map-buffer');
    if (map_buffer) {
      map_buffer.remove();
    }
    
    $('#control-random > i').addClass('fa-spin');
    $('#container').prepend($('#map').clone(false).attr('id','map-buffer'));
  },
  
  onFinishLoading : function() {
    if (!app.loading) {
      return;
    }
    
    if (app.load_timeout != -1) {
      clearTimeout(app.load_timeout);
      app.load_timeout = -1;
    }
    
    google.maps.event.clearListeners(app.map, 'tilesloaded');
    
    var map_buffer = $('#map-buffer');
    if (map_buffer) {
      map_buffer.remove();
    }
    
    $('#control-random > i').removeClass('fa-spin');
    app.loading = false;
  },
  
  loadAirport : function(airport_id) {
    if (app.loading) {
      return;
    }
    app.loading = true;
    app.onStartLoading();

    airport_id = app.sanitize_query(airport_id);
    if (airport_id != "") {
      console.log("loading " + airport_id + "...");
      $.get("api.php?id=" + airport_id, function(data) {
        var json = $.parseJSON(data);
        if (typeof(json.airport) !== 'undefined' && typeof(json.airport.id) !== 'undefined') {
          app.current = new Airport;
          app.current.load_from_json(json.airport);
          
          google.maps.event.addListenerOnce(app.map, 'tilesloaded', function(){
            $('#map-buffer').fadeOut(500, function(){ app.onFinishLoading(); });
            app.updateLabel();
          });
          app.load_timeout = setTimeout(function(){ 
            $('#map-buffer').fadeOut(500, function(){ app.onFinishLoading(); });
            app.updateLabel();
          }, 5000);
  
          app.max_zoom = -1;
          app.fitMap();
        } else {
          app.track('error', 'airport not found' + airport_id);
          app.displayMessage('Error loading requested airport (' + airport_id + '). Loading a random airport instead.');
          app.current = null;
          app.onFinishLoading();
          
          app.loadAirport("");
        }
      });
    } else {
      console.log("loading random airport...");
      $.get("api.php?random", function(data) {
        var json = $.parseJSON(data);
        if (typeof(json.airport) !== 'undefined' && typeof(json.airport.id) !== 'undefined') {
          app.current = new Airport;
          app.current.load_from_json(json.airport);
          
          google.maps.event.addListenerOnce(app.map, 'tilesloaded', function(){
            $('#map-buffer').fadeOut(500, function(){ app.onFinishLoading(); });
            app.updateLabel();
          });
          app.load_timeout = setTimeout(function(){ 
            $('#map-buffer').fadeOut(500, function(){ app.onFinishLoading(); });
            app.updateLabel();
          }, 5000);
  
          app.max_zoom = -1;
          app.fitMap();
        } else {
          app.track('error', 'cannot load random airport');
          app.displayMessage('Error loading random airport.');
          app.current = null;
          app.onFinishLoading();
        }
      });
    }
  },

  track : function(category,action,label,value) {
    if(_gaq) _gaq.push(['_trackEvent', category, action, label, value]);
  },
  
  trackSearch : function(query) {
    if (_gaq) _gaq.push(['_trackEvent','search', query]);
  }
};

var _gaq = _gaq || [];

$(document).ready(function(){
  _gaq.push(['_setAccount', 'GOOGLE_ANALYTICS_ACCOUNT']);
  _gaq.push(['_trackPageview']);
  
  app.init();

  (function() {
    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
  })();
});
