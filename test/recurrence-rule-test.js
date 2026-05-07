'use strict';

var main = require('../package.json').main;
var schedule = require('../' + main);
var sinon = require('sinon');
const {RRule} = require('rrule');
var clock;

// 12:30:15 pm Thursday 29 April 2010 in the timezone this code is being run in
var base = new Date(Date.UTC(2010, 3, 29, 12, 30, 15, 0));
var baseMs = base.getTime();

const RR_EVERY_SECOND = 'DTSTART:19700101T000000\nRRULE:FREQ=SECONDLY;WKST=MO';
const RR_EVERY_MINUTE = 'DTSTART:19700101T000000\nRRULE:FREQ=MINUTELY;WKST=MO';
const RR_UNTIL_1960 = 'DTSTART:19600803T190600\nRRULE:FREQ=SECONDLY;UNTIL=19600803T190700;WKST=MO';

var assert = require('chai').assert;

describe("recurrence-rule-test", function() {
  beforeEach(function(cb) {
    clock = sinon.useFakeTimers(baseMs);
    cb();
  });

  afterEach(function(cb) {
    clock.restore();
    cb();
  });

  describe('#nextInvocationDate(Date)', function() {
    it('next second', function(done) {
      let rule = new schedule.RecurrenceRule({
        freq: RRule.SECONDLY,
      });
      let next = rule.nextInvocationDate(base);

      assert.deepEqual(new Date(Date.UTC(2010, 3, 29, 12, 30, 16, 0)), next);
      done();
    });

    it('dtstart is included when inclusive is true', function(done) {
      let rule = new schedule.RecurrenceRule({
        freq: RRule.MINUTELY,
        dtstart: new Date(Date.UTC(2010, 3, 29, 12, 30, 15, 0)),
      });
      let next = rule.nextInvocationDate(base, true);

      assert.deepEqual(new Date(Date.UTC(2010, 3, 29, 12, 30, 15, 0)), next);
      done();
    });

    it('past dtstart keeps simple interval cadence when reset', function(done) {
      let rule = new schedule.RecurrenceRule({
        freq: RRule.SECONDLY,
        interval: 30,
        dtstart: new Date(Date.UTC(2010, 3, 29, 12, 30, 0, 0)),
      });

      rule.safelyResetStartDate();
      let next = rule.nextInvocationDate(base);

      assert.deepEqual(new Date(Date.UTC(2010, 3, 29, 12, 30, 30, 0)), next);
      done();
    });

    it('next 25th second', function(done) {
      let rule = new schedule.RecurrenceRule({
        freq: RRule.MINUTELY,
        bysecond: 25,
      });
      let next = rule.nextInvocationDate(base);

      assert.deepEqual(new Date(Date.UTC(2010, 3, 29, 12, 30, 25, 0)), next);
      done();
    });

    it('next 5th second (minutes incremented)', function(done) {
      let rule = new schedule.RecurrenceRule({
        freq: RRule.MINUTELY,
        bysecond: 5,
      });
      let next = rule.nextInvocationDate(base);

      assert.deepEqual(new Date(Date.UTC(2010, 3, 29, 12, 31, 5, 0)), next);
      done();
    });

    it('next 40th minute', function(done) {
      let rule = new schedule.RecurrenceRule({
        freq: RRule.HOURLY,
        bysecond: 0,
        byminute: 40,
      });

      let next = rule.nextInvocationDate(base);

      assert.deepEqual(new Date(Date.UTC(2010, 3, 29, 12, 40, 0, 0)), next);
      done();
    });

    it('next 1st minute (hours incremented)', function(done) {
      let rule = new schedule.RecurrenceRule({
        freq: RRule.HOURLY,
        bysecond: 0,
        byminute: 1,
      });

      let next = rule.nextInvocationDate(base);

      assert.deepEqual(new Date(Date.UTC(2010, 3, 29, 13, 1, 0, 0)), next);
      done();
    });

    it('next 23rd hour', function(done) {
      let rule = new schedule.RecurrenceRule({
        freq: RRule.DAILY,
        bysecond: 0,
        byminute: 0,
        byhour: 23,
      });

      let next = rule.nextInvocationDate(base);

      assert.deepEqual(new Date(Date.UTC(2010, 3, 29, 23, 0, 0, 0)), next);
      done();
    });

    it('next 3rd hour (days incremented)', function(done) {
      let rule = new schedule.RecurrenceRule({
        freq: RRule.DAILY,
        bysecond: 0,
        byminute: 0,
        byhour: 3,
      });

      let next = rule.nextInvocationDate(base);

      assert.deepEqual(new Date(Date.UTC(2010, 3, 30, 3, 0, 0, 0)), next);
      done();
    });

    it('next Friday', function(done) {
      let rule = new schedule.RecurrenceRule({
        freq: RRule.WEEKLY,
        bysecond: 0,
        byminute: 0,
        byhour: 0,
        byweekday: RRule.FR,
      });

      let next = rule.nextInvocationDate(base);

      assert.deepEqual(new Date(Date.UTC(2010, 3, 30, 0, 0, 0, 0)), next);
      done();
    });

    it('next Monday (months incremented)', function(done) {
      let rule = new schedule.RecurrenceRule({
        freq: RRule.WEEKLY,
        bysecond: 0,
        byminute: 0,
        byhour: 0,
        byweekday: RRule.MO,
      });

      let next = rule.nextInvocationDate(base);

      assert.deepEqual(new Date(Date.UTC(2010, 4, 3, 0, 0, 0, 0)), next);
      done();
    });

    it('next 30th date', function(done) {
      let rule = new schedule.RecurrenceRule({
        freq: RRule.MONTHLY,
        bysecond: 0,
        byminute: 0,
        byhour: 0,
        bymonthday: 30,
      });

      let next = rule.nextInvocationDate(base);

      assert.deepEqual(new Date(Date.UTC(2010, 3, 30, 0, 0, 0, 0)), next);
      done();
    });

    it('next 5th date (months incremented)', function(done) {
      let rule = new schedule.RecurrenceRule({
        freq: RRule.MONTHLY,
        bysecond: 0,
        byminute: 0,
        byhour: 0,
        bymonthday: 5,
      });

      let next = rule.nextInvocationDate(base);

      assert.deepEqual(new Date(Date.UTC(2010, 4, 5, 0, 0, 0, 0)), next);
      done();
    });

    it('next October', function(done) {
      let rule = new schedule.RecurrenceRule({
        freq: RRule.YEARLY,
        bysecond: 0,
        byminute: 0,
        byhour: 0,
        bymonthday: 1,
        bymonth: 10,
      });

      let next = rule.nextInvocationDate(base);

      assert.deepEqual(new Date(Date.UTC(2010, 9, 1, 0, 0, 0, 0)), next);
      done();
    });

    it('next February (years incremented)', function(done) {
      let rule = new schedule.RecurrenceRule({
        freq: RRule.YEARLY,
        bysecond: 0,
        byminute: 0,
        byhour: 0,
        bymonthday: 1,
        bymonth: 2,
      });

      let next = rule.nextInvocationDate(base);

      assert.deepEqual(new Date(Date.UTC(2011, 1, 1, 0, 0, 0, 0)), next);
      done();
    });

    it('using mixed time components', function(done) {
      let rule = new schedule.RecurrenceRule({
        freq: RRule.DAILY,
        bysecond: 50,
        byminute: 5,
        byhour: 10,
      });

      let next = rule.nextInvocationDate(base);

      assert.deepEqual(new Date(Date.UTC(2010, 3, 30, 10, 5, 50, 0)), next);
      done();
    });

    it('returns null when no invocations left', function(done) {
      let rule = new schedule.RecurrenceRule({
        freq: RRule.DAILY,
        bysecond: 50,
        byminute: 5,
        byhour: 10,
        until: new Date(Date.UTC(2000, 3, 30, 10, 5, 50, 0)),
      });

      let next = rule.nextInvocationDate(base);

      assert.strictEqual(null, next);
      done();
    });

    it('specify span of components using Range', function(done) {
      let rule = new schedule.RecurrenceRule({
        freq: RRule.HOURLY,
        bysecond: 0,
        byminute: [4, 5, 6],
      });

      let next;

      next = rule.nextInvocationDate(base);
      assert.deepEqual(new Date(Date.UTC(2010, 3, 29, 13, 4, 0, 0)), next);

      next = rule.nextInvocationDate(next);
      assert.deepEqual(new Date(Date.UTC(2010, 3, 29, 13, 5, 0, 0)), next);

      next = rule.nextInvocationDate(next);
      assert.deepEqual(new Date(Date.UTC(2010, 3, 29, 13, 6, 0, 0)), next);

      next = rule.nextInvocationDate(next);
      assert.deepEqual(new Date(Date.UTC(2010, 3, 29, 14, 4, 0, 0)), next);

      done();
    });

    it('specify intervals within span of components using Range with step', function(done) {
      let rule = new schedule.RecurrenceRule({
        freq: RRule.HOURLY,
        bysecond: 0,
        byminute: [4, 6, 8],
      });

      let next;

      next = rule.nextInvocationDate(base);
      assert.deepEqual(new Date(Date.UTC(2010, 3, 29, 13, 4, 0, 0)), next);

      next = rule.nextInvocationDate(next);
      assert.deepEqual(new Date(Date.UTC(2010, 3, 29, 13, 6, 0, 0)), next);

      next = rule.nextInvocationDate(next);
      assert.deepEqual(new Date(Date.UTC(2010, 3, 29, 13, 8, 0, 0)), next);

      next = rule.nextInvocationDate(next);
      assert.deepEqual(new Date(Date.UTC(2010, 3, 29, 14, 4, 0, 0)), next);

      done();
    });

    it('specify span and explicit components using Array of Ranges and Numbers', function(done) {
      let rule = new schedule.RecurrenceRule({
        freq: RRule.HOURLY,
        bysecond: 0,
        byminute: [2, 4, 5, 6],
      });

      let next;

      next = rule.nextInvocationDate(base);
      assert.deepEqual(new Date(Date.UTC(2010, 3, 29, 13, 2, 0, 0)), next);

      next = rule.nextInvocationDate(next);
      assert.deepEqual(new Date(Date.UTC(2010, 3, 29, 13, 4, 0, 0)), next);

      next = rule.nextInvocationDate(next);
      assert.deepEqual(new Date(Date.UTC(2010, 3, 29, 13, 5, 0, 0)), next);

      next = rule.nextInvocationDate(next);
      assert.deepEqual(new Date(Date.UTC(2010, 3, 29, 13, 6, 0, 0)), next);

      next = rule.nextInvocationDate(next);
      assert.deepEqual(new Date(Date.UTC(2010, 3, 29, 14, 2, 0, 0)), next);

      done();
    });

    it('From 31th May schedule the 1st of every June', function(done) {
      let rule = new schedule.RecurrenceRule({
        freq: RRule.YEARLY,
        bysecond: 0,
        byminute: 0,
        byhour: 0,
        bymonthday: 1,
        bymonth: 6,
      });

      let next;
      var base1 = new Date(Date.UTC(2010, 4, 31, 12, 30, 15, 0));

      next = rule.nextInvocationDate(base1);
      assert.deepEqual(new Date(Date.UTC(2010, 5, 1, 0, 0, 0, 0)), next);

      next = rule.nextInvocationDate(next);
      assert.deepEqual(new Date(Date.UTC(2011, 5, 1, 0, 0, 0, 0)), next);

      done();
    });

    it('With the year set should not loop indefinetely', function(done) {
      let rule = new schedule.RecurrenceRule({
        freq: RRule.YEARLY,
        bysecond: 0,
        byminute: 0,
        byhour: 0,
        bymonthday: 1,
        bymonth: 6,
        until: new Date(Date.UTC(2011, 0, 1, 0, 0, 0, 0)),
      });

      let next;
      var base1 = new Date(Date.UTC(2010, 4, 31, 12, 30, 15, 0));

      next = rule.nextInvocationDate(base1);
      assert.deepEqual(new Date(Date.UTC(2010, 5, 1, 0, 0, 0, 0)), next);

      next = rule.nextInvocationDate(next);
      assert.equal(next, null);

      done();
    });

    it('nextInvocationDate on an invalid month should return null', function(done) {
      let rule = new schedule.RecurrenceRule({
        freq: RRule.YEARLY,
        bysecond: 0,
        byminute: 0,
        byhour: 0,
        bymonthday: 1,
        bymonth: 13,
      });
      let next = rule.nextInvocationDate();
      assert.equal(next, null);

      let rule2 = new schedule.RecurrenceRule({
        freq: RRule.YEARLY,
        bysecond: 0,
        byminute: 0,
        byhour: 0,
        bymonthday: 1,
        bymonth: 'asdfasdf',
      });
      const next2 = rule2.nextInvocationDate(next);
      assert.equal(next2, null);

      done();
    });

    it('nextInvocationDate on an invalid second should return null', function(done) {
      let rule = new schedule.RecurrenceRule();
      rule.second = 60;
      let next = rule.nextInvocationDate();
      assert.equal(next, null);

      let rule2 = new schedule.RecurrenceRule();
      rule2.second = 'asdfasdf';
      const next2 = rule2.nextInvocationDate();
      assert.equal(next2, null);

      done();
    });

    it('nextInvocationDate on an invalid hour should return null', function(done) {
      let rule = new schedule.RecurrenceRule();
      rule.hour = 24;
      let next = rule.nextInvocationDate();
      assert.equal(next, null);

      let rule2 = new schedule.RecurrenceRule();
      rule2.hour = 'asdfasdf';
      const next2 = rule2.nextInvocationDate();
      assert.equal(next2, null);

      done();
    });

    it('nextInvocationDate on an invalid date should return null', function(done) {
      let rule = new schedule.RecurrenceRule();
      rule.date = 90;
      let next = rule.nextInvocationDate();
      assert.equal(next, null);

      // Test February
      let rule2 = new schedule.RecurrenceRule();
      rule2.month = 1;
      rule2.date = 30;
      const next2 = rule2.nextInvocationDate();
      assert.equal(next2, null);

      let rule3 = new schedule.RecurrenceRule();
      rule3.date = 'asdfasdf';
      const next3 = rule3.nextInvocationDate();
      assert.equal(next3, null);

      done();
    });

    it('nextInvocationDate on an invalid dayOfWeek should return null', function(done) {
      let rule = new schedule.RecurrenceRule();
      rule.dayOfWeek = 90;
      let next = rule.nextInvocationDate();
      assert.equal(next, null);

      let rule2 = new schedule.RecurrenceRule();
      rule2.dayOfWeek = 'asdfasdf';
      const next2 = rule.nextInvocationDate();
      assert.equal(next2, null);

      done();
    });
  });
});
