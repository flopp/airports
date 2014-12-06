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
  current : {}, 
  init : function() {
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
    
    $('#label').click(function() {
      app.openGoogleMaps();
      });
  },
  
  openGoogleMaps : function() {
    window.open(app.current.airport.get_google_maps_url(), '_blank');
  },
  
  sizeToZoom : function(size) {
    if (size == "L") { return 15; }
    else if (size == "S") { return 16; }
    return 15;
  },
  
  updateLabel : function() {
    $('#label').html(app.current.airport.get_label() + "<br />@ " 
      + app.current.airport.get_pos().lat().toFixed(3) + ", " + app.current.airport.get_pos().lng().toFixed(3));
  },
  
  loadRandomAirport : function() {
    if (app.airports.length == 0) {
      return;
    }
      
    var index =  Math.floor(Math.random() * app.airports.length);
    app.current.airport = app.airports[index];
    
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
    
    app.map.setCenter(app.current.airport.get_pos());
    app.map.setZoom(app.current.airport.get_zoom());
  }
};

$(document).ready(function(){
  app.init();
});
