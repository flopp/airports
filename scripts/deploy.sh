#!/bin/bash

#TARGET=flopp@grus.uberspace.de:html/
TARGET=flopp@95.143.172.223:html/
DEPLOY=deploy/airports_fraig.de
mkdir -p $DEPLOY ;      cp index.html api.php sitemap.xml $DEPLOY
mkdir -p $DEPLOY/js ;   cp js/* $DEPLOY/js
mkdir -p $DEPLOY/css ;  cp css/* $DEPLOY/css
mkdir -p $DEPLOY/data ; cp data/* $DEPLOY/data

# jquery cookies
if [ -d ext/jquery-cookie/.git ] ; then
    cd ext/jquery-cookie/
    git pull origin master
    cd -
else
    mkdir -p ext
    cd ext
    git clone https://github.com/carhartl/jquery-cookie.git
    cd -
fi
cp ext/jquery-cookie/src/jquery.cookie.js $DEPLOY/js

# history.js
if [ -d ext/history.js/.git ] ; then
    cd ext/history.js/
    git pull origin master
    cd -
else
    mkdir -p ext
    cd ext
    git clone https://github.com/browserstate/history.js.git
    cd -
fi
cp ext/history.js/scripts/bundled/html4+html5/jquery.history.js $DEPLOY/js

if [ -f config.txt ] ; then
  source config.txt
  sed -i -e "s/GOOGLE_MAPS_API_KEY/${GOOGLE_MAPS_API_KEY}/g" $DEPLOY/index.html 
  sed -i -e "s/GOOGLE_MAPS_API_KEY/${GOOGLE_MAPS_API_KEY}/g" -e "s/GOOGLE_ANALYTICS_ACCOUNT/${GOOGLE_ANALYTICS_ACCOUNT}/g" $DEPLOY/js/main.js
fi
sed -i -e "s/TIMESTAMP/$(date +%Y-%m-%dT%H:%M:%S%:z)/g" $DEPLOY/sitemap.xml

scp -C -r $DEPLOY $TARGET
