import logging
import os
import pathlib

import requests

from airports.version import __user_agent__


def download(url: str, cache_file_name: str) -> str:
    if os.path.isfile(cache_file_name):
        return cache_file_name

    logging.info("downloading: %s", url)
    res = requests.get(url, headers={"user-agent": __user_agent__})
    if res.status_code == 200:
        data = res.content
    else:
        raise RuntimeError(f"downloading {url} yields {res.status_code}")

    pathlib.Path(os.path.dirname(cache_file_name)).mkdir(parents=True, exist_ok=True)
    with open(cache_file_name, "wb") as f:
        f.write(data)

    return cache_file_name
