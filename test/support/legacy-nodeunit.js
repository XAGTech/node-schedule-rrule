'use strict';

var assert = require('chai').assert;

function runHook(hook, done) {
  var finished = false;

  function finish(err) {
    if (finished) {
      return;
    }

    finished = true;
    done(err);
  }

  try {
    if (hook.length > 0) {
      hook(finish);
      return;
    }

    var result = hook();

    if (result && typeof result.then === 'function') {
      result.then(
        function() {
          finish();
        },
        finish
      );
      return;
    }

    finish();
  } catch (err) {
    finish(err);
  }
}

function runHooks(hooks, done) {
  var index = 0;

  function next(err) {
    if (err || index === hooks.length) {
      done(err);
      return;
    }

    var hook = hooks[index];
    index += 1;
    runHook(hook, next);
  }

  next();
}

function createLegacyAssert(done) {
  var assertionCount = 0;
  var expectedAssertions = null;
  var finished = false;

  function finish(err) {
    if (finished) {
      return;
    }

    finished = true;

    if (!err && expectedAssertions !== null && assertionCount !== expectedAssertions) {
      err = new Error(
        'Expected ' + expectedAssertions + ' assertions, but ' + assertionCount + ' were run'
      );
    }

    done(err);
  }

  function wrapAssertion(fn) {
    return function() {
      if (finished) {
        return;
      }

      assertionCount += 1;

      try {
        fn.apply(null, arguments);
      } catch (err) {
        finish(err);
      }
    };
  }

  return {
    done: finish,
    expect: function(count) {
      expectedAssertions = count;
    },
    ok: wrapAssertion(function(value, message) {
      assert.ok(value, message);
    }),
    equal: wrapAssertion(function(actual, expected, message) {
      assert.equal(actual, expected, message);
    }),
    strictEqual: wrapAssertion(function(actual, expected, message) {
      assert.strictEqual(actual, expected, message);
    }),
    notEqual: wrapAssertion(function(actual, expected, message) {
      assert.notEqual(actual, expected, message);
    }),
    deepEqual: wrapAssertion(function(actual, expected, message) {
      assert.deepEqual(actual, expected, message);
    }),
  };
}

function registerLegacyNode(node, hooks) {
  var localHooks = {
    setUp: hooks.setUp.slice(),
    tearDown: hooks.tearDown.slice(),
  };

  if (typeof node.setUp === 'function') {
    localHooks.setUp.push(node.setUp);
  }

  if (typeof node.tearDown === 'function') {
    localHooks.tearDown.push(node.tearDown);
  }

  Object.keys(node).forEach(function(name) {
    if (name === 'setUp' || name === 'tearDown') {
      return;
    }

    var value = node[name];

    if (typeof value === 'function') {
      it(name, function(mochaDone) {
        runHooks(localHooks.setUp, function(setUpErr) {
          if (setUpErr) {
            mochaDone(setUpErr);
            return;
          }

          var completed = false;

          function complete(testErr) {
            if (completed) {
              return;
            }

            completed = true;

            runHooks(localHooks.tearDown.slice().reverse(), function(tearDownErr) {
              mochaDone(testErr || tearDownErr);
            });
          }

          var legacyAssert = createLegacyAssert(complete);

          try {
            value(legacyAssert);
          } catch (err) {
            complete(err);
          }
        });
      });

      return;
    }

    describe(name, function() {
      registerLegacyNode(value, localHooks);
    });
  });
}

function registerLegacySuite(title, suite) {
  describe(title, function() {
    registerLegacyNode(suite, {
      setUp: [],
      tearDown: [],
    });
  });
}

module.exports = {
  registerLegacySuite: registerLegacySuite,
};
