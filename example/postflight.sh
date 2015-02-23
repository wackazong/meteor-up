#!/bin/bash

DEMOFILE=/tmp/meteor-up_postflight_was_here
echo App name is: $APP_NAME > $DEMOFILE
echo Root URL is: $ROOT_URL >> $DEMOFILE
echo Mongo URL is: $MONGO_URL >> $DEMOFILE
echo Node env is: $NODE_ENV >> $DEMOFILE
echo Port is: $PORT >> $DEMOFILE
echo HTTP forwarded count is: $HTTP_FORWARDED_COUNT >> $DEMOFILE
echo Bind IP is: $BIND_IP >> $DEMOFILE
echo Upstart UID is: $UPSTART_UID >> $DEMOFILE
