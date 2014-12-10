var app = {
  init : function() {
    app.loading = false;
    app.current = null;
    app.autoplay = false;
    app.autoplay_timer = null;
    
    var opt = {
      center: new google.maps.LatLng(50.037643, 8.562409), zoom: 15,
      mapTypeId: google.maps.MapTypeId.SATELLITE,
      disableDefaultUI: true, mapTypeControl: false, navigationControl: false, disableDoubleClickZoom: false,
      draggable: false, scrollwheel: false, streetViewControl: false,
      backgroundColor: '#000000'};
    app.map = new google.maps.Map($('#map')[0],opt);
    
    app.static_airports = [
      new Airport(["EDDF","FRA","Frankfurt am Main International Airport","L","49.9984","8.49708","50.0458","8.58698","DE","Frankfurt-am-Main"]),
      new Airport(["OMDB","DXB","Dubai International Airport","L","25.2433","55.347","25.2665","55.3815","AE","Dubai"]),
      new Airport(["KSFO","SFO","San Francisco International Airport","L","37.6068","-122.393","37.6287","-122.357","US","San Francisco"])
    ];
    app.airports = [];
    $.get("data/data.csv", function(data) {
      var lines = data.split(/\r\n|\n/);
      for (var i=1; i<lines.length; i++) {
        var data = lines[i].split(',');
        if (data.length == 10) {
          app.airports.push(new Airport(data));
        }
      }
    });

    // setup event handlers
    google.maps.event.addListener(app.map, 'click', function(event) {
      app.track("map", "click");
      app.loadRandomAirport();
    });

    google.maps.event.addDomListener(window, 'resize', function() {
      google.maps.event.trigger(app.map, 'resize');
      app.fitMap();
    });

    $('#control-info').click(function() {
      app.track("control", "info");
      app.openInfoOverlay();
      });
    $('#control-google-maps').click(function() {
      app.openGoogleMaps();
      });
    $('#control-random').click(function() {
      app.track("control", "random");
      app.loadRandomAirport();
      });
    $('#control-play').click(function() {
      app.track("control", "play");
      app.toggleAutoPlay();
      });
    $('#info-overlay').click(function() {
      // don't close info overlay when clicking on a link
      if (event.target && event.target.tagName == 'A') {
        event.stopPropagation();
        app.track('info-overlay', 'link', 'href', event.target.href);
        return;
      }
      app.track('info-overlay', 'background', 'click');
      app.closeInfoOverlay();
      });
    $('#info-overlay button').click(function(){
      event.stopPropagation();
      app.track('info-overlay', 'close-button', 'click');
      app.closeInfoOverlay();
    });
    
    app.loadRandomAirport();
  },

  load : function(code) {
    code = code.toUpperCase();
    var found_index = -1;
    
    for (var index = 0; index < app.airports.length; ++index) {
      if (app.airports[index].get_code().toUpperCase() == code || app.airports[index].get_iata().toUpperCase() == code) {
        found_index = index;
        break;
      }
    }
    
    if (found_index == -1) {
      for (var index = 0; index < app.airports.length; ++index) {
        if (app.airports[index].get_label().toUpperCase().indexOf(code) >= 0) {
          found_index = index;
          break;
        }
      }
    }
    
    if (found_index != -1) {
      app.current = app.airports[found_index];
      app.updateLabel();
      app.fitMap();
    }
  },

  fitMap : function() {
    if (!app.current) {
      return;
    }
    app.map.setCenter(app.current.get_pos());
    if (app.current.get_bounds().getNorthEast().equals(app.current.get_bounds().getSouthWest())) {
      app.map.setZoom(app.current.get_zoom());
    } else {
      app.map.fitBounds(app.current.get_bounds());
    }
  },
  
  toggleAutoPlay : function () {
    if (app.autoplay) {
      clearInterval(app.autoplay_timer);
      app.autoplay_timer = null;
      $('#control-play > i').removeClass('fa-pause').addClass('fa-play');
      app.autoplay = false;
    } else {
      app.autoplay = true;
      $('#control-play > i').removeClass('fa-play').addClass('fa-pause');
      app.autoplay_timer = setInterval(function() { 
        app.track("autoplay", "load");
        app.loadRandomAirport(); 
        }, 60 * 1000);
    }
  },
  
  openGoogleMaps : function() {
    app.track("control", "google-maps", "airport", app.current.get_label());
    var url = "https://www.google.com/maps/@" + app.map.getCenter().lat().toFixed(6) + "," + app.map.getCenter().lng().toFixed(6) + "," + app.map.getZoom() + "z";
    window.open(url, '_blank');
  },

  openInfoOverlay : function() {
    $('#controls').fadeOut(1000);
    $('#label-container').fadeOut(1000);
    $('#info-overlay').fadeIn(1000);
  },

  closeInfoOverlay : function() {
    $('#info-overlay').fadeOut(1000);
    $('#controls').fadeIn(1000);
    $('#label-container').fadeIn(1000);
  },

  updateLabel : function() {
    $(document).attr('title', app.current.get_label() + ' - Random Airports');
    $('#label').html(app.current.get_label());
    $('#location').html(app.current.get_location_name());
  },

  onStartLoading : function() {
    if (!app.loading) {
      return;
    }
    
    $('#control-random > i').addClass('fa-spin');
    $('#container').prepend($('#map').clone(false).attr('id','map-buffer'));
  },
  
  onFinishLoading : function() {
    if (!app.loading) {
      return;
    }
    
    var map_buffer = $('#map-buffer');
    if (map_buffer) {
      map_buffer.remove();
    }
    
    app.updateLabel();
    $('#control-random > i').removeClass('fa-spin');
    app.loading = false;
  },
  
  loadRandomAirport : function() {
    if (app.loading) {
      return;
    }
    app.loading = true;
    app.onStartLoading();
    
    if (app.airports.length > 0) {
      var index =  Math.floor(Math.random() * app.airports.length);
      app.current = app.airports[index];
    } else if (app.static_airports.length > 0) {
      var index =  Math.floor(Math.random() * app.static_airports.length);
      app.current = app.static_airports[index];
    } else {
      return;
    } 

    google.maps.event.addListenerOnce(app.map, 'bounds_changed', function(){
      setTimeout(function(){
        $('#map-buffer').fadeOut(1000, function(){ app.onFinishLoading(); });
        }, 2000);
      });
    setTimeout(function(){ app.onFinishLoading(); }, 3000);

    app.fitMap();
  },

  track : function(category,action,label,value) {
    if(_gaq) _gaq.push(['_trackEvent', category, action, label, value]);
  }
};

var _gaq = _gaq || [];

$(document).ready(function(){
  app.init();

  _gaq.push(['_setAccount', 'UA-27729857-5']);
  _gaq.push(['_trackPageview']);

  (function() {
    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
  })();
});
