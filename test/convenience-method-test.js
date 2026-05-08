'use strict';

var sinon = require('sinon');
var main = require('../package.json').main;
var schedule = require('../' + main);
var clock;
var {RRule} = require('rrule');

const RR_EVERY_SECOND = 'DTSTART:19700101T000000\nRRULE:FREQ=SECONDLY;WKST=MO';
const RR_EVERY_MINUTE = 'DTSTART:19700101T000000\nRRULE:FREQ=MINUTELY;WKST=MO';
const RR_UNTIL_1960 = 'DTSTART:19600803T190600\nRRULE:FREQ=SECONDLY;UNTIL=19600803T190700;WKST=MO';

var assert = require('chai').assert;

describe("convenience-method-test", function() {
  beforeEach(function(cb) {
    clock = sinon.useFakeTimers();
    cb();
  });

  afterEach(function(cb) {
    clock.restore();
    cb();
  });

  describe('.scheduleJob', function() {
    it('Returns Job instance', function(done) {
      var job = schedule.scheduleJob(new Date(Date.now() + 1000), function() {});

      assert.ok(job instanceof schedule.Job);

      job.cancel();
      done();
    });
  });

  describe('.scheduleJob(Date, fn)', function() {
    it('Runs job once at some date', function(done) {
      var runCount = 0;
      schedule.scheduleJob(new Date(Date.now() + 3000), function() {
        runCount += 1;
      });

      setTimeout(function() {
        assert.strictEqual(runCount, 1);
        done();
      }, 3250);

      clock.tick(3250);
    });

    it("Job doesn't emit initial 'scheduled' event", function(done) {
      var job = schedule.scheduleJob(new Date(Date.now() + 1000), function() {});

      job.on('scheduled', function() {
        assert.fail("Initial 'scheduled' event should not be emitted");
      });

      setTimeout(function() {
        done();
      }, 1250);

      clock.tick(1250);
    });

    it("Won't run job if scheduled in the past", function(done) {
      var job = schedule.scheduleJob(new Date(Date.now() - 3000), function() {
        assert.fail('Past-scheduled job should not run');
      });

      assert.equal(job, null);

      setTimeout(function() {
        done();
      }, 1000);

      clock.tick(1000);
    });
  });

  describe('.scheduleJob(RecurrenceRule, fn)', function() {
    it('Runs job at interval based on recur rule, repeating indefinitely', function(done) {
      var runCount = 0;
      var job = schedule.scheduleJob(RR_EVERY_SECOND, function() {
        runCount += 1;
      });

      setTimeout(function() {
        job.cancel();
        assert.strictEqual(runCount, 4);
        done();
      }, 3250);

      clock.tick(3250);
    });

    it("Job doesn't emit initial 'scheduled' event", function(done) {
      /*
       * The explicit DTSTART matches the fake clock start, so the job also runs at t=0.
       */

      var scheduledCount = 0;
      var job = new schedule.scheduleJob(RR_EVERY_SECOND, function() {});

      job.on('scheduled', function() {
        scheduledCount += 1;
      });

      setTimeout(function() {
        job.cancel();
        assert.strictEqual(scheduledCount, 4);
        done();
      }, 3250);

      clock.tick(3250);
    });

    it("Doesn't invoke job if recur rule schedules it in the past", function(done) {

      var job = schedule.scheduleJob(RR_UNTIL_1960, function() {
        assert.fail('Past recurring rule should not run');
      });

      assert.equal(job, null);

      setTimeout(function() {
        done();
      }, 1000);

      clock.tick(1000);
    });
  });

  describe('.scheduleJob({...}, fn)', function() {
    it('Runs job at interval based on object, repeating indefinitely', function(done) {
      var runCount = 0;
      var job = new schedule.scheduleJob(
        {
          freq: RRule.SECONDLY,
        },
        function() {
          runCount += 1;
        }
      );

      setTimeout(function() {
        job.cancel();
        assert.strictEqual(runCount, 3);
        done();
      }, 3250);

      clock.tick(3250);
    });

    it("Job doesn't emit initial 'scheduled' event", function(done) {
      /*
       * With Job#schedule this would be 3:
       *  scheduled at time 0
       *  scheduled at time 1000
       *  scheduled at time 2000
       */

      var job = schedule.scheduleJob(
        {
          freq: RRule.SECONDLY,
        },
        function() {}
      );

      var scheduledCount = 0;

      job.on('scheduled', function() {
        scheduledCount += 1;
      });

      setTimeout(function() {
        job.cancel();
        assert.strictEqual(scheduledCount, 2);
        done();
      }, 2250);

      clock.tick(2250);
    });

    it("Doesn't invoke job if object schedules it in the past", function(done) {

      var job = schedule.scheduleJob(
        {
          until: new Date('1960-01-01'),
          freq: RRule.SECONDLY,
        },
        function() {
          assert.fail('Past object schedule should not run');
        }
      );

      assert.equal(job, null);

      setTimeout(function() {
        done();
      }, 1000);

      clock.tick(1000);
    });
  });

  describe('.rescheduleJob(job, {...})', function() {
    it('Reschedule jobs from object based to object based', function(done) {
      var runCount = 0;
      var job = new schedule.scheduleJob(
        {
          freq: RRule.SECONDLY,
        },
        function() {
          runCount += 1;
        }
      );

      setTimeout(function() {
        schedule.rescheduleJob(job, {
          freq: RRule.MINUTELY,
        });
      }, 3250);

      setTimeout(function() {
        job.cancel();
        assert.strictEqual(runCount, 3);
        done();
      }, 5000);

      clock.tick(5000);
    });

    it('Reschedule jobs from every minutes to every second', function(done) {

      var timeout = 60 * 1000;

      var runCount = 0;
      var job = new schedule.scheduleJob(
        {
          freq: RRule.MINUTELY,
        },
        function() {
          runCount += 1;
        }
      );

      setTimeout(function() {
        schedule.rescheduleJob(job, {
          freq: RRule.SECONDLY,
        });
      }, timeout);

      setTimeout(function() {
        job.cancel();
        assert.strictEqual(runCount, 3);
        done();
      }, timeout + 2250);

      clock.tick(timeout + 2250);
    });
  });

  describe('.rescheduleJob(job, Date)', function() {
    it('Reschedule jobs from Date to Date', function(done) {

      var runCount = 0;
      var job = new schedule.scheduleJob(new Date(Date.now() + 3000), function() {
        runCount += 1;
      });

      setTimeout(function() {
        schedule.rescheduleJob(job, new Date(Date.now() + 5000));
      }, 1000);

      setTimeout(function() {
        assert.strictEqual(runCount, 1);
        done();
      }, 6150);

      clock.tick(6150);
    });

    it('Reschedule jobs that has been executed', function(done) {

      var runCount = 0;
      var job = new schedule.scheduleJob(new Date(Date.now() + 1000), function() {
        runCount += 1;
      });

      setTimeout(function() {
        schedule.rescheduleJob(job, new Date(Date.now() + 2000));
      }, 2000);

      setTimeout(function() {
        assert.strictEqual(runCount, 2);
        done();
      }, 5150);

      clock.tick(5150);
    });
  });

  describe('.rescheduleJob(job, RecurrenceRule)', function() {
    it('Reschedule jobs from RecurrenceRule to RecurrenceRule', function(done) {

      var timeout = 60 * 1000;

      var runCount = 0;
      var job = schedule.scheduleJob(RR_EVERY_SECOND, function() {
        runCount += 1;
      });

      setTimeout(function() {
        schedule.rescheduleJob(job, RR_EVERY_MINUTE);
      }, 2250);

      setTimeout(function() {
        job.cancel();
        assert.strictEqual(runCount, 4);
        done();
      }, timeout + 2250);

      clock.tick(timeout + 2250);
    });

    it('Reschedule jobs from RecurrenceRule to Date', function(done) {

      var runCount = 0;
      var job = schedule.scheduleJob(RR_EVERY_SECOND, function() {
        runCount += 1;
      });

      setTimeout(function() {
        schedule.rescheduleJob(job, new Date(Date.now() + 2000));
      }, 2150);

      setTimeout(function() {
        assert.strictEqual(runCount, 4);
        done();
      }, 4250);

      clock.tick(4250);
    });

    it('Reschedule jobs from RecurrenceRule to {...}', function(done) {

      var timeout = 60 * 1000;

      var runCount = 0;
      var job = schedule.scheduleJob(RR_EVERY_SECOND, function() {
        runCount += 1;
      });

      setTimeout(function() {
        schedule.rescheduleJob(job, {
          freq: RRule.MINUTELY,
        });
      }, 2150);

      setTimeout(function() {
        job.cancel();
        assert.strictEqual(runCount, 4);
        done();
      }, timeout + 2150);

      clock.tick(timeout + 2150);
    });

    it('Reschedule jobs that is not available', function(done) {

      var runCount = 0;
      var job = schedule.scheduleJob(RR_EVERY_SECOND, function() {
        runCount += 1;
      });

      setTimeout(function() {
        schedule.rescheduleJob(null, new Date(Date.now() + 2000));
      }, 2150);

      setTimeout(function() {
        job.cancel();
        assert.strictEqual(runCount, 5);
        done();
      }, 4250);

      clock.tick(4250);
    });
  });

  describe('.rescheduleJob("job name", {...})', function() {
    it('Reschedule jobs from object based to object based', function(done) {

      var runCount = 0;
      var job = new schedule.scheduleJob(
        {
          freq: RRule.SECONDLY,
        },
        function() {
          runCount += 1;
        }
      );

      setTimeout(function() {
        schedule.rescheduleJob(job.name, {
          freq: RRule.MINUTELY,
        });
      }, 3250);

      setTimeout(function() {
        job.cancel();
        assert.strictEqual(runCount, 3);
        done();
      }, 5000);

      clock.tick(5000);
    });

    it('Reschedule jobs from every minutes to every second', function(done) {

      var timeout = 60 * 1000;

      var runCount = 0;
      var job = new schedule.scheduleJob(
        {
          freq: RRule.MINUTELY,
        },
        function() {
          runCount += 1;
        }
      );

      setTimeout(function() {
        schedule.rescheduleJob(job.name, {
          freq: RRule.SECONDLY,
        });
      }, timeout);

      setTimeout(function() {
        job.cancel();
        assert.strictEqual(runCount, 3);
        done();
      }, timeout + 2250);

      clock.tick(timeout + 2250);
    });
  });

  describe('.rescheduleJob("job name", Date)', function() {
    it('Reschedule jobs from Date to Date', function(done) {

      var runCount = 0;
      var job = new schedule.scheduleJob(new Date(Date.now() + 3000), function() {
        runCount += 1;
      });

      setTimeout(function() {
        schedule.rescheduleJob(job.name, new Date(Date.now() + 5000));
      }, 1000);

      setTimeout(function() {
        assert.strictEqual(runCount, 1);
        done();
      }, 6150);

      clock.tick(6150);
    });

    it('Reschedule jobs that has been executed', function(done) {

      var runCount = 0;
      var job = new schedule.scheduleJob(new Date(Date.now() + 1000), function() {
        runCount += 1;
      });

      setTimeout(function() {
        schedule.rescheduleJob(job.name, new Date(Date.now() + 2000));
      }, 2000);

      setTimeout(function() {
        assert.strictEqual(runCount, 2);
        done();
      }, 5150);

      clock.tick(5150);
    });
  });

  describe('.rescheduleJob("job name", RecurrenceRule)', function() {
    it('Reschedule jobs from RecurrenceRule to RecurrenceRule', function(done) {

      var timeout = 60 * 1000;

      var runCount = 0;
      var job = schedule.scheduleJob(RR_EVERY_SECOND, function() {
        runCount += 1;
      });

      setTimeout(function() {
        schedule.rescheduleJob(job.name, RR_EVERY_MINUTE);
      }, 2250);

      setTimeout(function() {
        job.cancel();
        assert.strictEqual(runCount, 4);
        done();
      }, timeout + 2250);

      clock.tick(timeout + 2250);
    });

    it('Reschedule jobs from RecurrenceRule to Date', function(done) {

      var runCount = 0;
      var job = schedule.scheduleJob(RR_EVERY_SECOND, function() {
        runCount += 1;
      });

      setTimeout(function() {
        schedule.rescheduleJob(job.name, new Date(Date.now() + 2000));
      }, 2150);

      setTimeout(function() {
        assert.strictEqual(runCount, 4);
        done();
      }, 4250);

      clock.tick(4250);
    });

    it('Reschedule jobs from RecurrenceRule to {...}', function(done) {

      var timeout = 60 * 1000;

      var runCount = 0;
      var job = schedule.scheduleJob(RR_EVERY_SECOND, function() {
        runCount += 1;
      });

      setTimeout(function() {
        schedule.rescheduleJob(job.name, {
          freq: RRule.MINUTELY,
        });
      }, 2150);

      setTimeout(function() {
        job.cancel();
        assert.strictEqual(runCount, 4);
        done();
      }, timeout + 2150);

      clock.tick(timeout + 2150);
    });

    it('Reschedule jobs that is not available', function(done) {

      var runCount = 0;
      var job = schedule.scheduleJob(RR_EVERY_SECOND, function() {
        runCount += 1;
      });

      setTimeout(function() {
        schedule.rescheduleJob('Blah', new Date(Date.now() + 2000));
      }, 2150);

      setTimeout(function() {
        job.cancel();
        assert.strictEqual(runCount, 5);
        done();
      }, 4250);

      clock.tick(4250);
    });
  });

  describe('.cancelJob(Job)', function() {
    it('Prevents all future invocations of Job passed in', function(done) {

      var runCount = 0;
      var job = schedule.scheduleJob(
        {
          freq: RRule.SECONDLY,
        },
        function() {
          runCount += 1;
        }
      );

      setTimeout(function() {
        schedule.cancelJob(job);
      }, 2250);

      setTimeout(function() {
        assert.strictEqual(runCount, 2);
        done();
      }, 3250);

      clock.tick(3250);
    });

    it('Can cancel Jobs scheduled with Job#schedule', function(done) {

      var runCount = 0;
      var job = new schedule.Job(function() {
        runCount += 1;
      });

      job.schedule({
        freq: RRule.SECONDLY,
      });

      setTimeout(function() {
        schedule.cancelJob(job);
      }, 2250);

      setTimeout(function() {
        assert.strictEqual(runCount, 2);
        done();
      }, 3250);

      clock.tick(3250);
    });

    it("Job emits 'canceled' event", function(done) {

      var job = schedule.scheduleJob(
        {
          freq: RRule.SECONDLY,
        },
        function() {}
      );

      var canceledCount = 0;

      job.on('canceled', function() {
        canceledCount += 1;
      });

      setTimeout(function() {
        schedule.cancelJob(job);
        assert.strictEqual(canceledCount, 1);
        done();
      }, 1250);

      clock.tick(1250);
    });
  });

  describe('.cancelJob("job name")', function() {
    it('Prevents all future invocations of Job identified by name', function(done) {

      var runCount = 0;
      var job = schedule.scheduleJob(
        {
          freq: RRule.SECONDLY,
        },
        function() {
          runCount += 1;
        }
      );

      setTimeout(function() {
        schedule.cancelJob(job.name);
      }, 2250);

      setTimeout(function() {
        assert.strictEqual(runCount, 2);
        done();
      }, 3250);

      clock.tick(3250);
    });

    it("Job emits 'canceled' event", function(done) {

      var job = schedule.scheduleJob(
        {
          freq: RRule.SECONDLY,
        },
        function() {}
      );

      var canceledCount = 0;

      job.on('canceled', function() {
        canceledCount += 1;
      });

      setTimeout(function() {
        schedule.cancelJob(job.name);
        assert.strictEqual(canceledCount, 1);
        done();
      }, 1250);

      clock.tick(1250);
    });

    it('Does nothing if no job found by that name', function(done) {

      var runCount = 0;
      var job = schedule.scheduleJob(
        {
          freq: RRule.SECONDLY,
        },
        function() {
          runCount += 1;
        }
      );

      setTimeout(function() {
        // This cancel should not affect anything
        schedule.cancelJob('blah');
      }, 2250);

      setTimeout(function() {
        job.cancel(); // prevent tests from hanging
        assert.strictEqual(runCount, 3);
        done();
      }, 3250);

      clock.tick(3250);
    });
  });

  describe('.pendingInvocations()', function() {
    it('Retrieves pendingInvocations of the job', function(done) {
      var job = schedule.scheduleJob(new Date(Date.now() + 1000), function() {});

      assert.ok(job instanceof schedule.Job);
      assert.ok(job.pendingInvocations[0].job);

      job.cancel();
      done();
    });
  });
});
