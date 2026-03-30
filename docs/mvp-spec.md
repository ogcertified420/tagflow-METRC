# TagFlow MVP Spec

## Product Goal
TagFlow is a mobile-first grow room mapping app for cannabis operators. It lets a user view a room as a visual grid of plant slots, tap a plant, and perform actions like move, harvest, or destroy.

## MVP Scope
The first version will support:
- View rooms
- Open a room map
- See occupied and empty plant slots
- Tap a slot to view plant details
- Perform plant actions
- Save changes to the database

## Core Screens

### 1. Rooms List Screen
Purpose:
- Show all rooms in a facility

Fields:
- room_id
- room_name
- slot_count
- occupied_count

Buttons:
- Open Room
- Add Room

### 2. Room Map Screen
Purpose:
- Show a top-down grid of plant slots

Slot states:
- Empty
- Occupied
- Harvested
- Destroyed

Visible per slot:
- Tag number
- Strain name optional
- Color or icon by state

Buttons:
- Back
- Refresh
- Add Plant
- Scan Tag

Tap behavior:
- Tap empty slot -> show Add Plant
- Tap occupied slot -> show Plant Action Menu

### 3. Plant Detail / Action Modal
Purpose:
- View a plant and perform actions

Fields:
- plant_id
- tag_number
- strain_name
- status
- room_id
- slot_id
- row
- column

Buttons:
- Move
- Harvest
- Destroy
- Close

### 4. Move Plant Screen / Modal
Purpose:
- Move a plant from one slot to another

Fields:
- source_room
- source_row
- source_column
- destination_room
- destination_row
- destination_column

Buttons:
- Confirm Move
- Cancel

## Database Tables

### rooms
- id
- name
- created_at

### slots
- id
- room_id
- row
- column
- plant_id
- created_at

### plants
- id
- tag_number
- strain_name
- status
- room_id
- slot_id
- created_at
- updated_at

## MVP Plant Status Values
- active
- harvested
- destroyed

## User Flow
1. User opens app
2. User selects room
3. User sees room map
4. User taps a plant
5. User selects action
6. App updates database
7. Room map refreshes

## API Endpoints

### GET /rooms
Returns all rooms

### GET /rooms/:id/slots
Returns all slots for a room

### GET /plants/:id
Returns plant details

### POST /plants
Creates a new plant

### POST /plants/:id/move
Moves a plant to another slot

### POST /plants/:id/harvest
Marks a plant as harvested

### POST /plants/:id/destroy
Marks a plant as destroyed

## Technical Stack
- Frontend: React Native with Expo
- Backend: Supabase
- Database: Postgres
- Repo: GitHub

## Out of Scope for MVP
- Full METRC API integration
- RFID hardware integration
- User roles and permissions
- Analytics dashboard
- Notifications