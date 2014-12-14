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
  init : function(query_id) {
    app.query_id = app.sanitize_query_id(query_id);
    app.loading = false;
    app.current = null;
    app.autoplay = false;
    app.autoplay_timer = null;
    
    var opt = {
      //center: new google.maps.LatLng(50.037643, 8.562409), zoom: 15,
      mapTypeId: google.maps.MapTypeId.SATELLITE,
      disableDefaultUI: true, mapTypeControl: false, navigationControl: false, disableDoubleClickZoom: false,
      draggable: false, scrollwheel: false, streetViewControl: false,
      backgroundColor: '#000000'};
    app.map = new google.maps.Map($('#map')[0],opt);
    
    app.airport_ids = [];
    $.get("api.php?list", function(data) {
      var json = $.parseJSON(data);
      app.airport_ids = json.ids;
      app.loadRandomAirport();
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
    
    $('#message-container').click(function(){
      app.track('message-container', 'background', 'click');
      app.closeMessage();
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
    $('#search-overlay-close').click(function(){
      app.closeSearch();
    });
  },

  displayMessage : function(message) {
    $('#message-container').html(message);
    $('#message-container').fadeIn(500);
  },
  
  closeMessage : function() {
    $('#message-container').fadeOut(500);
  },
  
  showSearch : function() {
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
  
  performSearch : function() {
    app.query_id = app.sanitize_query_id($('#search-overlay-query').val());
    app.loadRandomAirport();
    app.closeSearch();
  },
  
  sanitize_query_id : function(id) {
    if (id) {
      app.track('init', 'query', 'id', id);
      return id.toUpperCase().replace(/[^A-Za-z0-9-]/g, '');
    } else {
      return '';
    }
  },
  
  fitMap : function() {
    if (!app.current) return;
    
    google.maps.event.trigger(app.map, 'resize');
    app.map.setCenter(app.current.get_pos());
    if (app.current.get_bounds().getNorthEast().equals(app.current.get_bounds().getSouthWest())) {
      app.map.setZoom(app.current.get_zoom());
    } else {
      app.map.fitBounds(app.current.get_bounds());
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
      app.loadRandomAirport(); 
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
    app.track("control", "google-maps", "airport", app.current.get_label());
    var url = "https://www.google.com/maps/@" + app.map.getCenter().lat().toFixed(6) + "," + app.map.getCenter().lng().toFixed(6) + "," + app.map.getZoom() + "z";
    window.open(url, '_blank');
  },

  openInfoOverlay : function() {
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
    if (!app.current) return;
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
    
    var id = '';
    if (app.query_id != '') {
      if ($.inArray(app.query_id, app.airport_ids) >= 0) {
        id = app.query_id;
      } else {
        app.track('error', 'Requested airport (' + app.query_id + ') cannot be found. Loading random airport.');
        app.displayMessage('Requested airport (' + app.query_id + ') cannot be found. Loading random airport.');
      }
      app.query_id = '';
    }
    if (id == '') {
      if (app.airport_ids.length > 0) {
        var index =  Math.floor(Math.random() * app.airport_ids.length);
        id = app.airport_ids[index];
      }
    }
    if (id == '') {
      id = 'EDDF';
    }
    
    console.log("loading " + id + "...");
    
    $.get("api.php?id=" + id, function(data) {
      var json = $.parseJSON(data);
      if (typeof(json.airport) !== 'undefined' && typeof(json.airport.id) !== 'undefined') {
      app.current = new Airport;
      app.current.load_from_json(json.airport);
      
      google.maps.event.addListenerOnce(app.map, 'bounds_changed', function(){
      setTimeout(function(){
        $('#map-buffer').fadeOut(1000, function(){ app.onFinishLoading(); });
        }, 2000);
      });
      setTimeout(function(){ app.onFinishLoading(); }, 3000);

      app.fitMap();
    } else {
      app.track('error', 'Error loading requested airport (' + id + ').');
      app.displayMessage('Error loading requested airport (' + id + ').');
      app.current = null;
      app.onFinishLoading();
    }
    });
  },

  track : function(category,action,label,value) {
    if(_gaq) _gaq.push(['_trackEvent', category, action, label, value]);
  }
};

var _gaq = _gaq || [];

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

$(document).ready(function(){
  var query_id = getParameterByName('id');
  app.init(query_id);

  _gaq.push(['_setAccount', 'UA-27729857-5']);
  _gaq.push(['_trackPageview']);

  (function() {
    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
  })();
});
