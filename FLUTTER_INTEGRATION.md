# Flutter Integration Guide

This guide explains how to integrate Nyimbo Zetu data into your Flutter application for offline hymn access.

## Setup

1. Add the offline bundle to your Flutter app's assets:

```yaml
# pubspec.yaml
flutter:
  assets:
    - assets/data/offline_bundle.json
```

2. Copy `dist/offline_bundle.json` to `assets/data/` in your Flutter project.

## Data Models

Create these Dart classes to work with the hymn data:

```dart
// hymn.dart
class Hymn {
  final int id;
  final String title;
  final String? subtitle;
  final String? author;
  final String category;
  final String? meter;
  final List<Verse> verses;
  final Chorus? chorus;
  final List<String> tags;
  final List<String> scriptureReferences;
  final DateTime? createdDate;
  final DateTime? modifiedDate;

  Hymn({
    required this.id,
    required this.title,
    this.subtitle,
    this.author,
    required this.category,
    this.meter,
    required this.verses,
    this.chorus,
    required this.tags,
    required this.scriptureReferences,
    this.createdDate,
    this.modifiedDate,
  });

  factory Hymn.fromJson(Map<String, dynamic> json) {
    return Hymn(
      id: json['id'],
      title: json['title'],
      subtitle: json['subtitle'],
      author: json['author'],
      category: json['category'],
      meter: json['meter'],
      verses: (json['verses'] as List)
          .map((v) => Verse.fromJson(v))
          .toList(),
      chorus: json['chorus'] != null ? Chorus.fromJson(json['chorus']) : null,
      tags: List<String>.from(json['tags'] ?? []),
      scriptureReferences: List<String>.from(json['scripture_references'] ?? []),
      createdDate: json['created_date'] != null 
          ? DateTime.parse(json['created_date']) 
          : null,
      modifiedDate: json['modified_date'] != null 
          ? DateTime.parse(json['modified_date']) 
          : null,
    );
  }
}

class Verse {
  final int number;
  final List<String> text;

  Verse({required this.number, required this.text});

  factory Verse.fromJson(Map<String, dynamic> json) {
    return Verse(
      number: json['number'],
      text: List<String>.from(json['text']),
    );
  }
}

class Chorus {
  final List<String> text;
  final String position;

  Chorus({required this.text, required this.position});

  factory Chorus.fromJson(Map<String, dynamic> json) {
    return Chorus(
      text: List<String>.from(json['text']),
      position: json['position'] ?? 'after_each_verse',
    );
  }
}

class HymnIndex {
  final String version;
  final int totalHymns;
  final DateTime lastUpdated;
  final List<HymnInfo> hymns;
  final Map<String, List<int>> categories;
  final Map<String, List<int>> tags;

  HymnIndex({
    required this.version,
    required this.totalHymns,
    required this.lastUpdated,
    required this.hymns,
    required this.categories,
    required this.tags,
  });

  factory HymnIndex.fromJson(Map<String, dynamic> json) {
    return HymnIndex(
      version: json['version'],
      totalHymns: json['total_hymns'],
      lastUpdated: DateTime.parse(json['last_updated']),
      hymns: (json['hymns'] as List)
          .map((h) => HymnInfo.fromJson(h))
          .toList(),
      categories: Map<String, List<int>>.from(
        json['categories'].map((k, v) => MapEntry(k, List<int>.from(v)))
      ),
      tags: Map<String, List<int>>.from(
        json['tags'].map((k, v) => MapEntry(k, List<int>.from(v)))
      ),
    );
  }
}

class HymnInfo {
  final int id;
  final String title;
  final String? subtitle;
  final String category;
  final String file;
  final List<String> tags;
  final bool hasChorus;
  final int verseCount;

  HymnInfo({
    required this.id,
    required this.title,
    this.subtitle,
    required this.category,
    required this.file,
    required this.tags,
    required this.hasChorus,
    required this.verseCount,
  });

  factory HymnInfo.fromJson(Map<String, dynamic> json) {
    return HymnInfo(
      id: json['id'],
      title: json['title'],
      subtitle: json['subtitle'],
      category: json['category'],
      file: json['file'],
      tags: List<String>.from(json['tags']),
      hasChorus: json['has_chorus'],
      verseCount: json['verse_count'],
    );
  }
}
```

## Service Class

Create a service to manage hymn data:

```dart
// hymn_service.dart
import 'dart:convert';
import 'package:flutter/services.dart';

class HymnService {
  Map<String, dynamic>? _bundle;
  HymnIndex? _index;
  Map<int, Hymn>? _hymns;

  Future<void> initialize() async {
    if (_bundle != null) return;

    final String bundleJson = await rootBundle.loadString('assets/data/offline_bundle.json');
    _bundle = json.decode(bundleJson);
    
    _index = HymnIndex.fromJson(_bundle!['index']);
    _hymns = Map<int, Hymn>.from(
      _bundle!['hymns'].map((k, v) => MapEntry(int.parse(k), Hymn.fromJson(v)))
    );
  }

  HymnIndex get index {
    assert(_index != null, 'HymnService not initialized');
    return _index!;
  }

  Hymn? getHymn(int id) {
    assert(_hymns != null, 'HymnService not initialized');
    return _hymns![id];
  }

  List<Hymn> getAllHymns() {
    assert(_hymns != null, 'HymnService not initialized');
    return _hymns!.values.toList();
  }

  List<Hymn> getHymnsByCategory(String category) {
    final hymnIds = index.categories[category] ?? [];
    return hymnIds.map((id) => getHymn(id)).where((h) => h != null).cast<Hymn>().toList();
  }

  List<Hymn> getHymnsByTag(String tag) {
    final hymnIds = index.tags[tag] ?? [];
    return hymnIds.map((id) => getHymn(id)).where((h) => h != null).cast<Hymn>().toList();
  }

  List<Hymn> searchHymns(String query) {
    if (query.isEmpty) return getAllHymns();
    
    final queryLower = query.toLowerCase();
    return getAllHymns().where((hymn) {
      return hymn.title.toLowerCase().contains(queryLower) ||
             (hymn.subtitle?.toLowerCase().contains(queryLower) ?? false) ||
             hymn.tags.any((tag) => tag.toLowerCase().contains(queryLower));
    }).toList();
  }

  List<String> getCategories() {
    return index.categories.keys.toList();
  }

  List<String> getTags() {
    return index.tags.keys.toList();
  }
}
```

## Usage Examples

### Initialize the service

```dart
final hymnService = HymnService();

// In your app's main method or splash screen
await hymnService.initialize();
```

### Display a hymn

```dart
class HymnDisplayWidget extends StatelessWidget {
  final int hymnId;

  const HymnDisplayWidget({Key? key, required this.hymnId}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final hymn = hymnService.getHymn(hymnId);
    if (hymn == null) return Text('Hymn not found');

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(hymn.title, style: Theme.of(context).textTheme.headlineMedium),
        if (hymn.subtitle != null)
          Text(hymn.subtitle!, style: Theme.of(context).textTheme.titleMedium),
        
        SizedBox(height: 16),
        
        // Display verses and chorus
        ...hymn.verses.expand((verse) {
          List<Widget> widgets = [
            Text('Verse ${verse.number}', 
                style: Theme.of(context).textTheme.titleSmall),
            ...verse.text.map((line) => Text(line)),
            SizedBox(height: 8),
          ];
          
          // Add chorus after verse if specified
          if (hymn.chorus != null && 
              (hymn.chorus!.position == 'after_each_verse' ||
               hymn.chorus!.position == 'after_verse_${verse.number}')) {
            widgets.addAll([
              Text('Chorus', style: Theme.of(context).textTheme.titleSmall),
              ...hymn.chorus!.text.map((line) => Text(line)),
              SizedBox(height: 8),
            ]);
          }
          
          return widgets;
        }),
      ],
    );
  }
}
```

### Search hymns

```dart
class HymnSearchWidget extends StatefulWidget {
  @override
  _HymnSearchWidgetState createState() => _HymnSearchWidgetState();
}

class _HymnSearchWidgetState extends State<HymnSearchWidget> {
  String _searchQuery = '';
  
  @override
  Widget build(BuildContext context) {
    final searchResults = hymnService.searchHymns(_searchQuery);
    
    return Column(
      children: [
        TextField(
          onChanged: (value) => setState(() => _searchQuery = value),
          decoration: InputDecoration(
            hintText: 'Search hymns...',
            prefixIcon: Icon(Icons.search),
          ),
        ),
        
        Expanded(
          child: ListView.builder(
            itemCount: searchResults.length,
            itemBuilder: (context, index) {
              final hymn = searchResults[index];
              return ListTile(
                title: Text(hymn.title),
                subtitle: Text(hymn.subtitle ?? hymn.category),
                onTap: () {
                  // Navigate to hymn display
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => HymnDisplayWidget(hymnId: hymn.id),
                    ),
                  );
                },
              );
            },
          ),
        ),
      ],
    );
  }
}
```

### Browse by category

```dart
class CategoryBrowserWidget extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final categories = hymnService.getCategories();
    
    return ListView.builder(
      itemCount: categories.length,
      itemBuilder: (context, index) {
        final category = categories[index];
        final hymns = hymnService.getHymnsByCategory(category);
        
        return ExpansionTile(
          title: Text(category.toUpperCase()),
          subtitle: Text('${hymns.length} hymns'),
          children: hymns.map((hymn) {
            return ListTile(
              title: Text(hymn.title),
              subtitle: Text(hymn.subtitle ?? ''),
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => HymnDisplayWidget(hymnId: hymn.id),
                  ),
                );
              },
            );
          }).toList(),
        );
      },
    );
  }
}
```

## Performance Tips

1. **Lazy Loading**: Consider loading only hymn metadata initially and fetch full hymn content when needed
2. **Caching**: Cache frequently accessed hymns in memory
3. **Indexing**: Use the provided indexes for efficient searching
4. **Offline First**: The bundle is designed for offline use - no network requests needed

## Data Updates

To update the hymn data in your app:

1. Download the latest `offline_bundle.json` from this repository
2. Replace the file in your `assets/data/` folder
3. Rebuild your app

The bundle includes a version number and last_updated timestamp to help manage updates.