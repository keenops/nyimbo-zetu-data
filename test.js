const HymnDataUtils = require('./utils.js');

/**
 * Simple test runner for hymn data validation
 */
function runTests() {
  const utils = new HymnDataUtils('./data');
  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`✓ ${name}`);
      passed++;
    } catch (error) {
      console.log(`✗ ${name}: ${error.message}`);
      failed++;
    }
  }

  console.log('Running Nyimbo Zetu Data Tests...\n');

  // Test loading schema
  test('Load schema', () => {
    const schema = utils.loadSchema();
    if (!schema || !schema.title) {
      throw new Error('Schema not loaded properly');
    }
  });

  // Test loading index
  test('Load hymn index', () => {
    const index = utils.loadIndex();
    if (!index || !index.hymns || index.hymns.length === 0) {
      throw new Error('Index not loaded properly');
    }
  });

  // Test loading individual hymns
  test('Load hymn by ID', () => {
    const hymn = utils.loadHymn(1);
    if (!hymn || !hymn.title || !hymn.verses) {
      throw new Error('Hymn not loaded properly');
    }
  });

  // Test validation
  test('Validate hymn structure', () => {
    const hymn = utils.loadHymn(1);
    const validation = utils.validateHymn(hymn);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
  });

  // Test category filtering
  test('Get hymns by category', () => {
    const praiseHymns = utils.getHymnsByCategory('praise');
    if (praiseHymns.length === 0) {
      throw new Error('No praise hymns found');
    }
  });

  // Test tag search
  test('Get hymns by tag', () => {
    const worshipHymns = utils.getHymnsByTag('worship');
    if (worshipHymns.length === 0) {
      throw new Error('No worship hymns found');
    }
  });

  // Test title search
  test('Search hymns by title', () => {
    const searchResults = utils.searchHymnsByTitle('Mungu');
    if (searchResults.length === 0) {
      throw new Error('No hymns found for search term');
    }
  });

  // Test offline bundle generation
  test('Generate offline bundle', () => {
    const bundle = utils.generateOfflineBundle();
    if (!bundle || !bundle.hymns || !bundle.index) {
      throw new Error('Bundle not generated properly');
    }
    if (Object.keys(bundle.hymns).length !== bundle.total_hymns) {
      throw new Error('Bundle hymn count mismatch');
    }
  });

  // Test data integrity
  test('Data integrity check', () => {
    const index = utils.loadIndex();
    
    // Check that all hymns in index exist
    index.hymns.forEach(hymnInfo => {
      const hymn = utils.loadHymn(hymnInfo.id);
      if (!hymn) {
        throw new Error(`Hymn ${hymnInfo.id} referenced in index but not found`);
      }
      
      // Check that hymn data matches index info
      if (hymn.id !== hymnInfo.id) {
        throw new Error(`Hymn ID mismatch: ${hymn.id} vs ${hymnInfo.id}`);
      }
      
      if (hymn.title !== hymnInfo.title) {
        throw new Error(`Hymn title mismatch for ID ${hymn.id}`);
      }
      
      if (hymn.verses.length !== hymnInfo.verse_count) {
        throw new Error(`Verse count mismatch for hymn ${hymn.id}`);
      }
      
      const hasChorus = !!(hymn.chorus && hymn.chorus.text);
      if (hasChorus !== hymnInfo.has_chorus) {
        throw new Error(`Chorus flag mismatch for hymn ${hymn.id}`);
      }
    });
  });

  console.log(`\nTest Results: ${passed} passed, ${failed} failed`);
  
  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('All tests passed! ✓');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };