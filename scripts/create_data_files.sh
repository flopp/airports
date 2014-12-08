#!/bin/bash

if [[ $@ == **--force** ]] ; then
  echo "removing airports.csv and runways.csv"
  rm -f airports.csv runways.csv
fi

if [ ! -f airports.csv ] ; then
  echo "fetching airports.csv"
  wget -q http://ourairports.com/data/airports.csv
fi

if [ ! -f runways.csv ] ; then
  echo "fetching runways.csv"
  wget -q http://ourairports.com/data/runways.csv
fi
