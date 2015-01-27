#! /usr/bin/env python

import csv
import math


class Bounds:
    def __init__(self):
        self.__lat0 = None
        self.__lat1 = None
        self.__lng0 = None
        self.__lng1 = None

    def extend(self, latlng):
        if latlng is None:
            return

        if self.__lat0 is None:
            self.__lat0 = latlng[0]
            self.__lat1 = latlng[0]
            self.__lng0 = latlng[1]
            self.__lng1 = latlng[1]
            return

        self.__lat0 = min(self.__lat0, latlng[0])
        self.__lat1 = max(self.__lat1, latlng[0])
        self.__lng0 = min(self.__lng0, latlng[1])
        self.__lng1 = max(self.__lng1, latlng[1])

    def get_min(self):
        return None if self.__lat0 is None else (self.__lat0, self.__lng0)

    def get_max(self):
        return None if self.__lat0 is None else (self.__lat1, self.__lng1)


def quote(s):
    import re

    return re.sub('"', "'", s)


class Airport:
    def __init__(self):
        self.__id = None
        self.__ident = None
        self.__type = None
        self.__name = None
        self.__latitude_deg = None
        self.__longitude_deg = None
        self.__elevation_ft = None
        self.__continent = None
        self.__iso_country = None
        self.__iso_region = None
        self.__municipality = None
        self.__scheduled_service = None
        self.__gps_code = None
        self.__iata_code = None
        self.__local_code = None
        self.__home_link = None
        self.__wikipedia_link = None
        self.__keywords = None
        self.__runways = 0

        self.__latlng = None
        self.__bounds = None
        self.__nearby = None

    def set_from_array(self, array):
        if len(array) != 18:
            raise Exception("expecting 18 items. received '%s' (%d items)" % (', '.join(array), len(array)))

        self.__id = array[0]
        self.__ident = array[1]
        self.__type = array[2]
        self.__name = array[3]
        self.__latitude_deg = array[4].replace(',', '.')
        self.__longitude_deg = array[5].replace(',', '.')
        self.__elevation_ft = array[6]
        self.__continent = array[7]
        self.__iso_country = array[8]
        self.__iso_region = array[9]
        self.__municipality = array[10]
        self.__scheduled_service = array[11]
        self.__gps_code = array[12]
        self.__iata_code = array[13]
        self.__local_code = array[14]
        self.__home_link = array[15]
        self.__wikipedia_link = array[16]
        self.__keywords = array[17]
        self.__runways = 0
        self.__latlng = (float(self.__latitude_deg), float(self.__longitude_deg))
        self.__bounds = Bounds()
        self.__bounds.extend(self.__latlng)

    def id(self):
        return self.__ident
        
    def name(self):
        return self.__name;
    
    def fancy_name(self):
        code = self.__ident
        if self.__iata_code != "" and self.__iata_code != self.__ident:
            code = code + "/" + self.__iata_code
        return code + " - " + self.__name;
    
    def country(self):
        return self.__iso_country
    
    
    def type(self):
        return self.__type

    def shorten_type(self, type):
        return {
            'large_airport': 'L',
            'medium_airport': 'M',
            'small_airport': 'S',
            'seaplane_base': 'W',
            'balloonport': 'B',
            'closed': 'C',
            'heliport': 'H'
        }.get(type, '?')
    
    def lat(self):
        return self.__latlng[0]
    
    def lng(self):
        return self.__latlng[1]
    
    def non_empty_bounds(self):
        latlng1 = self.__bounds.get_min()
        latlng2 = self.__bounds.get_max()
        return latlng1 != latlng2

    def non_excessive_bounds(self):
        latlng1 = self.__bounds.get_min()
        latlng2 = self.__bounds.get_max()
        d = max(abs(latlng1[0] - latlng2[0]), abs(latlng1[1] - latlng2[1]))
        return d < 0.5

    def to_sql_string(self):
        iata = self.__iata_code
        if iata == self.__ident:
            iata = ""

        latlng1 = self.__bounds.get_min()
        latlng2 = self.__bounds.get_max()
        latlng1 = ('{:.4f}'.format(latlng1[0]), '{:.4f}'.format(latlng1[1]))
        latlng2 = ('{:.4f}'.format(latlng2[0]), '{:.4f}'.format(latlng2[1]))

        return '"{0}","{1}","{2}","{3}","{4}","{5}","{6}",{7},{8},{9},{10},{11},"{12}","{13}","{14}"' \
            .format(self.__ident, iata, quote(self.__name), self.shorten_type(self.__type),
                    self.__iso_country, self.__iso_region, quote(self.__municipality),
                    latlng1[0], latlng1[1],
                    latlng2[0], latlng2[1],
                    self.__runways,
                    self.__nearby[0], self.__nearby[1], self.__nearby[2])
    
    def to_sql_array(self):
        iata = self.__iata_code
        if iata == self.__ident:
            iata = ""

        latlng1 = self.__bounds.get_min()
        latlng2 = self.__bounds.get_max()
        latlng1 = ('{:.4f}'.format(latlng1[0]), '{:.4f}'.format(latlng1[1]))
        latlng2 = ('{:.4f}'.format(latlng2[0]), '{:.4f}'.format(latlng2[1]))
        
        return [self.__ident, iata, self.__name.decode('utf-8'), self.shorten_type(self.__type),
                    self.__iso_country, self.__iso_region, self.__municipality.decode('utf-8'),
                    latlng1[0], latlng1[1],
                    latlng2[0], latlng2[1],
                    self.__runways,
                    self.__nearby[0].decode('utf-8'), self.__nearby[1].decode('utf-8'), self.__nearby[2].decode('utf-8')]

    def compute_bounds(self, runways):
        self.__runways = 0
        for runway in runways:
            #if (not runway.is_closed()) and runway.has_hard_surface() and runway.has_coordinates():
            if runway.has_hard_surface() and runway.has_coordinates():
                self.__runways += 1
                self.__bounds.extend(runway.le_latlng())
                self.__bounds.extend(runway.he_latlng())
    
    def set_nearby(self, nearby):
        self.__nearby = nearby

class AirportsTable:
    def __init__(self, file_name):
        self.__fields = None
        self.__items = {}

        with open(file_name) as csv_file:
            reader = csv.reader(csv_file, delimiter=',')
            for row in reader:
                if not self.__fields:
                    self.__fields = row
                else:
                    airport = Airport()
                    airport.set_from_array(row)
                    self.__items[airport.id()] = airport

    def compute_bounds(self, runways_dict):
        for id, airport in self.__items.iteritems():
            if id in runways_dict:
                airport.compute_bounds(runways_dict[id])

    def to_sql(self, file_name):
        import sqlite3

        if os.path.isfile(file_name):
            os.remove(file_name)
        db = sqlite3.connect(file_name)

        cur = db.cursor()
        cur.execute(
            "CREATE TABLE IF NOT EXISTS airports (id TEXT PRIMARY KEY, iata TEXT, name TEXT, type TEXT, country TEXT, region TEXT, city TEXT, lat1 DECIMAL(9,6), lng1 DECIMAL(9,6), lat2 DECIMAL(9,6), lng2 DECIMAL(9,6), runways INTEGER, nearby1 TEXT, nearby2 TEXT, nearby3 TEXT);")
        db.commit()

        cur = db.cursor()
        count = 0
        for id, airport in self.__items.iteritems():
            count += 1
            values = airport.to_sql_array()
            cur.execute(
                "INSERT INTO airports (id, iata, name, type, country, region, city, lat1, lng1, lat2, lng2, runways, nearby1, nearby2, nearby3) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);",
                values)
        db.commit()
        print("airports {0}".format(count))
    
    
    def dump_list_html(self, file_name):
        import pycountry
        
        if os.path.isfile(file_name):
            os.remove(file_name)
        
        by_country = {}
        for id, airport in self.__items.iteritems():
            if airport.type() == 'large_airport':
                country = 'Unkown'
                if airport.country() == 'KS':
                    country = 'Kosovo'
                else:
                    country = pycountry.countries.get(alpha2=airport.country()).name
                if country not in by_country:
                    by_country[country] = [airport]
                else:
                    by_country[country].append(airport)
        with open(file_name, 'w') as f:
            countries = sorted(by_country.keys())
            for country in countries:
                airports = by_country[country]
                airports.sort(key = lambda a: a.name())
                f.write('<h2>{0}</h2>\n'.format(country))
                f.write('<ul>\n')
                for airport in airports:
                    f.write('<li><a href="http://airports.fraig.de/#{0}">{1}</a></li>\n'.format(airport.id(), airport.fancy_name()))
                f.write('</ul>\n')
    
    
    def check(self):
        for id, airport in self.__items.iteritems():
            if not airport.non_excessive_bounds():
                print("{0}: bad runway coordinates".format(airport.id()))
    
    def wipe_bad_airports(self):
        remaining = {}
        for id, airport in self.__items.iteritems():
            if (airport.type() in ["large_airport", "medium_airport", "small_airport"]) and airport.non_empty_bounds() and airport.non_excessive_bounds():
                remaining[id] = airport
        self.__items = remaining
    
    def compute_nearby(self):
        helpers = []
        for id, a in self.__items.iteritems():
            degrees_to_radians = math.pi/180.0
            phi = (90.0 - a.lat()) * degrees_to_radians
            theta = a.lng() * degrees_to_radians
            sin_phi = math.sin(phi)
            cos_phi = math.cos(phi)
            helpers.append((a.id(), theta, sin_phi, cos_phi))
        
        for (index, (id1, theta1, sin_phi1, cos_phi1)) in enumerate(helpers):
            print(index, len(helpers))
            distances = []
            for (id2, theta2, sin_phi2, cos_phi2) in helpers:
                if id1 != id2:
                    d = math.acos((sin_phi1 * sin_phi2 * math.cos(theta1 - theta2) + cos_phi1 * cos_phi2))
                    distances.append((id2, d))
            distances = sorted(distances, key=lambda x: x[1])
            
            nearby = []
            for id, d in distances[:3]:
                nearby.append(id + ":" + self.__items[id].fancy_name())
            self.__items[id1].set_nearby(nearby)

class Runway:
    def __init__(self):
        self.__id = None
        self.__airport_ref = None
        self.__airport_ident = None
        self.__length_ft = None
        self.__width_ft = None
        self.__surface = None
        self.__lighted = None
        self.__closed = None
        self.__le_ident = None
        self.__le_latitude_deg = None
        self.__le_longitude_deg = None
        self.__le_elevation_ft = None
        self.__le_heading_degT = None
        self.__le_displaced_threshold_ft = None
        self.__he_ident = None
        self.__he_latitude_deg = None
        self.__he_longitude_deg = None
        self.__he_elevation_ft = None
        self.__he_heading_degT = None
        self.__he_displaced_threshold_ft = None

        self.__le_latlng = None
        self.__he_latlng = None

    def set_from_array(self, array):
        if len(array) != 20:
            raise Exception("expecting 20 items. received '%s' (%d items)" % (', '.join(array), len(array)))
        self.__id = array[0]
        self.__airport_ref = array[1]
        self.__airport_ident = array[2]
        self.__length_ft = array[3]
        self.__width_ft = array[4]
        self.__surface = array[5]
        self.__lighted = array[6]
        self.__closed = array[7]
        self.__le_ident = array[8].replace('"', '')
        self.__le_latitude_deg = array[9].replace(',', '.')
        self.__le_longitude_deg = array[10].replace(',', '.')
        self.__le_elevation_ft = array[11]
        self.__le_heading_degT = array[12]
        self.__le_displaced_threshold_ft = array[14]
        self.__he_ident = array[14].replace('"', '')
        self.__he_latitude_deg = array[15].replace(',', '.')
        self.__he_longitude_deg = array[16].replace(',', '.')
        self.__he_elevation_ft = array[17]
        self.__he_heading_degT = array[18]
        self.__he_displaced_threshold_ft = array[19]

        if self.__le_latitude_deg != "" and self.__le_longitude_deg != "":
            self.__le_latlng = (float(self.__le_latitude_deg), float(self.__le_longitude_deg))
        if self.__he_latitude_deg != "" and self.__he_longitude_deg != "":
            self.__he_latlng = (float(self.__he_latitude_deg), float(self.__he_longitude_deg))

    def airport_id(self):
        return self.__airport_ident

    def le_latlng(self):
        return self.__le_latlng

    def he_latlng(self):
        return self.__he_latlng

    def is_closed(self):
        return self.__closed == '1'

    def has_coordinates(self):
        return self.__le_latlng is not None or self.__he_latlng is not None

    def has_hard_surface(self):
        import re

        return re.search('bit|com|con|cop|asp|tar|pem', self.__surface, re.IGNORECASE) is not None    
        
    def to_sql_string(self):
        (he_lat, he_lng) = ('{:.4f}'.format(self.__he_latlng[0]), '{:.4f}'.format(self.__he_latlng[1])) if (self.__he_latlng is not None) else ('', '')
        (le_lat, le_lng) = ('{:.4f}'.format(self.__le_latlng[0]), '{:.4f}'.format(self.__le_latlng[1])) if (self.__le_latlng is not None) else ('', '')

        return '"{0}","{1}","{2}","{3}","{4}","{5}","{6}"' \
            .format(self.__airport_ident, self.__he_ident, he_lat, he_lng, self.__le_ident, le_lat, le_lng)


class RunwaysTable:
    def __init__(self, file_name):
        self.__fields = None
        self.__items = []

        with open(file_name) as csv_file:
            reader = csv.reader(csv_file, delimiter=',')
            for row in reader:
                if not self.__fields:
                    self.__fields = row
                else:
                    runway = Runway()
                    runway.set_from_array(row)
                    self.__items.append(runway)

    def get_runways(self, airport_id):
        return filter(lambda rwy: rwy.airport_id() == airport_id, self.__items)

    def to_dict(self):
        d = {}
        for runway in self.__items:
            if runway.airport_id() in d:
                d[runway.airport_id()].append(runway)
            else:
                d[runway.airport_id()] = [runway]
        return d

    def to_sql(self, file_name):
        import sqlite3

        if os.path.isfile(file_name):
            os.remove(file_name)

        db = sqlite3.connect(file_name)

        cur = db.cursor()
        cur.execute(
            "CREATE TABLE IF NOT EXISTS runways (airport_ident TEXT, he_name TEXT, he_lat DECIMAL(9,6), he_lng DECIMAL(9,6), le_name TEXT, le_lat DECIMAL(9,6), le_lng DECIMAL(9,6));")
        db.commit()

        cur = db.cursor()
        count = 0
        for runway in self.__items:
            if runway.has_coordinates() and runway.has_hard_surface() and not runway.is_closed():
                count += 1
                values = runway.to_sql_string()
                sql = "INSERT INTO runways (airport_ident, he_name, he_lat, he_lng, le_name, le_lat, le_lng) VALUES ({0});".format(values)
                cur.execute(sql)
        db.commit()
        print("runways {0}".format(count))


if __name__ == "__main__":
    import urllib
    import os
    
    if not os.path.isfile("airports.csv"):
        print("retrieving http://ourairports.com/data/airports.csv")
        urllib.URLopener().retrieve("http://ourairports.com/data/airports.csv", "airports.csv")
    if not os.path.isfile("runways.csv"):
        print("retrieving http://ourairports.com/data/runways.csv")
        urllib.URLopener().retrieve("http://ourairports.com/data/runways.csv", "runways.csv")

    airports = AirportsTable("airports.csv")
    runways = RunwaysTable("runways.csv")
    airports.compute_bounds(runways.to_dict())
    airports.check()
    airports.wipe_bad_airports()
    airports.compute_nearby()
    airports.dump_list_html('airports.html')
    airports.to_sql("airports.sqlite")
    runways.to_sql("runways.sqlite")
