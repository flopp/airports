#!/bin/bash

cd ~/projects/airports/
cp ./other/.htaccess ~/html/airports/
cp ./other/airports.fcgi ~/fcgi-bin/
./scripts/kill-server.sh
./scripts/setup-venv.sh ~/projects/airports/

