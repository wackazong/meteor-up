var nodemiral = require('nodemiral');
var fs = require('fs');
var path = require('path');
var util = require('util');

var SCRIPT_DIR = path.resolve(__dirname, '../../scripts/linux');
var TEMPLATES_DIR = path.resolve(__dirname, '../../templates/linux');

exports.setup = function(config) {
  var taskList = nodemiral.taskList('Setup (linux)');

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

  if(config.setupPhantom) {
    taskList.executeScript('Installing PhantomJS', {
      script: path.resolve(SCRIPT_DIR, 'install-phantomjs.sh')
    });
  }

  taskList.executeScript('Setting up Environment', {
    script: path.resolve(SCRIPT_DIR, 'setup-env.sh'),
    vars: {
      appName: config.appName
    }
  });

  if(config.setupMongo) {
    taskList.copy('Copying MongoDB configuration', {
      src: path.resolve(TEMPLATES_DIR, 'mongodb.conf'),
      dest: '/etc/mongodb.conf'
    });

    taskList.executeScript('Installing MongoDB', {
      script: path.resolve(SCRIPT_DIR, 'install-mongodb.sh')
    });
  }

  if(config.ssl) {
    installStud(taskList);
    configureStud(taskList, config.ssl.pem, config.ssl.backendPort);
  }

  //Configurations
  taskList.copy('Configuring upstart', {
    src: path.resolve(TEMPLATES_DIR, 'meteor.conf'),
    dest: '/etc/init/' + config.appName + '.conf',
    vars: {
      appName: config.appName
    }
  });

  runHook(taskList, 'after-setup', config);

  return taskList;
};

exports.deploy = function(bundlePath, serverEnv, config) {
  var taskList = nodemiral.taskList("Deploy app '" + config.appName + "' (linux)");

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
  var taskList = nodemiral.taskList("Updating configurations (linux)");

  setEnvVars(taskList, appName, env);

  //restarting
  taskList.execute('Restarting app', {
    command: '(sudo stop ' + appName + ' || :) && (sudo start ' + appName + ')'
  });

  return taskList;
};

exports.restart = function(appName) {
  var taskList = nodemiral.taskList("Restarting Application (linux)");

  //restarting
  taskList.execute('Restarting app', {
    command: '(sudo stop ' + appName + ' || :) && (sudo start ' + appName + ')'
  });

  return taskList;
};

exports.stop = function(appName) {
  var taskList = nodemiral.taskList("Stopping Application (linux)");

  //stopping
  taskList.execute('Stopping app', {
    command: '(sudo stop ' + appName + ')'
  });

  return taskList;
};

exports.start = function(appName) {
  var taskList = nodemiral.taskList("Starting Application (linux)");

  //starting
  taskList.execute('Starting app', {
    command: '(sudo start ' + appName + ')'
  });

  return taskList;
};

function installStud(taskList) {
  taskList.executeScript('Installing Stud', {
    script: path.resolve(SCRIPT_DIR, 'install-stud.sh')
  });
}

function configureStud(taskList, pemFilePath, port) {
  var backend = {host: '127.0.0.1', port: port};

  taskList.copy('Configuring Stud for Upstart', {
    src: path.resolve(TEMPLATES_DIR, 'stud.init.conf'),
    dest: '/etc/init/stud.conf'
  });

  taskList.copy('Configuring SSL', {
    src: pemFilePath,
    dest: '/opt/stud/ssl.pem'
  });

  taskList.copy('Configuring Stud', {
    src: path.resolve(TEMPLATES_DIR, 'stud.conf'),
    dest: '/opt/stud/stud.conf',
    vars: {
      backend: util.format('[%s]:%d', backend.host, backend.port)
    }
  });

  //restart stud
  taskList.execute('Strating Stud', {
    command: '(sudo stop stud || :) && (sudo start stud || :)'
  });
}

function setEnvVars(taskList, appName, env) {

  taskList.executeScript('Creating app directories', {
    script: path.resolve(SCRIPT_DIR, 'make-appdir.sh'),
    vars: {
      appName: appName
    }
  });

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
