# TravelGuide3D 🌍

TravelGuide3D revolutionizes travel planning with stunning 3D visualizations, immersive voice narration, and dynamic 3D polygons highlighting landmarks. It features automated camera movements that smoothly guide users from start to destination, offering cinematic transitions and breathtaking views. Journey planning has never been this exciting!

## 🎥 Demo Video

[![TravelGuide3D Demo](https://img.youtube.com/vi/Vv0zSx3vOeM/maxresdefault.jpg)](https://www.youtube.com/watch?v=Vv0zSx3vOeM&t=3s)

[Watch the full demo on YouTube](https://www.youtube.com/watch?v=YOUR_VIDEO_ID)

## 🛠️ Tech Stack

### Core Technologies

- **Next.js**
- **React**
- **Shadcn**
- **Tailwind CSS**
- **Vis.gl**

### Google Maps Platform Integration

- **Maps JavaScript API:** Core map functionality
- **Places API:** Location data and POI discovery
- **Directions API:** Route optimization
- **Autocomplete API:** Seamless location search
- **Flexible Travel Modes:**
  - 🚶 **Walking:** Perfect for city exploration and short distances
  - 🚲 **Cycling:** Bike-friendly routes
  - 🚗 **Driving:** Enjoy a relaxing drive with stunning views along the way

## 🚀 Features

- **Cinematic Route Visualization:** Experience your travel routes in stunning 3D graphics
- **Location Insights Narration:** Get rich, contextual information about places you'll visit
- **Dynamic Points of Interest Discovery:** Automatically discover interesting locations along your route
- **Interactive 3D Tour:** Intuitive automated camera movements for seamless exploration
- **Mini-Map Navigation:** Maintain spatial awareness in 2D while exploring in 3D
- **Flexible Touring Experience:** ⏯️ Pause/Resume: Take a break and resume your tour exactly where you left off
- **Voice-Based Narration** Engaging narratives about each location
- **Flexible Travel Modes:** Choose between walking, cycling, or driving routes to match your travel style
- **Smart Place Search:** Easily find and navigate to destinations, landmarks, or points of interest
- **Interactive POI Exploration:** Zoom out and explore POIs independently during **tour pauses**, with automatic narration triggers

## 🚧 Development Setup

### Prerequisites

- Node.js 20.x (for local development) (v20.11.0 used while building)
- PNPM package manager
- Docker and Docker Compose (for containerized deployment)
- Google Maps API key and Map ID

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your_google_maps_api_key_here"
NEXT_PUBLIC_MAP_ID="your_map_id_here"
```

### Quick Start

1. Install dependencies:

```bash
pnpm install
```

2. Run the development server:

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

##### ⚠️ Important Note for Windows Users

If you encounter symlink-related errors during build (EPERM: operation not permitted, symlink), you can:

- Remove `output: 'standalone'` from your next.config.js file

### Docker Deployment

Build and run:

```bash
docker-compose up --build
```

The application will be available at `http://localhost:3000`

## 🎯 Points of Interest Configuration

The POI discovery system uses a multi-stage filtering and ranking process to find relevant attractions along routes.

### Distance Parameters

These parameters affect which POIs are included in the results:

```typescript
const DISTANCES = {
  SEARCH_RADIUS: 250, // API search radius in meters (filter for places API-nearby search)
  FILTER_RADIUS: 200, // Secondary filter radius in meters (post-API filter)
  SAMPLE_INTERVAL: 600, // Distance between route sampling points
  MIN_POI_SPACING: 600, // Minimum distance between selected POIs
  EXCLUSION_FROM_ENDS: 500, // Distance from route ends to exclude
};
```
[View Distance Configuration Code](https://github.com/kiranbaby14/Travel-Guide-3D/blob/master/src/hooks/useRoutePointsOfInterest.ts#L6)


#### Filtering Stages

1. **Pre-API Filter** (`SEARCH_RADIUS`):

   - Applied during the Google Places API call
   - Determines the initial search area
   - Increase this value to find more POIs in each search

2. **Post-API Filters**:
   - `FILTER_RADIUS`: Secondary distance-based filtering
   - `MIN_POI_SPACING`: Ensures POIs aren't too close together
   - These can be adjusted after API results are received

### Scoring Weights

POIs are ranked using these configurable weights:

```typescript
const WEIGHTS = {
  RATING: 2.0, // Weight for place rating (0-5 stars)
  DISTANCE_FROM_ROUTE: -0.5, // Penalty for distance from route
  USER_RATINGS: 0.3, // Bonus for number of user ratings
  EDITORIAL_SUMMARY: 0.5, // Bonus for places with descriptions
};
```
[View Scoring Weights Code](https://github.com/kiranbaby14/Travel-Guide-3D/blob/master/src/hooks/useRoutePointsOfInterest.ts#L215)


#### Scoring Process

1. POIs receive a base score from their Google rating
2. Distance penalty is applied based on how far they are from the route
3. Bonus points for popularity (number of ratings)
4. Additional bonus for places with editorial descriptions

The weights only affect ranking order, not filtering. To increase the number of POIs:

1. Increase `SEARCH_RADIUS` for more initial results
2. Increase `FILTER_RADIUS` to keep more distant POIs
3. Decrease `MIN_POI_SPACING` to allow POIs closer together

## 💪 Challenges & Solutions

The main challenge was integrating the Maps JavaScript API for 3D into a Next.js framework. While the vis.gl library was initially considered for its React-friendly approach, the ongoing development of the Maps JavaScript API for 3D limited vis.gl's functionality. This demanded careful planning of component structure and architecture in Next.js to ensure smooth operation and seamless automatic animation capabilities within the 3D visualization.

## 🏆 Achievements

As a solo developer project, notable achievements include:

- Successful integration of multiple Google APIs
- Production-ready application delivering real user value
- Creation of an immersive travel planning experience

## 🔮 Future Roadmap

Exciting features planned for future releases:

### Short-term Goals

- Immersive marketing features (3D advertisements)
- Weather visualization along routes

### Long-term Vision

- Virtual tourism sector expansion
- Crowd-sourced location insights
