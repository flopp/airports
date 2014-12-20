#!/bin/bash

#TARGET=flopp@grus.uberspace.de:html/airports_fraig.de
TARGET=flopp@95.143.172.223:html/airports_fraig.de/beta

mkdir -p deploy
cp index.html api.php deploy
mkdir -p deploy/js
cp js/* deploy/js
mkdir -p deploy/css
cp css/* deploy/css
mkdir -p deploy/data
cp data/* deploy/data

mkdir -p deploy/ext

# jquery cookies
if [ -d deploy/ext/jquery-cookie/.git ] ; then
    cd deploy/ext/jquery-cookie/
    git pull origin master
    cd -
else
    cd deploy/ext
    git clone https://github.com/carhartl/jquery-cookie.git
    cd -
fi
cp deploy/ext/jquery-cookie/src/jquery.cookie.js deploy/js

# history.js
if [ -d deploy/ext/history.js/.git ] ; then
    cd deploy/ext/history.js/
    git pull origin master
    cd -
else
    cd deploy/ext
    git clone https://github.com/browserstate/history.js.git
    cd -
fi
cp deploy/ext/history.js/scripts/bundled/html4+html5/jquery.history.js deploy/js

if [ -f config.txt ] ; then
  source config.txt
  sed -i "s/GOOGLE_MAPS_API_KEY/${GOOGLE_MAPS_API_KEY}/g" deploy/index.html 
  sed -i "s/GOOGLE_ANALYTICS_ACCOUNT/${GOOGLE_ANALYTICS_ACCOUNT}/g" deploy/js/main.js
fi

cd deploy
scp -C index.html api.php   $TARGET/
scp -C js/*                 $TARGET/js
scp -C css/*                $TARGET/css
if [[ $@ == **data** ]] ; then
  scp -C data/*               $TARGET/data
fi
