#!/bin/bash

TARGET=flopp@grus.uberspace.de:html/airports_fraig.de

scp -C index.html $TARGET/
scp -C js/*       $TARGET/js
scp -C css/*      $TARGET/css
scp -C data/*     $TARGET/data
scp -C img/*      $TARGET/img
