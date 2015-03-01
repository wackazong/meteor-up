#!/bin/bash

sudo chown ${USER} /opt/<%= appName %> -R
sudo chown ${USER} /etc/init
sudo chown ${USER} /etc/

sudo npm install -g forever userdown wait-for-mongo node-gyp

# Creating a non-privileged user
sudo useradd meteoruser || :
