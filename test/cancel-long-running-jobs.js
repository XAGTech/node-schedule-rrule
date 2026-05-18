'use strict';

var schedule = require('../lib/schedule');
const RR_EVERY_SECOND = 'DTSTART:19700101T000000\nRRULE:FREQ=SECONDLY;WKST=MO';

var assert = require('chai').assert;

describe("cancel-long-running-jobs", function() {
  describe('Cancel Long Running Job', function() {
    it('should work even when recurring jobs are to be run on the past', function(done) {
      var ok = true;
      var job = schedule.scheduleJob(RR_EVERY_SECOND, function() {
        assert.ok(ok);
        var time = Date.now();
        while (ok && Date.now() - time < 2000) {}
      });

      assert.ok(job);
      setTimeout(function() {
        job.cancel();
        done();
        ok = false;
      }, 2100);
    });
  });
});
