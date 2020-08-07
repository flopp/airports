import csv
import logging
import typing

from airports.runway import Runway


class RunwaysTable:
    def __init__(self, file_name: str) -> None:
        logging.info("reading %s", file_name)
        self._fields = None
        self._items: typing.List[Runway] = []

        with open(file_name) as csv_file:
            reader = csv.reader(csv_file, delimiter=",")
            for row in reader:
                if not self._fields:
                    self._fields = row
                else:
                    runway = Runway()
                    runway.set_from_array(row)
                    self._items.append(runway)

    def get_runways(self, airport_icao: str) -> typing.Iterator[Runway]:
        return filter(lambda rwy: rwy.airport_icao() == airport_icao, self._items)

    def to_dict(self) -> typing.Dict[str, typing.List[Runway]]:
        d: typing.Dict[str, typing.List[Runway]] = {}
        for runway in self._items:
            if runway.airport_icao() in d:
                d[runway.airport_icao()].append(runway)
            else:
                d[runway.airport_icao()] = [runway]
        return d
