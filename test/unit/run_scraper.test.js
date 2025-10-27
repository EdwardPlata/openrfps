const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Register CoffeeScript compiler
require('coffeescript/register');

describe('run_scraper utility', function() {
  const testScraperPath = 'test/fixtures/test_scraper.coffee';
  const testJsonPath = 'test/fixtures/test_scraper.json';

  // Clean up test files before and after tests
  before(function() {
    // Create fixtures directory if it doesn't exist
    const fixturesDir = 'test/fixtures';
    if (!fs.existsSync(fixturesDir)) {
      fs.mkdirSync(fixturesDir, { recursive: true });
    }

    // Create a test scraper
    const testScraperContent = `
module.exports = (opts, done) ->
  rfps = [
    { id: '1', title: 'Test RFP 1' },
    { id: '2', title: 'Test RFP 2' }
  ]
  
  if opts.limit && opts.limit > 0
    rfps = rfps.slice(0, opts.limit)
  
  done(rfps)
`;
    fs.writeFileSync(testScraperPath, testScraperContent);
  });

  after(function() {
    // Clean up test files
    if (fs.existsSync(testScraperPath)) {
      fs.unlinkSync(testScraperPath);
    }
    if (fs.existsSync(testJsonPath)) {
      fs.unlinkSync(testJsonPath);
    }
  });

  describe('basic functionality', function() {
    it('should require a file argument', function() {
      const runScraper = require('../../bin/utils/run_scraper');
      const program = { args: [] };
      
      // Capture console output
      const originalLog = console.log;
      let logOutput = '';
      console.log = (msg) => { logOutput += msg; };
      
      // This function returns early without calling callback
      const result = runScraper(program, () => {});
      
      console.log = originalLog;
      assert(logOutput.includes('You must provide a <file>'), 'Should display error message');
    });

    it('should run a scraper and return results', function(done) {
      const runScraper = require('../../bin/utils/run_scraper');
      const program = { 
        args: ['test/fixtures/test_scraper.coffee'],
        force: true,
        skipsave: true,
        limit: 0
      };
      
      runScraper(program, (result) => {
        assert(Array.isArray(result));
        assert.strictEqual(result.length, 2);
        assert.strictEqual(result[0].id, '1');
        assert.strictEqual(result[0].title, 'Test RFP 1');
        done();
      });
    });

    it('should respect the limit option', function(done) {
      const runScraper = require('../../bin/utils/run_scraper');
      const program = { 
        args: ['test/fixtures/test_scraper.coffee'],
        force: true,
        skipsave: true,
        limit: 1
      };
      
      runScraper(program, (result) => {
        assert(Array.isArray(result));
        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0].id, '1');
        done();
      });
    });

    it('should cache results to JSON file when not skipping save', function(done) {
      const runScraper = require('../../bin/utils/run_scraper');
      const program = { 
        args: ['test/fixtures/test_scraper.coffee'],
        force: true,
        limit: 0
      };
      
      const testJsonPath = 'test/fixtures/test_scraper.json';
      
      // Clean up any existing JSON file first
      if (fs.existsSync(testJsonPath)) {
        fs.unlinkSync(testJsonPath);
      }
      
      runScraper(program, (result) => {
        assert(Array.isArray(result));
        assert(fs.existsSync(testJsonPath));
        const cachedData = JSON.parse(fs.readFileSync(testJsonPath));
        assert.strictEqual(cachedData.length, 2);
        done();
      });
    });

    it('should use cached results when force is false and cache exists', function(done) {
      const runScraper = require('../../bin/utils/run_scraper');
      
      const testJsonPath = 'test/fixtures/test_scraper.json';
      
      // First, create a cache file with different data
      const cachedData = [{ id: 'cached', title: 'Cached RFP' }];
      fs.writeFileSync(testJsonPath, JSON.stringify(cachedData));
      
      const program = { 
        args: ['test/fixtures/test_scraper.coffee'],
        force: false,
        limit: 0
      };
      
      runScraper(program, (result) => {
        assert(Array.isArray(result));
        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0].id, 'cached');
        assert.strictEqual(result[0].title, 'Cached RFP');
        done();
      });
    });
  });
});
