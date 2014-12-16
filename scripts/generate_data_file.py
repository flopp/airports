#! /usr/bin/env python

import csv


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

        self.__latlng = None
        self.__bounds = None

    def set_from_array(self, array):
        if len(array) != 18:
            raise Exception("expecting 18 items. received '%s' (%d items)" % (', '.join(array), len(array)))

        self.__id = array[0]
        self.__ident = array[1]
        self.__type = array[2]
        self.__name = array[3]
        self.__latitude_deg = array[4]
        self.__longitude_deg = array[5]
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

        self.__latlng = (float(self.__latitude_deg), float(self.__longitude_deg))
        self.__bounds = Bounds()
        self.__bounds.extend(self.__latlng)

    def id(self):
        return self.__ident

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
    
    def non_empty_bounds(self):
      latlng1 = self.__bounds.get_min()
      latlng2 = self.__bounds.get_max()
      return latlng1 != latlng2
    
    def non_excessive_bounds(self):
      latlng1 = self.__bounds.get_min()
      latlng2 = self.__bounds.get_max()
      d = max(abs(latlng1[0]-latlng2[0]), abs(latlng1[1]-latlng2[1]))
      return d < 0.5
      
    def to_csv_string(self):
        iata = self.__iata_code
        if iata == self.__ident:
            iata = ""

        latlng1 = self.__bounds.get_min()
        latlng2 = self.__bounds.get_max()
        if latlng1 == latlng2:
            latlng1 = ('{:.4f}'.format(latlng1[0]), '{:.4f}'.format(latlng1[1]))
            latlng2 = ('', '')
        else:
            latlng1 = ('{:.4f}'.format(latlng1[0]), '{:.4f}'.format(latlng1[1]))
            latlng2 = ('{:.4f}'.format(latlng2[0]), '{:.4f}'.format(latlng2[1]))

        return "{0},{1},{2},{3},{4},{5},{6},{7},{8},{9}" \
            .format(self.__ident, iata, self.__name, self.shorten_type(self.__type),
                    latlng1[0], latlng1[1],
                    latlng2[0], latlng2[1],
                    self.__iso_country, self.__municipality)

    def to_sql_string(self):
        iata = self.__iata_code
        if iata == self.__ident:
            iata = ""

        latlng1 = self.__bounds.get_min()
        latlng2 = self.__bounds.get_max()
        latlng1 = ('{:.4f}'.format(latlng1[0]), '{:.4f}'.format(latlng1[1]))
        latlng2 = ('{:.4f}'.format(latlng2[0]), '{:.4f}'.format(latlng2[1]))

        return '"{0}","{1}","{2}","{3}","{4}","{5}",{6},{7},{8},{9}' \
            .format(self.__ident, iata, quote(self.__name), self.shorten_type(self.__type),
                    self.__iso_country, quote(self.__municipality),
                    latlng1[0], latlng1[1],
                    latlng2[0], latlng2[1])


    def compute_bounds(self, runways):
        for runway in runways:
            if not runway.is_closed() and runway.has_hard_surface():
                self.__bounds.extend(runway.le_latlng())
                self.__bounds.extend(runway.he_latlng())


class AirportsTable:
    def __init__(self, file_name):
        self.__fields = None
        self.__items = []
        
        with open(file_name) as csv_file:
            reader = csv.reader(csv_file, delimiter=',')
            for row in reader:
                if not self.__fields:
                    self.__fields = row
                else:
                    airport = Airport()
                    airport.set_from_array(row)
                    self.__items.append(airport)

    def compute_bounds(self, runways_dict):
        for airport in self.__items:
            if airport.id() in runways_dict:
                airport.compute_bounds(runways_dict[airport.id()])

    def print_csv(self, file_name):
        with open(file_name, 'w') as csv_file:
            for airport in self.__items:
                if airport.type() in ["large_airport", "medium_airport"]:
                    csv_file.write(airport.to_csv_string() + '\n')
    
    def to_sql(self, file_name):
        import sqlite3
        db = sqlite3.connect(file_name)

        cur = db.cursor()
        cur.execute("CREATE TABLE IF NOT EXISTS airports (id TEXT PRIMARY KEY, iata TEXT, name TEXT, type TEXT, country TEXT, city TEXT, lat1 DECIMAL(9,6), lng1 DECIMAL(9,6), lat2 DECIMAL(9,6), lng2 DECIMAL(9,6));")
        db.commit()

        cur = db.cursor()
        count = 0
        for airport in self.__items:
            if (airport.type() in ["large_airport", "medium_airport", "small_airport"]) and (airport.non_empty_bounds()) and (airport.non_excessive_bounds()):
                count = count + 1
                values = airport.to_sql_string()
                cur.execute("INSERT INTO airports (id, iata, name, type, country, city, lat1, lng1, lat2, lng2) VALUES ({0});"
                            .format(values))
        db.commit()
        print("airports {0}".format(count))


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
        self.__le_ident = array[8]
        self.__le_latitude_deg = array[9]
        self.__le_longitude_deg = array[10]
        self.__le_elevation_ft = array[11]
        self.__le_heading_degT = array[12]
        self.__le_displaced_threshold_ft = array[14]
        self.__he_ident = array[14]
        self.__he_latitude_deg = array[15]
        self.__he_longitude_deg = array[16]
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
    
    def has_hard_surface(self):
        import re
        return re.search('con|asp|tar', self.__surface, re.IGNORECASE) != None


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

if __name__ == "__main__":
    import urllib
    import os

    if not os.path.isfile("airports.csv"):
        urllib.URLopener().retrieve("http://ourairports.com/data/airports.csv", "airports.csv")
    if not os.path.isfile("runways.csv"):
        urllib.URLopener().retrieve("http://ourairports.com/data/runways.csv", "runways.csv")

    airports = AirportsTable("airports.csv")
    runways = RunwaysTable("runways.csv")
    airports.compute_bounds(runways.to_dict())
    #airports.print_csv("data.csv")
    airports.to_sql("airports.sqlite")
