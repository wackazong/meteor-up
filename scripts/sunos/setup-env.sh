#!/bin/bash

# install make and other build tool
sudo pkgin -y install build-essential

sudo chown ${USER} /opt/<%= appName %> -R
sudo chown ${USER} /etc/init
sudo chown ${USER} /etc/

sudo npm install -g userdown wait-for-mongo node-gyp

# Creating a non-privileged user
sudo useradd mtuser || :
