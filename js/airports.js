function Airport(data) {
  this.m_code = data[0];
  this.m_name = data[1];
  
  var latlng0 = new google.maps.LatLng(parseFloat(data[3]), parseFloat(data[4]));
  var latlng1 = new google.maps.LatLng(parseFloat(data[5]), parseFloat(data[6]));
  this.m_bounds = new google.maps.LatLngBounds(latlng0, latlng1);
  if (!latlng0.equals(latlng1)) {
    this.m_bounds.extend(new google.maps.LatLng(latlng0.lat()-0.001, latlng0.lng()-0.001));
    this.m_bounds.extend(new google.maps.LatLng(latlng1.lat()+0.001, latlng1.lng()+0.001));
  } 
  
  var type = data[2];
  this.m_zoom = 14;
  if (type == "M") this.m_zoom = 15;
  
  this.m_country = data[7];
  this.m_city = data[8];
}

Airport.prototype.m_code = "";
Airport.prototype.m_name = "";
Airport.prototype.m_bounds = null;
Airport.prototype.m_zoom = 14;
Airport.prototype.m_country = "";
Airport.prototype.m_city = "";

Airport.prototype.get_code = function() {
  return this.m_code;
}

Airport.prototype.get_pos = function() {
  return this.get_bounds().getCenter();
}

Airport.prototype.get_bounds = function() {
  return this.m_bounds;
}

Airport.prototype.get_zoom = function() {
  return this.m_zoom;
}

Airport.prototype.get_label = function() {
  return this.m_code + " - " + this.m_name;
}

Airport.prototype.get_location_name = function() {
  if (this.m_city != "") {
    return this.m_city + ", " + getCountryName(this.m_country);
  } else {
    return "Somewhere in " + getCountryName(this.m_country);
  }
}

Airport.prototype.get_google_maps_url = function() {
  return "https://www.google.com/maps/@" + this.get_pos().lat().toFixed(6) + "," + this.get_pos().lng().toFixed(6) + "," + this.m_zoom + "z";
}
