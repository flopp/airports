function Airport() {
  this.m_code = "";
  this.m_iata = "";
  this.m_name = "";
  this.m_bounds = null;
  this.m_zoom = 14;
  this.m_country = "";
  this.m_city = "";  
}

Airport.prototype.m_code = "";
Airport.prototype.m_iata = "";
Airport.prototype.m_name = "";
Airport.prototype.m_bounds = null;
Airport.prototype.m_zoom = 14;
Airport.prototype.m_country = "";
Airport.prototype.m_city = "";

Airport.prototype.load_from_array = function(data) {
  this.m_code = data[0];
  this.m_iata = data[1];
  this.m_name = data[2];
  
  var latlng0 = new google.maps.LatLng(parseFloat(data[4]), parseFloat(data[5]));
  var latlng1 = new google.maps.LatLng(latlng0.lat(), latlng0.lng());
  if (data[6] != "" && data[7] != "") {
    latlng1 = new google.maps.LatLng(parseFloat(data[6]), parseFloat(data[7]));
  }
  this.m_bounds = new google.maps.LatLngBounds(latlng0, latlng1);
  if (!latlng0.equals(latlng1)) {
    this.m_bounds.extend(new google.maps.LatLng(latlng0.lat()-0.001, latlng0.lng()-0.001));
    this.m_bounds.extend(new google.maps.LatLng(latlng1.lat()+0.001, latlng1.lng()+0.001));
  } 
  
  var type = data[3];
  this.m_zoom = 14;
  if (type == "M") this.m_zoom = 15;
  
  this.m_country = data[8];
  this.m_city = data[9];
}

Airport.prototype.load_from_json = function(json) {
  this.m_code = json.id;
  this.m_iata = json.iata;
  this.m_name = json.name;

  var type = json.type;
  this.m_zoom = 14;
  if (type == "M") this.m_zoom = 15;

  this.m_country = json.country;
  this.m_city = json.city;

  var latlng0 = new google.maps.LatLng(parseFloat(json.lat1), parseFloat(json.lng1));
  var latlng1 = new google.maps.LatLng(parseFloat(json.lat2), parseFloat(json.lng2));
  this.m_bounds = new google.maps.LatLngBounds(latlng0, latlng1);
  if (!latlng0.equals(latlng1)) {
    this.m_bounds.extend(new google.maps.LatLng(latlng0.lat()-0.001, latlng0.lng()-0.001));
    this.m_bounds.extend(new google.maps.LatLng(latlng1.lat()+0.001, latlng1.lng()+0.001));
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
  var code = this.m_code;
  if (this.m_iata != "" && this.m_iata != code) {
    code = code + "/" + this.m_iata;
  }
  return code + " - " + this.m_name;
}

Airport.prototype.get_location_name = function() {
  if (this.m_city != "") {
    return this.m_city + ", " + getCountryName(this.m_country);
  } else {
    return "Somewhere in " + getCountryName(this.m_country);
  }
}
