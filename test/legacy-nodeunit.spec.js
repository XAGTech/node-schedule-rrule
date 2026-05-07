'use strict';

var path = require('path');
var registerLegacySuite = require('./support/legacy-nodeunit').registerLegacySuite;

[
  'cancel-long-running-jobs.js',
  'convenience-method-test.js',
  'job-test.js',
  'recurrence-rule-test.js',
  'start-end-test.js',
].forEach(function(fileName) {
  var suiteName = path.basename(fileName, '.js');
  registerLegacySuite(suiteName, require('./' + fileName));
});
