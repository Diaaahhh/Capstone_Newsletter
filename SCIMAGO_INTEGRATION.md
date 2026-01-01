# SCImago Journal & Country Rank Integration

## Overview

This document describes the integration of SCImago Journal & Country Rank (SJR) data into the East West University Newsletter website. The integration displays journal rankings, impact factors, and quartiles (Q1, Q2, Q3, Q4) for academic journals and conference proceedings.

## Features

### 1. **Automatic Journal Metrics Fetching**
- Fetches journal rankings from SCImago database
- Falls back to OpenAlex if SCImago data is unavailable
- Displays quartile rankings (Q1-Q4)
- Shows impact factors (IF) or SJR scores
- Displays H-Index and citation counts

### 2. **Visual Indicators**
- **Q1 (Top Tier)**: Gold gradient badge with trophy icon
- **Q2 (High Quality)**: Green gradient badge with award icon
- **Q3 (Good Quality)**: Blue gradient badge with star icon
- **Q4 (Standard)**: Gray gradient badge with bookmark icon

### 3. **Display Locations**
- Journal publication cards on listing pages
- Conference proceeding cards on listing pages
- Modal popups when viewing details
- Create/edit forms with real-time metrics

## Implementation

### Backend Services

#### 1. **SCImago Service** (`backend/services/scimagoService.js`)
```javascript
// Fetches journal ranking from SCImago
getJournalRankingFromScimago(journalName, year)

// Fetches with fallback to OpenAlex
getJournalRankingWithFallback(journalName, year)
```

**Features:**
- Web scraping of SCImago website
- Parses quartile data from JavaScript variables
- Extracts SJR scores
- Handles multiple year data
- Robust error handling

#### 2. **Journal Lookup Routes** (`backend/routes/journalLookupRoutes.js`)
```javascript
POST /api/journal/lookup
POST /api/journal/lookup-by-issn
GET /api/journal/health
```

### Frontend Components

#### 1. **Journal Metrics Display Module** (`frontend/journalMetricsDisplay.js`)

**Key Functions:**
- `getQuartileStyle(quartile)` - Returns styling for Q1-Q4 badges
- `createMetricsBadge(metrics)` - Creates visual badge elements
- `fetchJournalMetrics(journalName, year)` - Fetches metrics from backend
- `addMetricsToCard(card, item)` - Adds metrics to publication cards
- `addMetricsToModal(modal, item)` - Adds metrics to detail modals

**Badge Types:**
1. **Quartile Badge** - Shows Q1, Q2, Q3, or Q4 with color coding
2. **Impact Factor Badge** - Purple gradient, shows IF or SJR score
3. **H-Index Badge** - Pink gradient, shows H-Index value
4. **Citations Badge** - Cyan gradient, shows total citations
5. **Source Badge** - Gray, shows data source (SCImago/OpenAlex)

#### 2. **Integration in Pages**

**Journal Publications** (`frontend/journalPublications.html`):
```html
<script src="journalMetricsDisplay.js"></script>
```

**Conference Proceedings** (`frontend/conferenceProceeding.html`):
```html
<script src="journalMetricsDisplay.js"></script>
```

## Usage

### For Journal Publications

1. **Automatic Display:**
   - When journal publications are loaded, metrics are automatically fetched
   - Badges appear below the publication metadata
   - Hover over badges for tooltips

2. **In Create Form:**
   - Enter journal name and year
   - Metrics are fetched automatically via the existing auto-fill feature
   - Stored with the publication for future display

### For Conference Proceedings

1. **Automatic Display:**
   - Conference proceedings show metrics if conference name matches a journal
   - Useful for proceedings published in journal special issues
   - Same badge system as journal publications

## Data Flow

```
User Views Page
    ↓
JavaScript loads publication data
    ↓
For each publication:
    ↓
Check if metrics exist in formData
    ↓
If not, fetch from backend API
    ↓
Backend queries SCImago service
    ↓
SCImago scrapes website data
    ↓
If fails, fallback to OpenAlex
    ↓
Return metrics to frontend
    ↓
Create and display badges
```

## Styling

### Quartile Colors
- **Q1**: Gold (#F59E0B → #D97706)
- **Q2**: Green (#10B981 → #059669)
- **Q3**: Blue (#3B82F6 → #2563EB)
- **Q4**: Gray (#6B7280 → #4B5563)

### Badge Features
- Gradient backgrounds
- Smooth hover animations (translateY)
- Box shadows for depth
- Responsive design
- Icon integration (Bootstrap Icons)

## API Endpoints

### Lookup by Journal Name
```http
POST /api/journal/lookup
Content-Type: application/json

{
  "journalName": "Nature",
  "year": 2024
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "journalRanking": "Q1",
    "impactFactor": 64.8,
    "hIndex": 1234,
    "citedByCount": 500000,
    "source": "SCImago"
  },
  "message": "Journal metrics fetched successfully"
}
```

### Lookup by ISSN
```http
POST /api/journal/lookup-by-issn
Content-Type: application/json

{
  "issn": "0028-0836"
}
```

## Configuration

### Backend Configuration
No additional configuration needed. The service uses:
- SCImago website scraping (no API key required)
- OpenAlex API (free, no authentication)

### Frontend Configuration
Update API endpoint if backend runs on different port:
```javascript
// In journalMetricsDisplay.js
const API_URL = 'http://localhost:5000/api/journal/lookup';
```

## Caching

The backend implements caching to reduce API calls:
- Metrics are cached for 24 hours
- Cache key: `journal:{name}:{year}`
- Stored in memory (can be upgraded to Redis)

## Error Handling

### Backend
- Graceful fallback to OpenAlex if SCImago fails
- Returns null metrics if both sources fail
- Logs errors for debugging

### Frontend
- Silently handles missing metrics
- No badges shown if data unavailable
- No error messages to users (clean UX)

## Performance Considerations

1. **Async Loading**: Metrics load asynchronously after page render
2. **Non-Blocking**: Page displays immediately, badges appear when ready
3. **Caching**: Reduces redundant API calls
4. **Lazy Loading**: Only fetches metrics for visible publications

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires ES6+ support (async/await)
- Bootstrap 5.3+ for styling
- Bootstrap Icons for icons

## Future Enhancements

1. **CSV Data Import**: Download SCImago CSV files for offline use
2. **Database Storage**: Store metrics in MongoDB for faster access
3. **Batch Processing**: Fetch multiple journal metrics in one request
4. **Historical Data**: Show ranking trends over years
5. **Comparison Tool**: Compare multiple journals side-by-side
6. **Export Feature**: Export publications with metrics to PDF/Excel

## Troubleshooting

### Metrics Not Showing
1. Check browser console for errors
2. Verify backend server is running
3. Check network tab for API calls
4. Ensure journal name is correct

### Wrong Metrics
1. Verify journal name spelling
2. Check publication year
3. Try alternative journal names
4. Check SCImago website directly

### Performance Issues
1. Check cache configuration
2. Monitor API response times
3. Consider implementing Redis cache
4. Optimize database queries

## Support

For issues or questions:
1. Check backend logs: `backend/server.js`
2. Check browser console
3. Review SCImago service logs
4. Test API endpoints directly

## Credits

- **SCImago Journal & Country Rank**: https://www.scimagojr.com/
- **OpenAlex**: https://openalex.org/
- **Bootstrap**: https://getbootstrap.com/
- **Bootstrap Icons**: https://icons.getbootstrap.com/

## License

This integration is part of the East West University Newsletter system.