const assert = require('assert');
const _ = require('underscore');
const _s = require('underscore.string');

// Load the almost_every utility
require('../../bin/utils/almost_every');

describe('RFP Scraper Validation', function() {
  const EMAIL_REGEX = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  const URL_REGEX = /^(ht|f)tps?:\/\/[a-z0-9-\.]+\.[a-z]{2,4}\/?([^\s<>\#%"\,\{\}\\|\\\^\[\]`]+)?$/;

  describe('Email validation', function() {
    it('should accept valid email addresses', function() {
      const validEmails = [
        'test@example.com',
        'user.name@example.co.uk',
        'first.last@subdomain.example.com',
        'email123@test-domain.org'
      ];

      validEmails.forEach(email => {
        assert(email.match(EMAIL_REGEX), `${email} should be valid`);
      });
    });

    it('should reject invalid email addresses', function() {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user space@example.com',
        'user@.com'
      ];

      invalidEmails.forEach(email => {
        assert(!email.match(EMAIL_REGEX), `${email} should be invalid`);
      });
    });

    it('should accept blank/empty email addresses', function() {
      const blankEmails = ['', null, undefined];
      
      blankEmails.forEach(email => {
        const result = !email || _s.trim(email).match(EMAIL_REGEX);
        assert(result, 'Blank emails should be acceptable');
      });
    });
  });

  describe('URL validation', function() {
    it('should accept valid URLs', function() {
      const validUrls = [
        'http://example.com',
        'https://example.com',
        'https://subdomain.example.com/path/to/file.pdf',
        'ftp://files.example.com/document.zip',
        'https://example.com/file?param=value',
        'http://example.co.uk'
      ];

      validUrls.forEach(url => {
        assert(url.match(URL_REGEX), `${url} should be valid`);
      });
    });

    it('should reject invalid URLs', function() {
      const invalidUrls = [
        'not a url',
        'example.com',
        'www.example.com',
        'javascript:alert("xss")'
      ];

      invalidUrls.forEach(url => {
        assert(!url.match(URL_REGEX), `${url} should be invalid`);
      });
    });
  });

  describe('RFP data structure validation', function() {
    it('should validate that all items have an id', function() {
      const rfps = [
        { id: '1', title: 'RFP 1' },
        { id: '2', title: 'RFP 2' },
        { id: '3', title: 'RFP 3' }
      ];

      const result = _.every(rfps, (item) => item.id);
      assert.strictEqual(result, true);
    });

    it('should fail validation when items are missing id', function() {
      const rfps = [
        { id: '1', title: 'RFP 1' },
        { title: 'RFP 2' },
        { id: '3', title: 'RFP 3' }
      ];

      const result = _.every(rfps, (item) => item.id);
      assert.strictEqual(result, false);
    });

    it('should validate that all items have a title', function() {
      const rfps = [
        { id: '1', title: 'RFP 1' },
        { id: '2', title: 'RFP 2' },
        { id: '3', title: 'RFP 3' }
      ];

      const result = _.every(rfps, (item) => item.title);
      assert.strictEqual(result, true);
    });

    it('should validate that all ids are unique', function() {
      const rfps = [
        { id: '1', title: 'RFP 1' },
        { id: '2', title: 'RFP 2' },
        { id: '3', title: 'RFP 3' }
      ];

      const pluckedIds = _.pluck(rfps, 'id');
      const uniqIds = _.uniq(pluckedIds);
      const result = pluckedIds.length === uniqIds.length;
      assert.strictEqual(result, true);
    });

    it('should fail validation when ids are not unique', function() {
      const rfps = [
        { id: '1', title: 'RFP 1' },
        { id: '2', title: 'RFP 2' },
        { id: '1', title: 'RFP 3' } // duplicate id
      ];

      const pluckedIds = _.pluck(rfps, 'id');
      const uniqIds = _.uniq(pluckedIds);
      const result = pluckedIds.length === uniqIds.length;
      assert.strictEqual(result, false);
    });

    it('should validate NIGP codes are digits', function() {
      const rfps = [
        { id: '1', nigp_codes: ['123', '456', '789'] },
        { id: '2', nigp_codes: ['001', '002'] },
        { id: '3', nigp_codes: [] }
      ];

      const result = _.every(rfps, (item) => {
        if (_.isEmpty(item.nigp_codes)) return true;
        return _.every(item.nigp_codes, (x) => x.match(/^[0-9]+$/));
      });
      assert.strictEqual(result, true);
    });

    it('should fail validation when NIGP codes contain non-digits', function() {
      const rfps = [
        { id: '1', nigp_codes: ['123', '456', '789'] },
        { id: '2', nigp_codes: ['ABC', '002'] }, // invalid code
        { id: '3', nigp_codes: [] }
      ];

      const result = _.every(rfps, (item) => {
        if (_.isEmpty(item.nigp_codes)) return true;
        return _.every(item.nigp_codes, (x) => x.match(/^[0-9]+$/));
      });
      assert.strictEqual(result, false);
    });

    it('should validate download URLs', function() {
      const rfps = [
        { id: '1', downloads: ['http://example.com/file1.pdf', 'http://example.com/file2.pdf'] },
        { id: '2', downloads: ['https://example.com/doc.docx'] },
        { id: '3', downloads: [] }
      ];

      const result = _.almostEvery(rfps, (item) => {
        if (_.isEmpty(item.downloads)) return true;
        return _.every(item.downloads, (x) => x.match(URL_REGEX));
      });
      assert.strictEqual(result, true);
    });

    it('should validate contact emails', function() {
      const rfps = [
        { id: '1', contact_email: 'contact1@example.com' },
        { id: '2', contact_email: 'contact2@test.org' },
        { id: '3', contact_email: '' }
      ];

      const result = _.almostEvery(rfps, (item) => {
        if (!item.contact_email) return true;
        return _s.trim(item.contact_email).match(EMAIL_REGEX);
      });
      assert.strictEqual(result, true);
    });
  });

  describe('RFP schema compliance', function() {
    it('should accept a complete RFP object', function() {
      const rfp = {
        id: 'GA-12345',
        html_url: 'http://ssl.doas.state.ga.us/PRSapp/PublicBidDetail?bso=12345',
        title: 'Test RFP for Services',
        department_name: 'Department of Technology',
        contact_name: 'John Doe',
        contact_phone: '555-1234',
        contact_email: 'john.doe@example.com',
        created_at: '2024-01-15',
        updated_at: '2024-01-20',
        responses_due_at: '2024-02-15',
        description: 'This is a test RFP for technology services.',
        prebid_conferences: [],
        downloads: ['http://example.com/rfp-document.pdf'],
        nigp_codes: ['123', '456']
      };

      assert(rfp.id, 'RFP should have an id');
      assert(rfp.title, 'RFP should have a title');
      assert(rfp.html_url.match(URL_REGEX), 'html_url should be valid');
      assert(rfp.contact_email.match(EMAIL_REGEX), 'contact_email should be valid');
      assert(Array.isArray(rfp.downloads), 'downloads should be an array');
      assert(Array.isArray(rfp.nigp_codes), 'nigp_codes should be an array');
    });

    it('should accept minimal RFP object with only required fields', function() {
      const rfp = {
        id: 'GA-12345',
        title: 'Minimal Test RFP'
      };

      assert(rfp.id, 'RFP should have an id');
      assert(rfp.title, 'RFP should have a title');
    });

    it('should validate prebid_conferences structure', function() {
      const rfp = {
        id: 'GA-12345',
        title: 'Test RFP',
        prebid_conferences: [
          {
            attendance_mandatory: true,
            datetime: '2024-02-01 10:00 AM',
            address: '123 Main St\nAtlanta, GA 30303'
          }
        ]
      };

      assert(Array.isArray(rfp.prebid_conferences), 'prebid_conferences should be an array');
      assert(rfp.prebid_conferences.length > 0, 'prebid_conferences should have items');
      assert(typeof rfp.prebid_conferences[0].attendance_mandatory === 'boolean', 
        'attendance_mandatory should be boolean');
    });
  });
});
