function Airport(data) {
  this.m_code = data[0];
  this.m_name = data[1];
  var lat = parseFloat(data[3]);
  var lng = parseFloat(data[4]);
  this.m_pos = new google.maps.LatLng(lat, lng);
  this.m_zoom = 15;
  if (data[2] == "S") this.m_zoom = 16;
}

Airport.prototype.m_code = "";
Airport.prototype.m_name = "";
Airport.prototype.m_pos = null;
Airport.prototype.m_zoom = 15;

Airport.prototype.get_code = function() {
  return this.m_code;
}

Airport.prototype.get_pos = function() {
  return this.m_pos;
}

Airport.prototype.get_zoom = function() {
  return this.m_zoom;
}

Airport.prototype.get_label = function() {
  return this.m_code + " - " + this.m_name;
}

Airport.prototype.get_google_maps_url = function() {
  return "https://www.google.com/maps/@" + this.m_pos.lat().toFixed(6) + "," + this.m_pos.lng().toFixed(6) + "," + this.m_zoom + "z";
}


var app = {
  init : function() {
    app.current = null;

    var opt = {
      center: new google.maps.LatLng(50.037643, 8.562409), zoom: 15,
      mapTypeId: google.maps.MapTypeId.SATELLITE,
      disableDefaultUI: true, mapTypeControl: false, navigationControl: false, disableDoubleClickZoom: false,
      draggable: false, scrollwheel: false, streetViewControl: false,
      backgroundColor: '#000000'};
    app.map = new google.maps.Map($('#map')[0],opt);

    app.airports = [];
    $.get("data/medium_large.csv", function(data) {
      var lines = data.split(/\r\n|\n/);
      for (var i=1; i<lines.length; i++)
      {
        var data = lines[i].split(',');
        if (data.length == 5)
        {
          app.airports.push(new Airport(data));
        }
      }
      app.loadRandomAirport();
    });

    google.maps.event.addListener(app.map, 'click', function(event) {
      app.loadRandomAirport();
    });

    google.maps.event.addDomListener(window, 'resize', function() {
      if (!app.current) return;
      app.map.setCenter(app.current.get_pos());
      google.maps.event.trigger(app.map, 'resize');
    });

    $('#control-info').click(function() {
      app.track("control", "info");
      app.openInfoOverlay();
      });
    $('#control-google-maps').click(function() {
      app.openGoogleMaps();
      });
    $('#control-next').click(function() {
      app.track("control", "next");
      app.loadRandomAirport();
      });
  },

  load : function(code) {
    for (var index = 0; index < app.airports.length; ++index) {
      if (app.airports[index].get_code() != code) {
        continue;
      }

      app.current = app.airports[index];
      app.updateLabel();
      app.map.setCenter(app.current.get_pos());
      app.map.setZoom(app.current.get_zoom());
      break;
    }
  },

  openGoogleMaps : function() {
    app.track("control", "google-maps", "airport", app.current.get_label());
    window.open(app.current.get_google_maps_url(), '_blank');
  },

  openInfoOverlay : function() {
    $('#controls').fadeOut(1000);
    $('#label').fadeOut(1000);
    $('#info-overlay').fadeIn(1000);
    $('#info-overlay button').click(function(){
      app.closeInfoOverlay();
    });
  },

  closeInfoOverlay : function() {
    $('#info-overlay').fadeOut(1000);
    $('#controls').fadeIn(1000);
    $('#label').fadeIn(1000);
  },

  updateLabel : function() {
    $('#label').html(app.current.get_label());
  },

  loadRandomAirport : function() {
    if (app.airports.length == 0) {
      return;
    }

    var index =  Math.floor(Math.random() * app.airports.length);
    app.current = app.airports[index];

    $('#container').prepend($('#map').clone(false).attr('id','map-buffer'));
    google.maps.event.addListenerOnce(app.map, 'bounds_changed', function(){
      setTimeout(function(){
        $('#map-buffer').fadeOut(1000, function(){
          $(this).remove();
          app.updateLabel();
          });
        }, 2000);
      });
    setTimeout(function(){
      $('#map-buffer').remove();
      app.updateLabel();
    }, 3000);

    app.map.setCenter(app.current.get_pos());
    app.map.setZoom(app.current.get_zoom());
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
