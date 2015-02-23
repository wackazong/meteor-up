#!/bin/bash

# provide environment variables to custom script
APP_NAME="<%= appName %>"
ROOT_URL="<%= rootUrl %>"
MONGO_URL="<%= mongoUrl %>"
NODE_ENV="<%= nodeEnv %>"
PORT="<%= port %>"
HTTP_FORWARDED_COUNT="<%= httpForwardedCount %>"
BIND_IP="<%= bindIp %>"
UPSTART_UID="<%= upstartUid %>"

<%- script %>