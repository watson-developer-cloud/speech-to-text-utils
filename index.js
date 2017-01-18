#!/usr/bin/env node

const pkg = require('./package.json');
require('colors');

if (require.main === module) {
  require('./lib/index.js');
} else {
  // setup as Node module
  console.log(`${pkg.name} is a command line tool, not a module include.`.yellow);
  console.log('If you\'d like to programmatically integrate the Watson services' +
  ' into your app, use the Watson Node.js SDK https://github.com/watson-developer-cloud/node-sdk/');
}
