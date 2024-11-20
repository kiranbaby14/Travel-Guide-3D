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
