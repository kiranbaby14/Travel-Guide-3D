# TravelGuide3D 🌍

TravelGuide3D reimagines travel route planning by combining beautiful 3D visualization with practical navigation, making every journey planning as exciting as the destination itself. The platform features immersive voice-based narration that brings locations to life, with historical sites and landmarks highlighted in dynamic 3D polygons alongside captivating imagery and comprehensive summaries.

## 🎥 Demo Video

[![TravelGuide3D Demo](https://img.youtube.com/vi/Vv0zSx3vOeM/maxresdefault.jpg)](https://www.youtube.com/watch?v=Vv0zSx3vOeM&t=3s)

[Watch the full demo on YouTube](https://www.youtube.com/watch?v=YOUR_VIDEO_ID)

## 🛠️ Tech Stack

### Core Technologies

- **Next.js**
- **React**
- **Shadcn**
- **Tailwind CSS**
- **vis.gl**

### Google Maps Platform Integration

- **Maps JavaScript API:** Core map functionality
- **Places API:** Location data and POI discovery
- **Directions API:** Route optimization
- **Autocomplete API:** Seamless location search

## 🚀 Features

- **Cinematic Route Visualization:** Experience your travel routes in stunning 3D graphics
- **Location Insights Narration:** Get rich, contextual information about places you'll visit
- **Dynamic Points of Interest Discovery:** Automatically discover interesting locations along your route
- **Interactive 3D Tour Controls:** Intuitive camera controls for seamless exploration
- **Mini-Map Navigation:** Maintain spatial awareness while exploring in 3D

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

### Docker Deployment

Build and run:

```bash
docker-compose up --build
```

The application will be available at `http://localhost:3000`

## 💪 Challenges & Solutions

The main challenge was integrating 3D visualization capabilities. While vis.gl library was considered for its React-friendly approach, the Maps JavaScript API for 3D was still in development, which affected vis.gl's functionality. This required careful planning of component structure and architecture to ensure smooth operation.

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
- Performance optimization for complex 3D scenes

### Long-term Vision

- Virtual tourism sector expansion
- Crowd-sourced location insights
