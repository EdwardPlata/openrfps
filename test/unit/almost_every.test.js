const assert = require('assert');
const _ = require('underscore');

// Load the almost_every utility
require('../../bin/utils/almost_every');

describe('almost_every utility', function() {
  describe('_.almostEvery()', function() {
    it('should return true when all items pass the predicate', function() {
      const arr = [2, 4, 6, 8, 10];
      const result = _.almostEvery(arr, (x) => x % 2 === 0);
      assert.strictEqual(result, true);
    });

    it('should return true when more than 95% of items pass the predicate', function() {
      // 19/20 = 95%, which is NOT > 0.95, so need 20/20 or better ratio
      // Using 96/100 to ensure > 95%
      const arr = Array.from({ length: 100 }, (_, i) => i < 96 ? 2 : 1);
      const result = _.almostEvery(arr, (x) => x === 2);
      assert.strictEqual(result, true);
    });

    it('should return false when less than 95% of items pass the predicate', function() {
      const arr = [2, 4, 6, 8, 9, 11, 13, 15, 17, 19];
      const result = _.almostEvery(arr, (x) => x % 2 === 0);
      assert.strictEqual(result, false);
    });

    it('should return true for empty array', function() {
      const arr = [];
      const result = _.almostEvery(arr, (x) => x % 2 === 0);
      assert.strictEqual(result, true);
    });

    it('should work with objects', function() {
      const obj = { a: 2, b: 4, c: 6, d: 8, e: 10 };
      const result = _.almostEvery(obj, (x) => x % 2 === 0);
      assert.strictEqual(result, true);
    });

    it('should work with context parameter', function() {
      const arr = [1, 2, 3, 4, 5];
      const context = { threshold: 3 };
      const result = _.almostEvery(arr, function(x) {
        return x <= this.threshold;
      }, context);
      assert.strictEqual(result, false);
    });

    it('should return false when exactly 95% pass (not > 95%)', function() {
      const arr = Array.from({ length: 20 }, (_, i) => i + 1); // [1, 2, ..., 20]
      // 19 items pass (95%), 1 item fails (5%)
      // Since the implementation uses > 0.95, exactly 95% should return false
      const result = _.almostEvery(arr, (x) => x <= 19);
      assert.strictEqual(result, false);
    });
  });
});
