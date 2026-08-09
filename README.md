# BYDRRM RiverWatch

Bulacan river and bridge water-level monitoring dashboard and Posting Studio.

## Current deployment
This repository is prepared as an installable GitHub Pages PWA.

### V1 capabilities
- 19 PDRRMO-documented Bulacan monitoring points
- map-based monitoring dashboard
- verified/manual water-level observations
- rate-of-rise calculation from consecutive readings
- NORMAL / WATCH / ALARM / CRITICAL / NO DATA status display
- BYDRRM Posting Studio for Facebook post and Story advisories
- PNG advisory export and auto-caption
- local browser persistence
- clear separation of demo/manual/official data

### Live data
The public GitHub Pages build is the frontend only. It must not invent live readings. The approved DOST-ASTI/PAGASA/PDRRMO connector will be added through a separately hosted backend/API when credentials or an approved data-sharing route are available.

### Safety
RiverWatch is for situational awareness. Water-level data do not establish structural bridge safety. Official thresholds and government advisories take precedence.
