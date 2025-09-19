# Nyimbo Zetu Data

SON data source for the NYIMBO ZETU Flutter app — Swahili hymns with verses and chorus, served for offline use.

## Overview

This repository contains structured data for Swahili Christian hymns, designed to be consumed by the Nyimbo Zetu Flutter application. The data is optimized for offline use and includes verses, choruses, metadata, and search indices.

## Data Structure

### Hymn Format

Each hymn is stored as a JSON file following a standardized schema. Here's the structure:

```json
{
  "id": 1,
  "title": "Hymn Title in Swahili",
  "subtitle": "Optional English subtitle",
  "author": "Author name",
  "category": "praise|worship|prayer|thanksgiving|christmas|easter|funeral|wedding|youth|children|general",
  "meter": "Musical meter (e.g., 8.7.8.7)",
  "verses": [
    {
      "number": 1,
      "text": [
        "First line of verse",
        "Second line of verse",
        "..."
      ]
    }
  ],
  "chorus": {
    "text": [
      "Chorus line 1",
      "Chorus line 2"
    ],
    "position": "after_each_verse|after_verse_1|after_verse_2|at_end"
  },
  "tags": ["tag1", "tag2"],
  "scripture_references": ["Zaburi 100:5"],
  "created_date": "2024-01-01",
  "modified_date": "2024-01-01"
}
```

### Directory Structure

```
data/
├── hymns/           # Individual hymn JSON files
│   ├── 001.json
│   ├── 002.json
│   └── ...
└── indexes/         # Search and category indexes
    └── hymn_index.json

dist/                # Generated offline bundles
└── offline_bundle.json

schema.json          # JSON schema for validation
utils.js            # Data utilities and CLI tools
test.js             # Test suite
```

## Usage

### Node.js API

```javascript
const HymnDataUtils = require('./utils.js');

const utils = new HymnDataUtils('./data');

// Load a specific hymn
const hymn = utils.loadHymn(1);

// Get hymns by category
const praiseHymns = utils.getHymnsByCategory('praise');

// Search by tag
const worshipHymns = utils.getHymnsByTag('worship');

// Search by title
const searchResults = utils.searchHymnsByTitle('Mungu');

// Generate offline bundle
const bundle = utils.generateOfflineBundle();
```

### Command Line Interface

```bash
# List all hymns
npm run list

# Get specific hymn
node utils.js get 1

# Get hymns by category
node utils.js category praise

# Generate offline bundle
npm run build

# Run tests
npm test
```

### Flutter Integration

For Flutter apps, use the generated offline bundle:

```dart
// Load the offline bundle
final String bundleJson = await rootBundle.loadString('assets/data/offline_bundle.json');
final Map<String, dynamic> bundle = json.decode(bundleJson);

// Access hymns
final Map<String, dynamic> hymns = bundle['hymns'];
final Map<String, dynamic> index = bundle['index'];

// Get hymn by ID
final hymn = hymns['1'];

// Search by category
final List<int> praiseHymnIds = List<int>.from(index['categories']['praise']);
```

## Data Categories

- **praise** - Songs of praise and adoration
- **worship** - Worship and reverence songs
- **prayer** - Prayer songs and requests
- **thanksgiving** - Songs of gratitude
- **christmas** - Christmas and Advent songs
- **easter** - Easter and resurrection songs
- **funeral** - Memorial and comfort songs
- **wedding** - Wedding and celebration songs
- **youth** - Songs for youth groups
- **children** - Children's songs
- **general** - General purpose hymns

## Adding New Hymns

1. Create a new JSON file in `data/hymns/` following the schema
2. Update `data/indexes/hymn_index.json` with the new hymn information
3. Run tests to validate: `npm test`
4. Rebuild the offline bundle: `npm run build`

## Schema Validation

The repository includes a JSON schema (`schema.json`) for validating hymn data structure. Use the validation utility:

```bash
node utils.js validate 1
```

## Testing

Run the test suite to ensure data integrity:

```bash
npm test
```

Tests include:
- Schema validation
- Data integrity checks
- Index consistency
- Bundle generation
- Search functionality

## Contributing

1. Follow the established JSON schema
2. Ensure all hymns include proper Swahili titles and content
3. Add appropriate tags and categories
4. Include scripture references where applicable
5. Test your changes before submitting

## License

MIT License - see LICENSE file for details.
