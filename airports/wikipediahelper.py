import json
import logging
import os
import pathlib
import re
import typing
import urllib.parse

import SPARQLWrapper  # type: ignore
import wikipedia  # type: ignore

from airports.version import __user_agent__


def get_wikipedia_summary(url: str) -> str:
    wiki_re = re.compile(r"^https?://(.+)\.wikipedia.org/wiki/(.+)$")
    m = wiki_re.match(url)
    if m:
        lang = m.group(1)
        topic = urllib.parse.unquote(m.group(2).replace("_", " "))
        logging.info("fetching wikipedia data from %s", url)
        try:
            wikipedia.set_lang(lang)
            return wikipedia.summary(topic, sentences=3)
        except Exception:  # pylint: disable=broad-except
            logging.warning("failed to download wikipedia infos from %s", url)
            return ""
    return ""


def get_wikipedia_articles(cache_file_name: str) -> typing.Dict[str, str]:
    articles = {}
    j = None
    if os.path.isfile(cache_file_name):
        with open(cache_file_name, "r", encoding="utf-8") as f:
            j = json.load(f)
    else:
        logging.info("querying wikipedia article links")
        sparql = SPARQLWrapper.SPARQLWrapper("https://query.wikidata.org/sparql", agent=__user_agent__)
        sparql.setQuery(
            """
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
            """
        )
        sparql.setReturnFormat(SPARQLWrapper.JSON)
        results = sparql.query().convert()
        j = results["results"]["bindings"]
        pathlib.Path(os.path.dirname(cache_file_name)).mkdir(parents=True, exist_ok=True)
        with open(cache_file_name, "w", encoding="utf-8") as f:
            json.dump(j, f)
    for item in j:
        if "icao" not in item:
            continue
        icao = item["icao"]["value"].upper()
        if "article" in item:
            articles[icao] = item["article"]["value"]
    return articles
