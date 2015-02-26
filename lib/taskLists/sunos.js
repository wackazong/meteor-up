var nodemiral = require('nodemiral');
var fs = require('fs');
var path = require('path');

var SCRIPT_DIR = path.resolve(__dirname, '../../scripts/sunos');
var TEMPLATES_DIR = path.resolve(__dirname, '../../templates/sunos');

exports.setup = function(config) {
  var taskList = nodemiral.taskList('Setup (sunos)');

  setEnvVars(taskList, config.appName, config.env);

  runHook(taskList, 'before-setup', config);

  // Installation
  if(config.setupNode) {
    taskList.executeScript('Installing Node.js', {
      script: path.resolve(SCRIPT_DIR, 'install-node.sh'),
      vars: {
        nodeVersion: config.nodeVersion
      }
    });
  }

  taskList.executeScript('Setting up Environment', {
    script: path.resolve(SCRIPT_DIR, 'setup-env.sh'),
    vars: {
      appName: config.appName
    }
  });

  taskList.copy('Setting up Running Script', {
    src: path.resolve(TEMPLATES_DIR, 'run.sh'),
    dest: '/opt/' + appName + '/run.sh',
    vars: {
      appName: config.appName
    }
  });

  var serviceManifestDest = '/opt/' + config.appName + '/config/service-manifest.xml';
  taskList.copy('Copying SMF Manifest', {
    src: path.resolve(TEMPLATES_DIR, 'service-manifest.xml'),
    dest: serviceManifestDest,
    vars: {
      appName: config.appName
    }
  });

  taskList.execute('Configuring SMF Manifest', {
    command: 'sudo svccfg import ' + serviceManifestDest
  });

  runHook(taskList, 'after-setup', config);

  return taskList;
};

exports.deploy = function(bundlePath, serverEnv, config) {
  var taskList = nodemiral.taskList("Deploy app '" + appName + "' (sunos)");

  setEnvVars(taskList, config.appName, serverEnv);

  runHook(taskList, 'before-deploy', config);

  taskList.copy('Uploading bundle', {
    src: bundlePath,
    dest: '/opt/' + config.appName + '/tmp/bundle.tar.gz'
  });

  // deploying
  taskList.executeScript('Invoking deployment process', {
    script: path.resolve(TEMPLATES_DIR, 'deploy.sh'),
    vars: {
      deployCheckWaitTime: config.deployCheckWaitTime || 10,
      appName: config.appName
    }
  });

  runHook(taskList, 'after-deploy', config);

  return taskList;
};

exports.reconfig = function(env, appName) {
  var taskList = nodemiral.taskList("Updating configurations (sunos)");

  setEnvVars(taskList, appName, env);

  //deploying
  taskList.execute('Restarting app', {
    command: '(sudo svcadm disable ' + appName + ' || :) && (sudo svcadm enable ' + appName + ')'
  });

  return taskList;
};

exports.restart = function(appName) {
  var taskList = nodemiral.taskList("Restarting Application (sunos)");

  //restarting
  taskList.execute('Restarting app', {
    command: '(sudo svcadm disable ' + appName + ' || :) && (sudo svcadm enable ' + appName + ')'
  });

  return taskList;
};

exports.stop = function(appName) {
  var taskList = nodemiral.taskList("Stopping Application (sunos)");

  //stopping
  taskList.execute('Stopping app', {
    command: '(sudo svcadm disable ' + appName + ')'
  });

  return taskList;
};

exports.start = function(appName) {
  var taskList = nodemiral.taskList("Starting Application (sunos)");

  setEnvVars(taskList, appName, env);

  //starting
  taskList.execute('Starting app', {
    command: '(sudo svcadm enable ' + appName + ')'
  });

  return taskList;
};

function setEnvVars(taskList, appName, env) {
  taskList.copy('Setting up Environment Variables', {
    src: path.resolve(TEMPLATES_DIR, 'env.sh'),
    dest: '/opt/' + appName + '/config/env.sh',
    vars: {
      env: env || {},
      appName: appName
    }
  });
}

function runHook(taskList, hook, config) {
  if (config.hooks[hook]) {
    taskList.executeScript('Running "' + hook + '" hook script', {
      script: path.resolve(SCRIPT_DIR, 'execute.sh'),
      vars: {
        script: config.hooks[hook],
        appName: config.appName
      }
    });
  }
}
