function Airport() {
  this.m_code = "";
  this.m_iata = "";
  this.m_name = "";
  this.m_bounds = null;
  this.m_zoom = 14;
  this.m_location = ""; 
}

Airport.prototype.m_code = "";
Airport.prototype.m_iata = "";
Airport.prototype.m_name = "";
Airport.prototype.m_bounds = null;
Airport.prototype.m_zoom = 14;
Airport.prototype.m_location = "";

Airport.prototype.load_from_json = function(json) {
  this.m_code = json.id;
  this.m_iata = json.iata;
  this.m_name = json.name;

  var type = json.type;
  this.m_zoom = 14;
  if (type == "M") this.m_zoom = 15;

  this.m_location = json.location;

  var latlng0 = new google.maps.LatLng(parseFloat(json.lat1), parseFloat(json.lng1));
  var latlng1 = new google.maps.LatLng(parseFloat(json.lat2), parseFloat(json.lng2));
  this.m_bounds = new google.maps.LatLngBounds(latlng0, latlng1);
  if (!latlng0.equals(latlng1)) {
    var lat_margin = 0.05 * Math.abs(latlng0.lat() - latlng1.lat());
    var lng_margin = 0.05 * Math.abs(latlng0.lng() - latlng1.lng());
    this.m_bounds.extend(new google.maps.LatLng(latlng0.lat()-lat_margin, latlng0.lng()-lng_margin));
    this.m_bounds.extend(new google.maps.LatLng(latlng1.lat()+lat_margin, latlng1.lng()+lng_margin));
  }  
}

Airport.prototype.get_code = function() {
  return this.m_code;
}

Airport.prototype.get_iata = function() {
  return this.m_iata;
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
  return this.m_name;
}

Airport.prototype.get_location_name = function() {
    return this.m_location;
}
