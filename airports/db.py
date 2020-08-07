import os
import random
import typing

from airports.airport import Airport, AirportType
from airports.airportstable import AirportsTable
from airports.download import download
from airports.runwaystable import RunwaysTable
from airports.wikipediahelper import get_wikipedia_articles


class DB:
    def __init__(self) -> None:
        self._airports: typing.Dict[str, Airport] = {}
        self._large: typing.List[str] = []
        self._medium: typing.List[str] = []
        self._small: typing.List[str] = []
        self._other: typing.List[str] = []

    def load(self, cache_dir: str, reset_cache: bool) -> None:
        airports_csv = os.path.join(cache_dir, "airports.csv")
        runways_csv = os.path.join(cache_dir, "runways.csv")
        wikipedia_json = os.path.join(cache_dir, "wikipedia_json")
        if reset_cache:
            for file_name in [airports_csv, runways_csv, wikipedia_json]:
                if os.path.exists(file_name):
                    os.remove(file_name)
        airports = AirportsTable(download("https://ourairports.com/data/airports.csv", airports_csv))
        runways = RunwaysTable(download("https://ourairports.com/data/runways.csv", runways_csv))
        articles = get_wikipedia_articles(wikipedia_json)
        airports.add_wikipedia(articles)
        airports.compute_bounds(runways.to_dict())
        airports.check()
        for airport in airports.good_airports():
            self._airports[airport.icao_code()] = airport
            if airport.airport_type() == AirportType.LARGE_AIRPORT:
                self._large.append(airport.icao_code())
            elif airport.airport_type() == AirportType.MEDIUM_AIRPORT:
                self._medium.append(airport.icao_code())
            elif airport.airport_type() == AirportType.SMALL_AIRPORT:
                self._small.append(airport.icao_code())
            else:
                self._other.append(airport.icao_code())

    def get_all_icaos(self) -> typing.List[str]:
        return list(self._airports.keys())

    def get(self, icao: str) -> typing.Optional[Airport]:
        icao = icao.strip().upper()
        if icao in self._airports:
            return self._airports[icao]
        return None

    def get_random(self) -> Airport:
        if random.choice([True, False]):
            return self._airports[random.choice(self._large)]
        if random.choice([True, False]):
            return self._airports[random.choice(self._medium)]
        if random.choice([True, False]):
            return self._airports[random.choice(self._small)]
        return self._airports[random.choice(list(self._airports.keys()))]

    def get_random_list(self, count: int) -> typing.List[Airport]:
        return random.sample(list(self._airports.values()), count)

    def search(self, needle: str) -> typing.Optional[Airport]:
        needle = needle.strip().upper()
        for airport in self._airports.values():
            if airport.matches_code(needle):
                return airport
        for airport in self._airports.values():
            if airport.matches_name(needle):
                return airport
        for airport in self._airports.values():
            if airport.matches_location(needle):
                return airport
        return None
