var cjson = require('cjson');
var path = require('path');
var fs = require('fs');
var helpers = require('./helpers');
var format = require('util').format;

require('colors');

exports.read = function() {
  var mupJsonPath = path.resolve('mup.json');
  if(fs.existsSync(mupJsonPath)) {
    var mupJson = cjson.load(mupJsonPath);

    //initialize options
    mupJson.env = mupJson.env || {};

    if(typeof mupJson.setupNode === "undefined") {
      mupJson.setupNode = true;
    }
    if(typeof mupJson.setupPhantom === "undefined") {
      mupJson.setupPhantom = true;
    }
    mupJson.meteorBinary = (mupJson.meteorBinary) ? getCanonicalPath(mupJson.meteorBinary) : 'meteor';
    if(typeof mupJson.appName === "undefined") {
      mupJson.appName = "meteor";
    }

    //validating servers
    if(!mupJson.servers || mupJson.servers.length == 0) {
      mupErrorLog('Server information does not exist');
    } else {
      mupJson.servers.forEach(function(server) {
        if(!server.host) {
          mupErrorLog('Server host does not exist');
        } else if(!server.username) {
          mupErrorLog('Server username does not exist');
        } else if(!server.password && !server.pem) {
          mupErrorLog('Server password or pem does not exist');
        } else if(!mupJson.app) {
          mupErrorLog('Path to app does not exist');
        }

        server.os = server.os || "linux";

        if(server.pem) {
          server.pem = rewriteHome(server.pem);
        } else {
          //hint mup bin script to check whether sshpass installed or not
          mupJson._passwordExists = true;
        }

        server.env = server.env || {};
        var defaultEndpointUrl =
          format("http://%s:%s", server.host, mupJson.env['PORT'] || 80);
        server.env['CLUSTER_ENDPOINT_URL'] =
          server.env['CLUSTER_ENDPOINT_URL'] || defaultEndpointUrl;
      });
    }

    //rewrite ~ with $HOME
    mupJson.app = rewriteHome(mupJson.app);

    //check if the local path exists
    if (!fs.existsSync(mupJson.app)){
        mupErrorLog('Location of app (' + mupJson.app + ') does not exist');
    }

    //load pre-flight and post-flight scripts
    if (mupJson.preFlightScript) {
      if (!fs.existsSync(mupJson.preFlightScript)) {
        mupErrorLog('Pre-flight script (' + mupJson.app + ') does not exist');
      }
      try {
        var pre = fs.readFileSync(mupJson.preFlightScript, 'utf8');
      } catch (err) {
        mupErrorLog('Could not read pre-flight script: ' + err);
      }
      mupJson.preFlightScriptContent = pre;
    }
    if (mupJson.postFlightScript) {
      if (!fs.existsSync(mupJson.postFlightScript)) {
        mupErrorLog('Post-flight script (' + mupJson.app + ') does not exist');
      }
      try {
        var post = fs.readFileSync(mupJson.postFlightScript, 'utf8');
      } catch (err) {
        mupErrorLog('Could not read post-flight script: ' + err);
      }
      mupJson.postFlightScriptContent = post;
    }

    if(mupJson.ssl) {
      mupJson.ssl.backendPort = mupJson.ssl.backendPort || 80;
      mupJson.ssl.pem = path.resolve(rewriteHome(mupJson.ssl.pem));
      if(!fs.existsSync(mupJson.ssl.pem)) {
        mupErrorLog('SSL pem file does not exist');
      }
    }

    return mupJson;
  } else {
    console.error('mup.json file does not exist!'.red.bold);
    helpers.printHelp();
    process.exit(1);
  }
};

function rewriteHome(location) {
  return location.replace('~', process.env.HOME);
}

function mupErrorLog(message) {
  var errorMessage = 'Invalid mup.json file: ' + message;
  console.error(errorMessage.red.bold);
  process.exit(1);
}

function getCanonicalPath(location) {
  var localDir = path.resolve(__dirname, location);
  if(fs.existsSync(localDir)) {
    return localDir;
  } else {
    return path.resolve(rewriteHome(location));
  }
}
