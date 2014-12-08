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
    return this.m_city + ", " + app.getCountryName(this.m_country);
  } else {
    return "somewhere in " + app.getCountryName(this.m_country);
  }
}

Airport.prototype.get_google_maps_url = function() {
  return "https://www.google.com/maps/@" + this.get_pos().lat().toFixed(6) + "," + this.get_pos().lng().toFixed(6) + "," + this.m_zoom + "z";
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

    app.isoCountries = {
      'AF' : 'Afghanistan',
      'AX' : 'Aland Islands',
      'AL' : 'Albania',
      'DZ' : 'Algeria',
      'AS' : 'American Samoa',
      'AD' : 'Andorra',
      'AO' : 'Angola',
      'AI' : 'Anguilla',
      'AQ' : 'Antarctica',
      'AG' : 'Antigua And Barbuda',
      'AR' : 'Argentina',
      'AM' : 'Armenia',
      'AW' : 'Aruba',
      'AU' : 'Australia',
      'AT' : 'Austria',
      'AZ' : 'Azerbaijan',
      'BS' : 'Bahamas',
      'BH' : 'Bahrain',
      'BD' : 'Bangladesh',
      'BB' : 'Barbados',
      'BY' : 'Belarus',
      'BE' : 'Belgium',
      'BZ' : 'Belize',
      'BJ' : 'Benin',
      'BM' : 'Bermuda',
      'BT' : 'Bhutan',
      'BO' : 'Bolivia',
      'BA' : 'Bosnia And Herzegovina',
      'BW' : 'Botswana',
      'BV' : 'Bouvet Island',
      'BR' : 'Brazil',
      'IO' : 'British Indian Ocean Territory',
      'BN' : 'Brunei Darussalam',
      'BG' : 'Bulgaria',
      'BF' : 'Burkina Faso',
      'BI' : 'Burundi',
      'KH' : 'Cambodia',
      'CM' : 'Cameroon',
      'CA' : 'Canada',
      'CV' : 'Cape Verde',
      'KY' : 'Cayman Islands',
      'CF' : 'Central African Republic',
      'TD' : 'Chad',
      'CL' : 'Chile',
      'CN' : 'China',
      'CX' : 'Christmas Island',
      'CC' : 'Cocos (Keeling) Islands',
      'CO' : 'Colombia',
      'KM' : 'Comoros',
      'CG' : 'Congo',
      'CD' : 'Democratic Republic of Congo',
      'CK' : 'Cook Islands',
      'CR' : 'Costa Rica',
      'CI' : 'Cote D\'Ivoire',
      'HR' : 'Croatia',
      'CU' : 'Cuba',
      'CY' : 'Cyprus',
      'CZ' : 'Czech Republic',
      'DK' : 'Denmark',
      'DJ' : 'Djibouti',
      'DM' : 'Dominica',
      'DO' : 'Dominican Republic',
      'EC' : 'Ecuador',
      'EG' : 'Egypt',
      'SV' : 'El Salvador',
      'GQ' : 'Equatorial Guinea',
      'ER' : 'Eritrea',
      'EE' : 'Estonia',
      'ET' : 'Ethiopia',
      'FK' : 'Falkland Islands (Malvinas)',
      'FO' : 'Faroe Islands',
      'FJ' : 'Fiji',
      'FI' : 'Finland',
      'FR' : 'France',
      'GF' : 'French Guiana',
      'PF' : 'French Polynesia',
      'TF' : 'French Southern Territories',
      'GA' : 'Gabon',
      'GM' : 'Gambia',
      'GE' : 'Georgia',
      'DE' : 'Germany',
      'GH' : 'Ghana',
      'GI' : 'Gibraltar',
      'GR' : 'Greece',
      'GL' : 'Greenland',
      'GD' : 'Grenada',
      'GP' : 'Guadeloupe',
      'GU' : 'Guam',
      'GT' : 'Guatemala',
      'GG' : 'Guernsey',
      'GN' : 'Guinea',
      'GW' : 'Guinea-Bissau',
      'GY' : 'Guyana',
      'HT' : 'Haiti',
      'HM' : 'Heard Island & Mcdonald Islands',
      'VA' : 'Holy See (Vatican City State)',
      'HN' : 'Honduras',
      'HK' : 'Hong Kong',
      'HU' : 'Hungary',
      'IS' : 'Iceland',
      'IN' : 'India',
      'ID' : 'Indonesia',
      'IR' : 'Islamic Republic Of Iran',
      'IQ' : 'Iraq',
      'IE' : 'Ireland',
      'IM' : 'Isle Of Man',
      'IL' : 'Israel',
      'IT' : 'Italy',
      'JM' : 'Jamaica',
      'JP' : 'Japan',
      'JE' : 'Jersey',
      'JO' : 'Jordan',
      'KZ' : 'Kazakhstan',
      'KE' : 'Kenya',
      'KI' : 'Kiribati',
      'KR' : 'Korea',
      'KW' : 'Kuwait',
      'KG' : 'Kyrgyzstan',
      'LA' : 'Lao People\'s Democratic Republic',
      'LV' : 'Latvia',
      'LB' : 'Lebanon',
      'LS' : 'Lesotho',
      'LR' : 'Liberia',
      'LY' : 'Libyan Arab Jamahiriya',
      'LI' : 'Liechtenstein',
      'LT' : 'Lithuania',
      'LU' : 'Luxembourg',
      'MO' : 'Macao',
      'MK' : 'Macedonia',
      'MG' : 'Madagascar',
      'MW' : 'Malawi',
      'MY' : 'Malaysia',
      'MV' : 'Maldives',
      'ML' : 'Mali',
      'MT' : 'Malta',
      'MH' : 'Marshall Islands',
      'MQ' : 'Martinique',
      'MR' : 'Mauritania',
      'MU' : 'Mauritius',
      'YT' : 'Mayotte',
      'MX' : 'Mexico',
      'FM' : 'Federated States Of Micronesia',
      'MD' : 'Moldova',
      'MC' : 'Monaco',
      'MN' : 'Mongolia',
      'ME' : 'Montenegro',
      'MS' : 'Montserrat',
      'MA' : 'Morocco',
      'MZ' : 'Mozambique',
      'MM' : 'Myanmar',
      'NA' : 'Namibia',
      'NR' : 'Nauru',
      'NP' : 'Nepal',
      'NL' : 'Netherlands',
      'AN' : 'Netherlands Antilles',
      'NC' : 'New Caledonia',
      'NZ' : 'New Zealand',
      'NI' : 'Nicaragua',
      'NE' : 'Niger',
      'NG' : 'Nigeria',
      'NU' : 'Niue',
      'NF' : 'Norfolk Island',
      'MP' : 'Northern Mariana Islands',
      'NO' : 'Norway',
      'OM' : 'Oman',
      'PK' : 'Pakistan',
      'PW' : 'Palau',
      'PS' : 'Palestinian Territory, Occupied',
      'PA' : 'Panama',
      'PG' : 'Papua New Guinea',
      'PY' : 'Paraguay',
      'PE' : 'Peru',
      'PH' : 'Philippines',
      'PN' : 'Pitcairn',
      'PL' : 'Poland',
      'PT' : 'Portugal',
      'PR' : 'Puerto Rico',
      'QA' : 'Qatar',
      'RE' : 'Reunion',
      'RO' : 'Romania',
      'RU' : 'Russian Federation',
      'RW' : 'Rwanda',
      'BL' : 'Saint Barthelemy',
      'SH' : 'Saint Helena',
      'KN' : 'Saint Kitts And Nevis',
      'LC' : 'Saint Lucia',
      'MF' : 'Saint Martin',
      'PM' : 'Saint Pierre And Miquelon',
      'VC' : 'Saint Vincent And Grenadines',
      'WS' : 'Samoa',
      'SM' : 'San Marino',
      'ST' : 'Sao Tome And Principe',
      'SA' : 'Saudi Arabia',
      'SN' : 'Senegal',
      'RS' : 'Serbia',
      'SC' : 'Seychelles',
      'SL' : 'Sierra Leone',
      'SG' : 'Singapore',
      'SK' : 'Slovakia',
      'SI' : 'Slovenia',
      'SB' : 'Solomon Islands',
      'SO' : 'Somalia',
      'ZA' : 'South Africa',
      'GS' : 'South Georgia And Sandwich Isl.',
      'ES' : 'Spain',
      'LK' : 'Sri Lanka',
      'SD' : 'Sudan',
      'SR' : 'Suriname',
      'SJ' : 'Svalbard And Jan Mayen',
      'SZ' : 'Swaziland',
      'SE' : 'Sweden',
      'CH' : 'Switzerland',
      'SY' : 'Syrian Arab Republic',
      'TW' : 'Taiwan',
      'TJ' : 'Tajikistan',
      'TZ' : 'Tanzania',
      'TH' : 'Thailand',
      'TL' : 'Timor-Leste',
      'TG' : 'Togo',
      'TK' : 'Tokelau',
      'TO' : 'Tonga',
      'TT' : 'Trinidad And Tobago',
      'TN' : 'Tunisia',
      'TR' : 'Turkey',
      'TM' : 'Turkmenistan',
      'TC' : 'Turks And Caicos Islands',
      'TV' : 'Tuvalu',
      'UG' : 'Uganda',
      'UA' : 'Ukraine',
      'AE' : 'United Arab Emirates',
      'GB' : 'United Kingdom',
      'US' : 'United States',
      'UM' : 'United States Outlying Islands',
      'UY' : 'Uruguay',
      'UZ' : 'Uzbekistan',
      'VU' : 'Vanuatu',
      'VE' : 'Venezuela',
      'VN' : 'Viet Nam',
      'VG' : 'Virgin Islands, British',
      'VI' : 'Virgin Islands, U.S.',
      'WF' : 'Wallis And Futuna',
      'EH' : 'Western Sahara',
      'YE' : 'Yemen',
      'ZM' : 'Zambia',
      'ZW' : 'Zimbabwe'
    };
 
    app.airports = [];
    $.get("data/data.csv", function(data) {
      var lines = data.split(/\r\n|\n/);
      for (var i=1; i<lines.length; i++)
      {
        var data = lines[i].split(',');
        if (data.length == 9)
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
      app.fitMap();
      break;
    }
  },
  
  getCountryName : function(countryCode) {
    if (app.isoCountries.hasOwnProperty(countryCode)) {
      return app.isoCountries[countryCode];
    } else {
       return countryCode;
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
    $('#location').html(app.current.get_location_name());
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
