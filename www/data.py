from www import app
import random
import re
import urllib.parse
import wikipedia

class Data:
    def __init__(self):
        self._airports = []
        self._large = []
        self._medium = []
        self._small = []
        
    def get_all_ids(self):
        ids = []
        for i in self._large:
            ids.append(self._airports[i]["id"])
        for i in self._medium:
            ids.append(self._airports[i]["id"])
        for i in self._small:
            ids.append(self._airports[i]["id"])
        return ids
    
    def add_wiki(self, airport):
        if airport["wiki_data"] is None:
            if airport["wiki_topic"] is not None:
                try:
                    wikipedia.set_lang(airport["wiki_lang"])
                    summary = wikipedia.summary(airport["wiki_topic"], sentences=3)
                    airport["wiki_data"] = summary
                except:
                    airport["wiki_data"] = ""
            else:
                airport["wiki_data"] = ""
        return airport
    
    def get(self, code):
        code = code.strip().upper()
        for airport in self._airports:
            if airport["id"] == code:
                return self.add_wiki(airport)
        return None
    
    def get_random(self):
        index = 0
        if random.choice([True, False]):
            index = random.choice(self._large)
        elif random.choice([True, False]):
            index = random.choice(self._medium)
        else:
            index = random.choice(self._small)
        return self.add_wiki(self._airports[index])
    
    def get_random_list(self, count):
        return random.sample(self._airports, count)
        
    def search(self, needle):
        needle = needle.strip().upper()
        for airport in self._airports:
            if airport["id"].upper() == needle:
                return self.add_wiki(airport)
            elif airport["iata"].upper() == needle:
                return self.add_wiki(airport)
        for airport in self._airports:
            if needle in airport["name"].upper():
                return self.add_wiki(airport)
        for airport in self._airports:
            if needle in airport["location"].upper():
                return self.add_wiki(airport)
        return None
        
    def load(self, file_name):
        import time
        start_time = time.time()
        self._airports = []
        self._large = []
        self._medium = []
        self._small = []
        self._lookup = {}
        with open(file_name, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line.startswith('#') or line == '':
                    continue
                a = line.split('\t')
                # 0=id/icao 1=iata 2=name 3=type 4=location 5=lat1 6=lng1 7=lat2 8=lng2
                if len(a) != 9 and len(a) != 10:
                    continue
                icao = a[0].strip().upper()
                iata = a[1].strip().upper()
                name = a[2].strip()
                type = a[3].strip().upper()
                loc  = a[4].strip()
                lat1 = float(a[5].strip())
                lng1 = float(a[6].strip())
                lat2 = float(a[7].strip())
                lng2 = float(a[8].strip())
                wiki_url = None
                wiki_lang = None
                wiki_topic = None
                if len(a) == 10:
                    wiki_url = a[9].strip()
                    rx = re.compile('^https?://(.+)\.wikipedia.org/wiki/(.+)$')
                    m = rx.match(wiki_url)
                    if m:
                        wiki_lang = m.group(1)
                        wiki_topic = m.group(2).replace('_', ' ')
                        wiki_topic = urllib.parse.unquote(wiki_topic)
                
                index = len(self._airports)
                self._lookup[icao] = index
                if type == 'L':
                    self._large.append(index)
                elif type == 'M':
                    self._medium.append(index)
                else:
                    self._small.append(index)
                
                self._airports.append({
                    "id": icao,
                    "iata": iata,
                    "name": name,
                    "type": type,
                    "location": loc,
                    "lat1": lat1,
                    "lng1": lng1,
                    "lat2": lat2,
                    "lng2": lng2,
                    "wiki_url": wiki_url,
                    "wiki_lang": wiki_lang,
                    "wiki_topic": wiki_topic,
                    "wiki_data": None})
        
        elapsed_time = time.time() - start_time
        print('-- loading time: {}s'.format(elapsed_time))
