import re
import typing

from s2sphere import LatLng, LatLngRect  # type: ignore


class Runway:
    def __init__(self) -> None:
        self._airport_icao: typing.Optional[str] = None
        self._surface = "con"
        self._bounds = LatLngRect()

    def set_from_array(self, array: typing.List[typing.Any]) -> None:
        if len(array) != 20:
            raise Exception(f"expecting 20 items. received '{', '.join(array)}' ({len(array)} items)")
        # _id = array[0]
        # _airport_ref = array[1]
        self._airport_icao = array[2]
        # _length_ft = array[3]
        # _width_ft = array[4]
        self._surface = array[5]
        # _lighted = array[6]
        # _closed = array[7]
        # _le_ident = array[8].replace('"', "")
        le_latitude_deg = array[9].replace(",", ".")
        le_longitude_deg = array[10].replace(",", ".")
        # _le_elevation_ft = array[11]
        # _le_heading_degT = array[12]
        # _le_displaced_threshold_ft = array[14]
        # _he_ident = array[14].replace('"', "")
        he_latitude_deg = array[15].replace(",", ".")
        he_longitude_deg = array[16].replace(",", ".")
        # _he_elevation_ft = array[17]
        # _he_heading_degT = array[18]
        # _he_displaced_threshold_ft = array[19]

        self._bounds = LatLngRect()
        if le_latitude_deg != "" and le_longitude_deg != "":
            latlng = LatLng.from_degrees(float(le_latitude_deg), float(le_longitude_deg))
            if latlng.is_valid():
                self._bounds = self._bounds.union(LatLngRect.from_point(latlng))
        if he_latitude_deg != "" and he_longitude_deg != "":
            latlng = LatLng.from_degrees(float(he_latitude_deg), float(he_longitude_deg))
            if latlng.is_valid():
                self._bounds = self._bounds.union(LatLngRect.from_point(latlng))

    def airport_icao(self) -> str:
        assert self._airport_icao is not None
        return self._airport_icao

    def bounds(self) -> LatLngRect:
        return self._bounds

    def has_hard_surface(self) -> bool:
        return re.search("bit|com|con|cop|asp|tar|pem", self._surface, re.IGNORECASE) is not None
