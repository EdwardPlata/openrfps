# Test Documentation

This document describes the test suite for the OpenRFPs project.

## Overview

The test suite consists of three types of tests:

1. **Unit Tests** - Test individual utility functions in isolation
2. **Integration Tests** - Test how components work together
3. **Application Tests** - End-to-end tests that verify the complete workflow

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npx mocha --watch 'test/**/*.test.js'

# Run specific test files
npx mocha test/unit/almost_every.test.js
npx mocha test/integration/scraper_validation.test.js
```

## Test Structure

```
test/
├── unit/                          # Unit tests for individual functions
│   ├── almost_every.test.js      # Tests for the almost_every utility
│   └── run_scraper.test.js       # Tests for the run_scraper utility
└── integration/                   # Integration and application tests
    ├── cli_application.test.js   # End-to-end CLI tests
    ├── ga_scraper.test.js        # Georgia scraper application tests
    └── scraper_validation.test.js # Validation logic tests
```

## Unit Tests

### almost_every.test.js

Tests the `_.almostEvery()` utility function which checks if more than 95% of items in a collection pass a predicate.

**Test Cases:**
- Returns true when all items pass
- Returns true when more than 95% pass
- Returns false when less than 95% pass
- Handles empty arrays correctly
- Works with objects and context parameters

### run_scraper.test.js

Tests the `run_scraper` utility that executes scrapers and manages caching.

**Test Cases:**
- Requires a file argument
- Runs a scraper and returns results
- Respects the limit option
- Caches results to JSON file
- Uses cached results when available

## Integration Tests

### scraper_validation.test.js

Tests the validation logic used to verify RFP data quality.

**Test Cases:**
- Email validation (valid, invalid, blank)
- URL validation (valid, invalid)
- RFP data structure validation:
  - Required fields (id, title)
  - Unique IDs
  - NIGP codes format
  - Download URLs format
  - Contact email format
- Schema compliance for complete and minimal RFP objects
- Prebid conferences structure validation

### ga_scraper.test.js

Application tests for the Georgia RFP scraper.

**Test Cases:**
- Scraper execution returns an array
- Handles empty results gracefully
- Data validation (when results exist):
  - All items have required fields (id, title)
  - IDs are unique
  - Contact emails are valid or blank
  - Download URLs are valid or empty
  - NIGP codes are numeric
  - HTML URLs are valid
  - Prebid conferences have correct structure
- Output format is JSON-serializable
- Error handling for invalid options

**Note:** Some tests are skipped when external dependencies are unavailable (e.g., when the source website is down or returns no data).

### cli_application.test.js

End-to-end tests for the command-line interface.

**Test Cases:**
- CLI help and version display
- `openrfps run` command:
  - Executes scraper and outputs JSON
  - Caches results to JSON file
  - Respects --limit flag
- `openrfps test` command:
  - Runs validation tests on cached data
  - Runs scraper and tests with --force flag
- Error handling:
  - Missing scraper files
  - Missing arguments

## Test Coverage

The test suite covers:

- ✅ Utility functions (`almost_every`, `run_scraper`)
- ✅ Data validation logic
- ✅ Schema compliance
- ✅ CLI commands and options
- ✅ Error handling
- ✅ End-to-end scraper functionality

## Continuous Integration

Tests are designed to be run in CI/CD environments. The exit code will be:
- `0` if all tests pass
- Non-zero if any test fails

## Adding New Tests

When adding new scrapers or features:

1. **Unit tests**: Add to `test/unit/` for any new utility functions
2. **Integration tests**: Add to `test/integration/` for validation logic
3. **Application tests**: Follow the pattern in `ga_scraper.test.js` for new state scrapers

Example test structure:

```javascript
const assert = require('assert');

describe('Feature Name', function() {
  it('should do something specific', function() {
    // Arrange
    const input = 'test';
    
    // Act
    const result = someFunction(input);
    
    // Assert
    assert.strictEqual(result, 'expected');
  });
});
```

## Troubleshooting

### Tests timing out

Some tests interact with external websites. If tests timeout:
- Check your internet connection
- The website may be temporarily unavailable (tests will skip gracefully)
- Increase timeout in the test file: `this.timeout(60000);`

### Path issues

Tests run from the project root directory. Use relative paths like:
- `scrapers/states/ga/rfps.coffee`
- `test/fixtures/test_scraper.coffee`

### CoffeeScript errors

Ensure CoffeeScript is registered before requiring .coffee files:
```javascript
require('coffeescript/register');
```

## Future Improvements

Potential enhancements to the test suite:

- [ ] Add test coverage reporting (e.g., using nyc/istanbul)
- [ ] Add tests for more state scrapers as they're added
- [ ] Mock HTTP requests for more reliable integration tests
- [ ] Add performance benchmarks for scraper speed
- [ ] Add snapshot testing for output format consistency
