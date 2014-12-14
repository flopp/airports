#!/bin/bash

#TARGET=flopp@grus.uberspace.de:html/airports_fraig.de
TARGET=flopp@95.143.172.223:html/airports_fraig.de/beta

scp -C index.html api.php   $TARGET/
scp -C js/*                 $TARGET/js
scp -C css/*                $TARGET/css
if [[ $@ == **data** ]] ; then
  scp -C data/*               $TARGET/data
fi
