/*jshint*/
/*jslint*/

/*global
    google
*/

class Airport {
    constructor() {
        'use strict';

        this.m_icao = "";
        this.m_iata = "";
        this.m_name = "";
        this.m_bounds = null;
        this.m_zoom = 14;
        this.m_location = "";
        this.m_wiki_url = "";
        this.m_wiki_data = "";
    }

    load_from_json(json) {
        'use strict';
    
        this.m_icao = json.icao;
        this.m_iata = json.iata;
        this.m_name = json.name;
        this.m_wiki_url = json.wiki_url;
        this.m_wiki_data = json.wiki_data;
    
        this.m_zoom = 14;
        if (json.type === "M") {
            this.m_zoom = 15;
        }
    
        this.m_location = json.location;
    
        var latlng0 = new google.maps.LatLng(parseFloat(json.lat1), parseFloat(json.lng1)),
            latlng1 = new google.maps.LatLng(parseFloat(json.lat2), parseFloat(json.lng2));
        this.m_bounds = new google.maps.LatLngBounds(latlng0, latlng1);
        if (!latlng0.equals(latlng1)) {
            var lat_margin = 0.05 * Math.abs(latlng0.lat() - latlng1.lat()),
                lng_margin = 0.05 * Math.abs(latlng0.lng() - latlng1.lng());
            this.m_bounds.extend(new google.maps.LatLng(latlng0.lat() - lat_margin, latlng0.lng() - lng_margin));
            this.m_bounds.extend(new google.maps.LatLng(latlng1.lat() + lat_margin, latlng1.lng() + lng_margin));
        }
    }

    get_icao() {
        'use strict';
    
        return this.m_icao;
    }
    
    get_iata() {
        'use strict';
    
        return this.m_iata;
    }
    
    get_pos() {
        'use strict';
    
        return this.get_bounds().getCenter();
    }
    
    get_bounds() {
        'use strict';
    
        return this.m_bounds;
    }
    
    get_zoom() {
        'use strict';
    
        return this.m_zoom;
    }
    
    get_label() {
        'use strict';
    
        return this.m_name;
    }
    
    get_location_name() {
        'use strict';
    
        return this.m_location;
    }
    
    get_wiki_url() {
        'use strict';
    
        return this.m_wiki_url;
    }
    
    get_wiki_data() {
        'use strict';
    
        return this.m_wiki_data;
    }
}
