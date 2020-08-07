import csv
import logging
import typing

from airports.airport import Airport, AirportType
from airports.runway import Runway


class AirportsTable:
    def __init__(self, file_name: str) -> None:
        logging.info("reading %s", file_name)
        self._fields = None
        self._items: typing.Dict[str, Airport] = {}

        with open(file_name) as csv_file:
            reader = csv.reader(csv_file, delimiter=",")
            for row in reader:
                if not self._fields:
                    self._fields = row
                else:
                    try:
                        airport = Airport()
                        airport.set_from_array(row)
                        self._items[airport.icao_code()] = airport
                    except IndexError as e:
                        logging.warning(repr(e))

    def add_wikipedia(self, articles: typing.Dict[str, str]) -> None:
        logging.info("adding wikipedia articles")
        count = 0
        for icao_code, airport in self._items.items():
            if icao_code in articles:
                if airport.update_wikipedia(articles[icao_code]):
                    count += 1
        logging.info("   -> added articles: %d", count)

    def compute_bounds(self, runways_dict: typing.Dict[str, typing.List[Runway]]) -> None:
        logging.info("computing bounds of airports")
        for icao_code, airport in self._items.items():
            if icao_code in runways_dict:
                airport.compute_bounds(runways_dict[icao_code])

    def check(self) -> None:
        logging.info("checking airport coordinates")
        for _, airport in self._items.items():
            if airport.excessive_bounds():
                logging.info("    %s: bad runway coordinates", airport.icao_code())

    def good_airports(self) -> typing.Generator[Airport, None, None]:
        for _, airport in self._items.items():
            if (
                (
                    airport.airport_type()
                    in [AirportType.LARGE_AIRPORT, AirportType.MEDIUM_AIRPORT, AirportType.SMALL_AIRPORT,]
                )
                and not airport.empty_bounds()
                and not airport.excessive_bounds()
            ):
                yield airport
