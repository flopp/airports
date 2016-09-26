#!/bin/bash

cd ~/projects/airports/
mkdir -p ~/html/airports/
cp ./other/.htaccess ~/html/airports/
mkdir -p ~/fcgi-bin/
cp ./other/airports.fcgi ~/fcgi-bin/
./scripts/kill-server.sh
./scripts/setup-venv.sh ~/projects/airports

