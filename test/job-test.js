'use strict';

var sinon = require('sinon');
var main = require('../package.json').main;
var schedule = require('../' + main);

const {RRule} = require('rrule');
const RR_EVERY_SECOND = 'DTSTART:19700101T000000\nRRULE:FREQ=SECONDLY;WKST=MO';
const RR_EVERY_OTHER_SECOND = 'DTSTART:19700101T000000\nRRULE:FREQ=SECONDLY;WKST=MO;INTERVAL=2';
const RR_EVERY_MINUTE = 'DTSTART:19700101T000000\nRRULE:FREQ=MINUTELY;WKST=MO';
const RR_UNTIL_1960 = 'DTSTART:19600803T190600\nRRULE:FREQ=SECONDLY;UNTIL=19600803T190700;WKST=MO';

var es6;
try {
  eval('(function* () {})()');
  es6 = require('./es6/job-test')(schedule);
} catch (e) {}

var clock;

var assert = require('chai').assert;

describe("job-test", function() {
  beforeEach(function(cb) {
    clock = sinon.useFakeTimers();
    cb();
  });

  afterEach(function(cb) {
    clock.restore();
    cb();
  });

  describe('Job constructor', function() {
    it('Accepts Job name and function to run', function(done) {
      var job = new schedule.Job('the job', function() {});

      assert.equal(job.name, 'the job');
      done();
    });

    it('Job name is optional and will be auto-generated', function(done) {
      var job = new schedule.Job(function() {});

      assert.ok(job.name);
      done();
    });

    it('Uses unique names across auto-generated Job names', function(done) {
      var job1 = new schedule.Job(function() {});
      var job2 = new schedule.Job(function() {});

      assert.notEqual(job1.name, job2.name);
      done();
    });
  });

  describe('#schedule(Date)', function() {
    it('Runs job once at some date', function(done) {
      var runCount = 0;
      var job = new schedule.Job(function() {
        runCount += 1;
      });

      job.schedule(new Date(Date.now() + 3000));

      setTimeout(function() {
        assert.strictEqual(runCount, 1);
        done();
      }, 3250);

      clock.tick(3250);
    });

    it('Cancel next job before it runs', function(done) {
      var runCount = 0;
      var job = new schedule.Job(function() {
        runCount += 1;
      });

      job.schedule(RR_EVERY_OTHER_SECOND);

      setTimeout(function() {
        job.cancel();
        assert.strictEqual(runCount, 2);
        done();
      }, 3250);

      clock.tick(3250);
    });

    it('Run job on specified date', function(done) {
      var runCount = 0;
      var job = new schedule.Job(function() {
        runCount += 1;
      });

      job.schedule(new Date(Date.now() + 3000));

      setTimeout(function() {
        assert.strictEqual(runCount, 1);
        done();
      }, 3250);

      clock.tick(3250);
    });

    it("Won't run job if scheduled in the past", function(done) {
      var job = new schedule.Job(function() {
        assert.fail('Job should not run when scheduled in the past');
      });

      job.schedule(new Date(Date.now() - 3000));

      setTimeout(function() {
        done();
      }, 1000);

      clock.tick(1000);
    });

    it('Jobs still run after scheduling a Job in the past', function(done) {
      var runCount = 0;
      var pastJob = new schedule.Job(function() {
        assert.fail('Past-scheduled job should not run');
      });

      pastJob.schedule(new Date(Date.now() - 3000));

      var job = new schedule.Job(function() {
        runCount += 1;
      });

      job.schedule(new Date(Date.now() + 3000));

      setTimeout(function() {
        assert.strictEqual(runCount, 1);
        done();
      }, 3250);

      clock.tick(3250);
    });

    it("Job emits 'scheduled' event with 'run at' Date", function(done) {

      var date = new Date(Date.now() + 3000);
      var job = new schedule.Job(function() {
        done();
      });

      job.on('scheduled', function(runAtDate) {
        assert.equal(runAtDate.getTime(), date.getTime());
      });

      job.schedule(date);
      clock.tick(3250);
    });
  });

  describe('#schedule(RecurrenceRule)', function() {
    it('Runs job at interval based on recur rule, repeating indefinitely', function(done) {
      var runCount = 0;
      var job = new schedule.Job(function() {
        runCount += 1;
      });

      job.schedule(RR_EVERY_SECOND);

      setTimeout(function() {
        job.cancel();
        assert.strictEqual(runCount, 4);
        done();
      }, 3250);

      clock.tick(3250);
    });

    it("Job emits 'scheduled' event for every next invocation", function(done) {
      // The explicit DTSTART matches the fake clock start, so the job runs at t=0.
      // Job will run 4 times but be scheduled 5 times, 5th run never happens
      // due to cancel.

      var scheduledCount = 0;
      var job = new schedule.Job(function() {});

      job.on('scheduled', function() {
        scheduledCount += 1;
      });

      job.schedule(RR_EVERY_SECOND);

      setTimeout(function() {
        job.cancel();
        assert.strictEqual(scheduledCount, 5);
        done();
      }, 3250);

      clock.tick(3250);
    });

    it("Doesn't invoke job if recur rule schedules it in the past", function(done) {

      var job = new schedule.Job(function() {
        assert.fail('Recurring rule scheduled entirely in the past should not run');
      });

      job.schedule(RR_UNTIL_1960);

      setTimeout(function() {
        job.cancel();
        done();
      }, 1000);

      clock.tick(1000);
    });
  });

  describe('#schedule({...})', function() {
    it('Runs job at interval based on object, repeating indefinitely', function(done) {
      var runCount = 0;
      var job = new schedule.Job(function() {
        runCount += 1;
      });

      job.schedule({
        freq: RRule.SECONDLY,
      });

      setTimeout(function() {
        job.cancel();
        assert.strictEqual(runCount, 3);
        done();
      }, 3250);

      clock.tick(3250);
    });

    it("Job emits 'scheduled' event for every next invocation", function(done) {
      // Job will run 3 times but be scheduled 4 times, 4th run never happens
      // due to cancel.

      var scheduledCount = 0;
      var job = new schedule.Job(function() {});

      job.on('scheduled', function() {
        scheduledCount += 1;
      });

      job.schedule({
        freq: RRule.SECONDLY,
      });

      setTimeout(function() {
        job.cancel();
        assert.strictEqual(scheduledCount, 4);
        done();
      }, 3250);

      clock.tick(3250);
    });

    it("Doesn't invoke job if object schedules it in the past", function(done) {

      var job = new schedule.Job(function() {
        assert.fail('Object schedule in the past should not run');
      });

      job.schedule(new Date('1960-01-01'));

      setTimeout(function() {
        job.cancel();
        done();
      }, 1000);

      clock.tick(1000);
    });
  });

  describe("#schedule('jobName', {...})", function() {
    it('Runs job with a custom name input', function(done) {
      var runCount = 0;
      var job = new schedule.Job('jobName', function() {
        runCount += 1;
        assert.equal(job.name, 'jobName');
      });

      job.schedule({
        freq: RRule.SECONDLY,
      });

      setTimeout(function() {
        job.cancel();
        assert.strictEqual(runCount, 3);
        done();
      }, 3250);

      clock.tick(3250);
    });
  });

  describe('#cancel', function() {
    it('Prevents all future invocations', function(done) {
      var runCount = 0;
      var job = new schedule.Job(function() {
        runCount += 1;
      });

      job.schedule({
        freq: RRule.SECONDLY,
      });

      setTimeout(function() {
        job.cancel();
      }, 1250);

      setTimeout(function() {
        assert.strictEqual(runCount, 1);
        done();
      }, 2250);

      clock.tick(2250);
    });

    it('Cancelled job reschedules', function(done) {
      /*
        1. occurrence at DTSTART (t=0)
        2. next occurrence before cancellation (t=1)
        3. cancel(true) cancels the pending t=2 occurrence and reschedules to t=3

        i.e. after 3.25 seconds we should see 3 occurrences
      */
      var runCount = 0;
      var job = schedule.scheduleJob(RR_EVERY_SECOND, function() {
        runCount += 1;
      });

      setTimeout(function() {
        job.cancel(true);
      }, 1250);

      setTimeout(function() {
        job.cancel();
        assert.strictEqual(runCount, 3);
        done();
      }, 3250);

      clock.tick(3250);
    });

    it('Cancelled job without rescheduling', function(done) {
      var ok = false;

      var job = schedule.scheduleJob(RR_EVERY_SECOND, function() {});

      setTimeout(function() {
        job.cancel();
        if (job.nextInvocation() === null) ok = true;
      }, 1250);

      setTimeout(function() {
        job.cancel();
        assert.ok(ok);
        done();
      }, 2250);

      clock.tick(2250);
    });

    it("Job emits 'canceled' event", function(done) {

      var canceledCount = 0;
      var job = new schedule.Job(function() {});

      job.on('canceled', function() {
        canceledCount += 1;
      });

      job.schedule({
        freq: RRule.SECONDLY,
      });

      setTimeout(function() {
        job.cancel();
      }, 1250);

      setTimeout(function() {
        assert.strictEqual(canceledCount, 1);
        done();
      }, 2250);

      clock.tick(2250);
    });

    it('Job is added to scheduledJobs when created and removed when cancelled', function(done) {

      var job1 = new schedule.Job('cancelJob', function() {});
      job1.schedule(
        {
          freq: RRule.SECONDLY,
        },
        function() {}
      );

      var job2 = schedule.scheduleJob(
        'second',
        {
          freq: RRule.SECONDLY,
        },
        function() {}
      );

      assert.strictEqual(schedule.scheduledJobs.cancelJob, job1);
      assert.strictEqual(schedule.scheduledJobs.second, job2);
      setTimeout(function() {
        job1.cancel();
        job2.cancel();
        assert.strictEqual(schedule.scheduledJobs.cancelJob, undefined);
        assert.strictEqual(schedule.scheduledJobs.second, undefined);
        done();
      }, 1250);

      clock.tick(1250);
    });
  });

  describe('When invoked', function() {
    it("Job emits 'run' event", function(done) {
      var runEventCount = 0;
      var job = new schedule.Job(function() {});

      job.on('run', function() {
        runEventCount += 1;
      });

      job.schedule(new Date(Date.now() + 3000));

      setTimeout(function() {
        assert.strictEqual(runEventCount, 1);
        done();
      }, 3250);

      clock.tick(3250);
    });

    it('Job gets invoked with the fire date', function(done) {
      var invocationCount = 0;
      var prevFireDate;
      var job = new schedule.Job(function(fireData) {
        invocationCount += 1;
        if (!prevFireDate) {
          assert.ok(fireData.invocationDate instanceof Date);
        } else {
          assert.equal(fireData.invocationDate.getTime() - prevFireDate.getTime(), 1000);
        }
        prevFireDate = fireData.invocationDate;
      });

      job.schedule({
        freq: RRule.SECONDLY,
      });

      setTimeout(function() {
        job.cancel();
        assert.strictEqual(invocationCount, 2);
        done();
      }, 2250);

      clock.tick(2250);
    });
  });
});
