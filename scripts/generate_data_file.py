#!./venv/bin/python3

import csv
import json
import math
import os
import urllib.request
import sys
import pycountry
import SPARQLWrapper

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
    
    def fancy_location(self):
        country = None
        if self.__iso_country == 'KS' or self.__iso_country == 'XK':
            country = 'Kosovo'
        else:
            country = pycountry.countries.get(alpha_2=self.__iso_country).name
        city = self.__municipality
        
        if country is None or country == "":
            if city is None or city == "":
                return "Unknown Location"
            else:
                return city
        else:
            if city is None or city == "":
                return "Somewhere in {}".format(country)
            else:
                return "{}, {}".format(city, country)
    
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
    
    def to_csv_string(self):
        iata = self.__iata_code
        if iata == self.__ident:
            iata = ""
        latlng1 = self.__bounds.get_min()
        latlng2 = self.__bounds.get_max()
        latlng1 = ('{:.4f}'.format(latlng1[0]), '{:.4f}'.format(latlng1[1]))
        latlng2 = ('{:.4f}'.format(latlng2[0]), '{:.4f}'.format(latlng2[1]))
        return '{}\t{}\t{}\t{}\t{}\t{}\t{}\t{}\t{}\t{}\n'.format(
            self.__ident, 
            iata, 
            self.fancy_name(), 
            self.shorten_type(self.__type),
            self.fancy_location(),
            latlng1[0], latlng1[1],
            latlng2[0], latlng2[1],
            self.__wikipedia_link)
    
    def compute_bounds(self, runways):
        self.__runways = 0
        for runway in runways:
            #if (not runway.is_closed()) and runway.has_hard_surface() and runway.has_coordinates():
            if runway.has_hard_surface() and runway.has_coordinates():
                self.__runways += 1
                self.__bounds.extend(runway.le_latlng())
                self.__bounds.extend(runway.he_latlng())
    
    def update_wikipedia(self, url):
        if self.__wikipedia_link is None or self.__wikipedia_link == "":
            self.__wikipedia_link = url
            return True
        return False

class AirportsTable:
    def __init__(self, file_name):
        print("-- reading {}".format(file_name))
        self.__fields = None
        self.__items = {}

        with open(file_name) as csv_file:
            reader = csv.reader(csv_file, delimiter=',')
            for row in reader:
                if not self.__fields:
                    self.__fields = row
                else:
                    try:
                        airport = Airport()
                        airport.set_from_array(row)
                        self.__items[airport.id()] = airport
                    except Exception as e:
                        print(e)
    
    def add_wikipedia(self, articles):
        print("-- adding wikipedia articles")
        count = 0
        for id, airport in self.__items.items():
            if id in articles:
                if airport.update_wikipedia(articles[id]):
                    count += 1
        print("  -> added articles: {}".format(count))    
        
    def compute_bounds(self, runways_dict):
        print("-- computing bounds of airports")
        for id, airport in self.__items.items():
            if id in runways_dict:
                airport.compute_bounds(runways_dict[id])
    
    def dump_csv(self, file_name):
        print("-- creating csv {}".format(file_name))
        import pycountry
        
        if os.path.isfile(file_name):
            os.remove(file_name)
        
        lines = []
        for _, airport in self.__items.items():
            lines.append(airport.to_csv_string())
        with open(file_name, 'w') as f:
            for line in sorted(lines):
                f.write(line)
    
    def check(self):
        print("-- checking airport coordinates")
        for id, airport in self.__items.items():
            if not airport.non_excessive_bounds():
                print("   {0}: bad runway coordinates".format(airport.id()))

    def wipe_bad_airports(self):
        print("-- wiping bad airports")
        remaining = {}
        for id, airport in self.__items.items():
            if (airport.type() in ["large_airport", "medium_airport", "small_airport"]) and airport.non_empty_bounds() and airport.non_excessive_bounds():
                remaining[id] = airport
        print("   {} -> {}".format(len(self.__items), len(remaining)))
        self.__items = remaining

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

class RunwaysTable:
    def __init__(self, file_name):
        print("-- reading {}".format(file_name))
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

def make_parent_dir(file_name):
    d = os.path.dirname(file_name)
    if not os.path.isdir(d):
        print("-- creating dir: {}".format(d))
        os.makedirs(d)

def wikipedia_articles(file_name):
    articles = {}
    j = None
    if os.path.isfile(file_name):
        with open(file_name, 'r', encoding='utf-8') as f:
            j = json.load(f)
    else:
        print("-- querying wikipedia article links")
        sparql = SPARQLWrapper.SPARQLWrapper("https://query.wikidata.org/sparql")
        sparql.setQuery("""
            PREFIX schema: <http://schema.org/>
            PREFIX wikibase: <http://wikiba.se/ontology#>
            PREFIX wd: <http://www.wikidata.org/entity/>
            PREFIX wdt: <http://www.wikidata.org/prop/direct/>
            SELECT ?cid ?icao ?article WHERE {
                ?cid wdt:P31 wd:Q1248784 ;
                wdt:P239 ?icao .
                OPTIONAL {
                    ?article schema:about ?cid .
                    ?article schema:inLanguage "en" .
                    FILTER (SUBSTR(str(?article), 1, 25) = "https://en.wikipedia.org/")
                }
            } 
            """)
        sparql.setReturnFormat(SPARQLWrapper.JSON)
        results = sparql.query().convert()
        j = results["results"]["bindings"]
        make_parent_dir(file_name)
        with open(file_name, 'w', encoding='utf-8') as f:
            json.dump(j, f)
    for item in j:
        if 'icao' not in item:
            continue
        icao = item['icao']['value'].upper()
        if 'article' in item:
            articles[icao] = item['article']['value']
    return articles


def download(url, target):
    if os.path.isfile(target):
        return
    make_parent_dir(target)
    print("-- downloading: {}".format(url))
    urllib.request.urlretrieve(url, target)


if __name__ == "__main__":    
    if not os.path.isfile("README.md"):
        print("not the project's root")
        sys.exit(1)
    
    
    airports_csv = ".local/airports.csv"
    runways_csv = ".local/runways.csv"
    download("http://ourairports.com/data/airports.csv", airports_csv)
    download("http://ourairports.com/data/runways.csv", runways_csv)
    wikipedia_json = ".local/wikipedia.json"
    articles = wikipedia_articles(wikipedia_json)
    
    airports = AirportsTable(airports_csv)
    runways = RunwaysTable(runways_csv)
    airports.add_wikipedia(articles)
    airports.compute_bounds(runways.to_dict())
    airports.check()
    airports.wipe_bad_airports()
    airports.dump_csv("www/data/airports.txt")
