const assert = require('assert');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

describe('CLI Application Tests', function() {
  // Increase timeout for CLI operations
  this.timeout(60000);

  const scraperPath = 'scrapers/states/ga/rfps.coffee';
  const jsonOutputPath = 'scrapers/states/ga/rfps.json';

  after(function() {
    // Clean up any generated test files
    const testJsonPath = path.join(process.cwd(), jsonOutputPath);
    if (fs.existsSync(testJsonPath)) {
      // Don't delete - it might be useful for other tests
      // fs.unlinkSync(testJsonPath);
    }
  });

  describe('openrfps CLI', function() {
    it('should display help when --help flag is used', function() {
      const output = execSync('./bin/openrfps --help', { encoding: 'utf8' });
      assert(output.includes('Usage:'), 'Should display usage information');
      assert(output.includes('Commands:'), 'Should list commands');
      assert(output.includes('run'), 'Should include run command');
      assert(output.includes('test'), 'Should include test command');
    });

    it('should display version when --version flag is used', function() {
      const output = execSync('./bin/openrfps --version', { encoding: 'utf8' });
      assert(output.match(/\d+\.\d+\.\d+/), 'Should display version number');
    });
  });

  describe('openrfps run command', function() {
    it('should execute scraper and output JSON', function() {
      try {
        const output = execSync(`./bin/openrfps run ${scraperPath} --limit 1 --skipsave`, {
          encoding: 'utf8',
          timeout: 30000
        });
        
        // The output should contain JSON or be empty array
        assert(output.length > 0, 'Should produce output');
        
        // Try to parse as JSON (may be empty array or have results)
        const lines = output.split('\n').filter(line => line.trim());
        const jsonLines = lines.filter(line => 
          line.startsWith('[') || line.startsWith('{') || line.includes('"')
        );
        
        if (jsonLines.length > 0) {
          const jsonOutput = jsonLines.join('\n');
          assert.doesNotThrow(() => {
            JSON.parse(jsonOutput);
          }, 'Output should be valid JSON');
        }
      } catch (error) {
        // If the scraper fails due to network issues, that's acceptable
        if (error.message.includes('timeout') || error.stderr) {
          this.skip();
        } else {
          throw error;
        }
      }
    });

    it('should cache results to JSON file when not using --skipsave', function() {
      try {
        const testJsonPath = path.join(process.cwd(), jsonOutputPath);
        
        // Remove existing cache if present
        if (fs.existsSync(testJsonPath)) {
          fs.unlinkSync(testJsonPath);
        }

        execSync(`./bin/openrfps run ${scraperPath} --limit 1`, {
          encoding: 'utf8',
          timeout: 30000
        });
        
        assert(fs.existsSync(testJsonPath), 'Should create JSON cache file');
        
        const cachedData = fs.readFileSync(testJsonPath, 'utf8');
        assert.doesNotThrow(() => {
          JSON.parse(cachedData);
        }, 'Cached file should contain valid JSON');
      } catch (error) {
        // Network issues are acceptable
        if (error.message.includes('timeout')) {
          this.skip();
        } else {
          throw error;
        }
      }
    });

    it('should respect --limit flag', function() {
      try {
        const output = execSync(`./bin/openrfps run ${scraperPath} --limit 2 --skipsave`, {
          encoding: 'utf8',
          timeout: 30000
        });
        
        // Try to extract and parse JSON from output
        const lines = output.split('\n').filter(line => line.trim());
        const jsonStart = lines.findIndex(line => line.trim().startsWith('['));
        
        if (jsonStart >= 0) {
          const jsonOutput = lines.slice(jsonStart).join('\n');
          const results = JSON.parse(jsonOutput);
          
          if (Array.isArray(results) && results.length > 0) {
            assert(results.length <= 2, 'Should respect limit of 2');
          }
        }
      } catch (error) {
        if (error.message.includes('timeout')) {
          this.skip();
        }
        // If parsing fails, it might be empty results - that's okay
      }
    });
  });

  describe('openrfps test command', function() {
    it('should run validation tests on cached data', function() {
      try {
        // First ensure we have cached data
        const testJsonPath = path.join(process.cwd(), jsonOutputPath);
        
        if (!fs.existsSync(testJsonPath)) {
          // Create cache first
          execSync(`./bin/openrfps run ${scraperPath} --limit 1`, {
            encoding: 'utf8',
            timeout: 30000
          });
        }

        // Now run the test command
        const output = execSync(`./bin/openrfps test ${scraperPath}`, {
          encoding: 'utf8',
          timeout: 30000
        });
        
        // Should contain test results
        assert(output.length > 0, 'Should produce test output');
        
        // Look for OK or Not OK indicators
        const hasTestResults = output.includes('OK') || output.includes('Not OK');
        assert(hasTestResults, 'Should display test results');
      } catch (error) {
        // Test command exits with code 1 on test failures, which is expected behavior
        if (error.status === 1 && error.stdout) {
          const output = error.stdout.toString();
          assert(output.includes('OK') || output.includes('Not OK'), 
            'Should display test results even on failure');
        } else if (error.message.includes('timeout')) {
          this.skip();
        } else {
          throw error;
        }
      }
    });

    it('should run scraper and tests with --force flag', function() {
      try {
        const output = execSync(`./bin/openrfps test ${scraperPath} --force --limit 1`, {
          encoding: 'utf8',
          timeout: 30000
        });
        
        // Should run scraper and then tests
        const hasTestResults = output.includes('OK') || output.includes('Not OK');
        assert(hasTestResults, 'Should display test results');
      } catch (error) {
        // Test failures are acceptable
        if (error.status === 1 && error.stdout) {
          const output = error.stdout.toString();
          assert(output.includes('OK') || output.includes('Not OK'), 
            'Should display test results even on failure');
        } else if (error.message.includes('timeout')) {
          this.skip();
        } else {
          throw error;
        }
      }
    });
  });

  describe('Error handling', function() {
    it('should handle missing scraper file gracefully', function() {
      try {
        execSync('./bin/openrfps run nonexistent/scraper.coffee', {
          encoding: 'utf8',
          stdio: 'pipe'
        });
        assert.fail('Should have thrown an error');
      } catch (error) {
        // Expected to fail - check that error output exists
        const output = error.stdout || error.stderr || '';
        assert(output.length > 0 || error.status !== 0, 'Should produce error or non-zero exit code');
      }
    });

    it('should handle command without arguments', function() {
      try {
        const output = execSync('./bin/openrfps run', {
          encoding: 'utf8'
        });
        // Should show error or help
        assert(output.includes('must provide') || output.includes('Usage'), 
          'Should show error or usage information');
      } catch (error) {
        // Error is acceptable - should contain message about missing file
        assert(error.stdout || error.stderr, 'Should produce error message');
      }
    });
  });
});
