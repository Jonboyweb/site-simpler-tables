# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This directory contains all venue information, media assets, and branding materials for The Backroom Leeds, a hidden speakeasy bar and event space. These assets are intended for use in building a new website for the venue.

## Directory Structure

```
venue-information/
├── backroom-leeds-venue-information.md    # Main venue information document
├── bottle-menu-and-brochures/             # PDF marketing materials
├── event-artwork/                         # Event promotional images
├── images/                                # Venue photography
├── logos/                                 # Brand assets and fonts
└── videos/                                # Promotional videos
```

## Key Resources

### 1. Venue Information
- **Main Document**: `backroom-leeds-venue-information.md`
  - Contains all venue details, contact info, capacity, services, events, and opening hours
  - Includes structured data about regular events (La Fiesta, Shhh!, Nostalgia)
  - Lists all available media assets with their file paths

### 2. Brand Assets
**Logos** (in `logos/`):
- Text versions: Black and white variants in PNG and SVG
- Graphic versions: Black and white variants in PNG and SVG
- Font files: Fino font family (Bold, Light, Regular, Title variants)

### 3. Visual Assets
**Photography** (in `images/`):
- Venue exterior and queue photos
- Downstairs bar (empty and busy states)
- Upstairs area and dance floor
- Event and party photos
- Service photos (bottle service, cocktails)

**Event Artwork** (in `event-artwork/`):
- `bella-gente-friday-event-art.jpeg` - Friday night event
- `shhh-saturday-event-art.jpg` - Saturday night event
- `nostalgia-sunday-event-art.jpg` - Sunday night event

### 4. Marketing Materials
**PDFs** (in `bottle-menu-and-brochures/`):
- Bottle menu with packages
- Private hire brochure
- Christmas events brochure

**Videos** (in `videos/`):
- `book-a-table-video.mp4` - Table bookings promotion
- `christmas-video.mp4` - Christmas party promotion
- `private-hire-video.mp4` - Private hire promotion

## Development Guidelines

### When Building the Website

1. **Content Source**: Use `backroom-leeds-venue-information.md` as the primary content source for:
   - Venue description and features
   - Contact information
   - Opening hours
   - Event schedules
   - Service offerings
   - Social media links

2. **Visual Design**: 
   - Use provided logos in appropriate contexts (dark/light backgrounds)
   - Implement Fino font family for brand consistency
   - Follow styling guidelines in the `styling/` folder for brand consistency. Create 2 versions of the site using each style version to compare.
   - Reference event artwork for event page designs

3. **Media Implementation**:
   - Optimize images before use (many are high-resolution)
   - Consider creating multiple sizes for responsive design
   - Use appropriate images for different sections (e.g., empty venue shots for private hire, busy shots for regular events)

4. **Key Website Sections to Build**:
   - Homepage with venue overview
   - Events page (Regular events: Shhh!, La Fiesta, Nostalgia)
   - Private hire/booking section
   - Contact/location
   - Table booking system

5. **Important Details**:
   - Venue is 18+ only
   - Located at 50a Call Lane, Leeds LS1 6DT
   - Hidden under railway bridge (important for directions)
   - Different opening hours for different days/events
   - Multiple spaces available (full venue: 500, Upstairs - main bar & dance floor: 350, Downstairs - private room: 150)

### Asset Usage Notes

- The venue has a split-level design with upstairs and downstairs areas
- Different music styles play on different floors during events
- Table bookings include priority admission and waitress service
- Regular club nights run until 6am
- Private bookings Sunday-Thursday can run until 6am