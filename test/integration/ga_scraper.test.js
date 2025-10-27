const assert = require('assert');
const fs = require('fs');
const path = require('path');
const _ = require('underscore');
const _s = require('underscore.string');

// Register CoffeeScript compiler
require('coffeescript/register');

// Load the almost_every utility
require('../../bin/utils/almost_every');

describe('Georgia RFP Scraper - Application Tests', function() {
  // Increase timeout for network requests
  this.timeout(30000);

  const EMAIL_REGEX = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  const URL_REGEX = /^(ht|f)tps?:\/\/[a-z0-9-\.]+\.[a-z]{2,4}\/?([^\s<>\#%"\,\{\}\\|\\\^\[\]`]+)?$/;

  let scraperModule;
  let rfpResults;

  before(function(done) {
    // Load the Georgia scraper
    try {
      scraperModule = require('../../scrapers/states/ga/rfps.coffee');
    } catch (error) {
      console.error('Failed to load Georgia scraper:', error);
      this.skip();
    }

    // Run the scraper with a limit to get some test data
    const opts = { limit: 5 };
    
    scraperModule(opts, (results) => {
      rfpResults = results;
      done();
    });
  });

  describe('Scraper execution', function() {
    it('should return an array', function() {
      assert(Array.isArray(rfpResults), 'Results should be an array');
    });

    it('should return at least one result or handle empty gracefully', function() {
      // This test is lenient - if the website is down or has no RFPs, 
      // we accept an empty array
      assert(typeof rfpResults === 'object', 'Results should be an object (array)');
      assert(!_.isNull(rfpResults), 'Results should not be null');
    });
  });

  describe('RFP data validation (if results exist)', function() {
    before(function() {
      if (_.isEmpty(rfpResults)) {
        this.skip();
      }
    });

    it('should have id field for all items', function() {
      const hasIds = _.every(rfpResults, (item) => item.id);
      assert.strictEqual(hasIds, true, 'All items should have an id');
    });

    it('should have unique ids for all items', function() {
      const pluckedIds = _.pluck(rfpResults, 'id');
      const uniqIds = _.uniq(pluckedIds);
      assert.strictEqual(
        pluckedIds.length,
        uniqIds.length,
        'All ids should be unique'
      );
    });

    it('should have title field for all items', function() {
      const hasTitles = _.every(rfpResults, (item) => item.title);
      assert.strictEqual(hasTitles, true, 'All items should have a title');
    });

    it('should have valid or blank contact emails', function() {
      const validEmails = _.almostEvery(rfpResults, (item) => {
        if (!item.contact_email) return true;
        return _s.trim(item.contact_email).match(EMAIL_REGEX);
      });
      assert.strictEqual(validEmails, true, 'Contact emails should be valid or blank');
    });

    it('should have valid or empty download URLs', function() {
      const validUrls = _.almostEvery(rfpResults, (item) => {
        if (_.isEmpty(item.downloads)) return true;
        return _.every(item.downloads, (url) => url.match(URL_REGEX));
      });
      assert.strictEqual(validUrls, true, 'Download URLs should be valid or empty');
    });

    it('should have numeric NIGP codes if present', function() {
      const validCodes = _.every(rfpResults, (item) => {
        if (_.isEmpty(item.nigp_codes)) return true;
        if (item.nigp_codes) {
          return _.every(item.nigp_codes, (code) => code.match(/^[0-9]+$/));
        }
        return true;
      });
      assert.strictEqual(validCodes, true, 'NIGP codes should be numeric');
    });

    it('should have html_url field if provided', function() {
      rfpResults.forEach((item) => {
        if (item.html_url) {
          assert(item.html_url.match(URL_REGEX), `html_url should be valid: ${item.html_url}`);
        }
      });
    });

    it('should have properly structured prebid_conferences if present', function() {
      rfpResults.forEach((item) => {
        if (item.prebid_conferences && item.prebid_conferences.length > 0) {
          assert(Array.isArray(item.prebid_conferences), 'prebid_conferences should be an array');
          item.prebid_conferences.forEach((conf) => {
            if (conf.attendance_mandatory !== undefined) {
              assert(
                typeof conf.attendance_mandatory === 'boolean',
                'attendance_mandatory should be boolean'
              );
            }
          });
        }
      });
    });
  });

  describe('Output format verification', function() {
    it('should be serializable to JSON', function() {
      assert.doesNotThrow(() => {
        JSON.stringify(rfpResults);
      }, 'Results should be JSON-serializable');
    });

    it('should produce valid JSON when serialized', function() {
      const jsonString = JSON.stringify(rfpResults);
      assert.doesNotThrow(() => {
        JSON.parse(jsonString);
      }, 'Serialized JSON should be parseable');
    });

    it('should match expected schema structure for non-empty results', function() {
      if (_.isEmpty(rfpResults)) {
        this.skip();
      }

      const firstItem = rfpResults[0];
      
      // Check required fields
      assert(firstItem.id, 'First item should have an id');
      assert(firstItem.title, 'First item should have a title');
      
      // Check optional fields have correct types when present
      if (firstItem.downloads !== undefined) {
        assert(Array.isArray(firstItem.downloads), 'downloads should be an array');
      }
      if (firstItem.nigp_codes !== undefined) {
        assert(Array.isArray(firstItem.nigp_codes), 'nigp_codes should be an array');
      }
      if (firstItem.prebid_conferences !== undefined) {
        assert(Array.isArray(firstItem.prebid_conferences), 'prebid_conferences should be an array');
      }
    });
  });

  describe('Error handling', function() {
    it('should handle invalid options gracefully', function(done) {
      const invalidOpts = { limit: -1 };
      
      scraperModule(invalidOpts, (results) => {
        assert(Array.isArray(results), 'Should return an array even with invalid options');
        done();
      });
    });

    it('should handle zero limit option', function(done) {
      const opts = { limit: 0 };
      
      scraperModule(opts, (results) => {
        assert(Array.isArray(results), 'Should return an array');
        done();
      });
    });
  });
});
