const fs = require('fs');
const path = require('path');

/**
 * Utility class for working with Nyimbo Zetu hymn data
 */
class HymnDataUtils {
  constructor(dataPath = './data') {
    this.dataPath = dataPath;
    this.schema = null;
    this.index = null;
  }

  /**
   * Load the hymn schema
   */
  loadSchema() {
    if (!this.schema) {
      const schemaPath = path.join(process.cwd(), 'schema.json');
      this.schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    }
    return this.schema;
  }

  /**
   * Load the hymn index
   */
  loadIndex() {
    if (!this.index) {
      const indexPath = path.join(this.dataPath, 'indexes', 'hymn_index.json');
      this.index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    }
    return this.index;
  }

  /**
   * Load a specific hymn by ID
   * @param {number} id - Hymn ID
   * @returns {Object} Hymn data
   */
  loadHymn(id) {
    const index = this.loadIndex();
    const hymnInfo = index.hymns.find(h => h.id === id);
    
    if (!hymnInfo) {
      throw new Error(`Hymn with ID ${id} not found`);
    }

    const hymnPath = path.join(this.dataPath, hymnInfo.file);
    return JSON.parse(fs.readFileSync(hymnPath, 'utf8'));
  }

  /**
   * Get all hymns in a specific category
   * @param {string} category - Category name
   * @returns {Array} Array of hymn data
   */
  getHymnsByCategory(category) {
    const index = this.loadIndex();
    const hymnIds = index.categories[category] || [];
    return hymnIds.map(id => this.loadHymn(id));
  }

  /**
   * Search hymns by tag
   * @param {string} tag - Tag to search for
   * @returns {Array} Array of hymn data
   */
  getHymnsByTag(tag) {
    const index = this.loadIndex();
    const hymnIds = index.tags[tag] || [];
    return hymnIds.map(id => this.loadHymn(id));
  }

  /**
   * Search hymns by title (case insensitive)
   * @param {string} searchTerm - Search term
   * @returns {Array} Array of hymn data
   */
  searchHymnsByTitle(searchTerm) {
    const index = this.loadIndex();
    const term = searchTerm.toLowerCase();
    
    const matchingHymns = index.hymns.filter(hymn => 
      hymn.title.toLowerCase().includes(term) ||
      (hymn.subtitle && hymn.subtitle.toLowerCase().includes(term))
    );
    
    return matchingHymns.map(hymn => this.loadHymn(hymn.id));
  }

  /**
   * Get all available categories
   * @returns {Array} Array of category names
   */
  getCategories() {
    const index = this.loadIndex();
    return Object.keys(index.categories);
  }

  /**
   * Get all available tags
   * @returns {Array} Array of tag names
   */
  getTags() {
    const index = this.loadIndex();
    return Object.keys(index.tags);
  }

  /**
   * Validate a hymn against the schema
   * @param {Object} hymn - Hymn data to validate
   * @returns {Object} Validation result with isValid and errors
   */
  validateHymn(hymn) {
    // Basic validation - in a real implementation, you'd use a JSON schema validator
    const errors = [];
    
    if (!hymn.id || typeof hymn.id !== 'number') {
      errors.push('Missing or invalid id');
    }
    
    if (!hymn.title || typeof hymn.title !== 'string') {
      errors.push('Missing or invalid title');
    }
    
    if (!hymn.verses || !Array.isArray(hymn.verses) || hymn.verses.length === 0) {
      errors.push('Missing or invalid verses');
    }
    
    if (hymn.verses) {
      hymn.verses.forEach((verse, index) => {
        if (!verse.number || typeof verse.number !== 'number') {
          errors.push(`Verse ${index + 1}: missing or invalid number`);
        }
        if (!verse.text || !Array.isArray(verse.text) || verse.text.length === 0) {
          errors.push(`Verse ${index + 1}: missing or invalid text`);
        }
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate offline bundle for Flutter app
   * @returns {Object} Complete data bundle
   */
  generateOfflineBundle() {
    const index = this.loadIndex();
    const hymns = {};
    
    // Load all hymns
    index.hymns.forEach(hymnInfo => {
      hymns[hymnInfo.id] = this.loadHymn(hymnInfo.id);
    });
    
    return {
      version: index.version,
      last_updated: index.last_updated,
      total_hymns: index.total_hymns,
      index: index,
      hymns: hymns,
      schema: this.loadSchema()
    };
  }
}

module.exports = HymnDataUtils;

// CLI usage
if (require.main === module) {
  const utils = new HymnDataUtils();
  
  const command = process.argv[2];
  const arg = process.argv[3];
  
  try {
    switch (command) {
      case 'list':
        const index = utils.loadIndex();
        console.log('Available hymns:');
        index.hymns.forEach(hymn => {
          console.log(`${hymn.id}: ${hymn.title} (${hymn.category})`);
        });
        break;
        
      case 'get':
        if (!arg) {
          console.log('Usage: node utils.js get <hymn_id>');
          process.exit(1);
        }
        const hymn = utils.loadHymn(parseInt(arg));
        console.log(JSON.stringify(hymn, null, 2));
        break;
        
      case 'category':
        if (!arg) {
          console.log('Usage: node utils.js category <category_name>');
          console.log('Available categories:', utils.getCategories().join(', '));
          process.exit(1);
        }
        const categoryHymns = utils.getHymnsByCategory(arg);
        console.log(`Hymns in category "${arg}":`);
        categoryHymns.forEach(h => console.log(`${h.id}: ${h.title}`));
        break;
        
      case 'bundle':
        const bundle = utils.generateOfflineBundle();
        console.log(JSON.stringify(bundle, null, 2));
        break;
        
      case 'validate':
        if (!arg) {
          console.log('Usage: node utils.js validate <hymn_id>');
          process.exit(1);
        }
        const hymnToValidate = utils.loadHymn(parseInt(arg));
        const validation = utils.validateHymn(hymnToValidate);
        if (validation.isValid) {
          console.log('Hymn is valid!');
        } else {
          console.log('Validation errors:');
          validation.errors.forEach(error => console.log(`- ${error}`));
        }
        break;
        
      default:
        console.log('Available commands:');
        console.log('  list - List all hymns');
        console.log('  get <id> - Get specific hymn');
        console.log('  category <name> - Get hymns by category');
        console.log('  bundle - Generate offline bundle');
        console.log('  validate <id> - Validate hymn');
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}