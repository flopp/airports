#!/bin/bash

cd $1
cp ./other/.htaccess ~/html/airports/
cp ./other/airports.fcgi ~/fcgi-bin/
./scripts/kill-server.sh
./scripts/setup-venv.sh    $1

