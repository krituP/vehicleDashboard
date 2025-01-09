# Vehicle Dashboard Simulator

## Overview
A real-time vehicle dashboard simulator that emulates key vehicle metrics including motor RPM, power consumption, battery status, and temperature. Built with Python (Flask) backend and vanilla JavaScript frontend.

![Dashboard Preview](path_to_dashboard_screenshot.png) <!-- Add a screenshot of your dashboard here -->

## Features

| Feature | Description | Status |
|---------|------------|---------|
| Real-time Gauges | Dynamic RPM and Power gauges | ✅ |
| Battery Monitoring | Battery percentage and charging status | ✅ |
| Temperature Tracking | Real-time temperature monitoring | ✅ |
| Historical Data | Data logging and visualization | ✅ |
| Charging Simulation | Simulated charging mechanics | ✅ |

## System Architecture

mermaid
graph TD
A[Frontend] -->|HTTP Requests| B[Flask Backend]
B -->|Store/Retrieve| C[Firestore Database]
B -->|Real-time Updates| A
D[Background Tasks] -->|Update Vehicle Status| B


## Technical Stack

| Component | Technology |
|-----------|------------|
| Frontend | HTML, CSS, JavaScript, D3.js |
| Backend | Python, Flask |
| Database | Google Firestore |
| Deployment | Vercel (Backend), GitHub Pages (Frontend) |

## Key Components

### Backend Services
- Vehicle status management
- Real-time data updates
- Historical data logging
- Battery simulation
- Temperature modeling

### Frontend Features


graph LR
A[Dashboard] --> B[Gauges]
A --> C[Status Indicators]
A --> D[Control Panel]
B --> E[RPM Gauge]
B --> F[Power Gauge]
C --> G[Battery Status]
C --> H[Temperature]
D --> I[Speed Control]
D --> J[Charging Control]




## Setup and Installation

### Prerequisites
- Python 3.8+
- Node.js (for local development)
- Google Cloud account with Firestore enabled

### Environment Variables