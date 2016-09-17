#!/bin/bash

if [ ! -f README.md ] ; then
    echo "bad working directory"
    exit 1
fi

if [ ! -f config.txt ] ; then
    echo "no config.txt"
    exit 1
fi
source config.txt

DEPLOY=.deploy
mkdir -p $DEPLOY ;      cp index.html api.php .htaccess data/sitemap.txt $DEPLOY
mkdir -p $DEPLOY/js ;   cp js/* $DEPLOY/js
mkdir -p $DEPLOY/css ;  cp css/* $DEPLOY/css
mkdir -p $DEPLOY/data ; cp data/* $DEPLOY/data

LOCAL=.local
mkdir -p .local

# jquery cookies
if [ -d $LOCAL/jquery-cookie/.git ] ; then
    (cd $LOCAL/jquery-cookie/ ; git pull origin master)
else
    git clone https://github.com/carhartl/jquery-cookie.git $LOCAL/jquery-cookie
fi
cp $LOCAL/jquery-cookie/src/jquery.cookie.js $DEPLOY/js

# history.js
if [ -d $LOCAL/history.js/.git ] ; then
    (cd $LOCAL/history.js/ ; git pull origin master)
else
    git clone https://github.com/browserstate/history.js.git $LOCAL/history.js
fi
cp $LOCAL/history.js/scripts/bundled/html4+html5/jquery.history.js $DEPLOY/js

sed -i \
    -e "s#BASE_URL#${BASE_URL}#g" \
    -e "s/GOOGLE_MAPS_API_KEY/${GOOGLE_MAPS_API_KEY}/g" \
    -e "s/GOOGLE_SITE_VERIFICATION/${GOOGLE_SITE_VERIFICATION}/g" \
    -e "s/BING_SITE_VERIFICATION/${BING_SITE_VERIFICATION}/g" \
    $DEPLOY/index.html 
sed -i \
    -e "s#BASE_URL#${BASE_URL}#g" \
    $DEPLOY/sitemap.txt
sed -i \
    -e "s#BASE_URL#${BASE_URL}#g" \
    -e "s/GOOGLE_MAPS_API_KEY/${GOOGLE_MAPS_API_KEY}/g" \
    -e "s/GOOGLE_ANALYTICS_ACCOUNT/${GOOGLE_ANALYTICS_ACCOUNT}/g" \
    $DEPLOY/js/main.js

ssh $SERVER "mkdir -p $TARGET_DIR"
rsync -avz --progress ${DEPLOY}/* ${DEPLOY}/.htaccess $SERVER:$TARGET_DIR
