# Room Map Data Model

## Purpose
Define how a grow room is represented as a grid of plant slots.

## Core Concept
A room contains slots.
Each slot has a row and column.
A slot may be empty or contain one plant.

## Entities

### Room
Fields:
- id
- name
- facility_id
- total_rows
- total_columns
- created_at

Example:
- id: 1
- name: Flower Room A
- total_rows: 3
- total_columns: 4

### Slot
Fields:
- id
- room_id
- row
- column
- slot_label
- status
- plant_id

Status values:
- empty
- occupied
- harvested
- destroyed

Example:
- id: 101
- room_id: 1
- row: 1
- column: 1
- slot_label: A1
- status: occupied
- plant_id: 5001

### Plant
Fields:
- id
- tag_number
- strain_name
- status
- room_id
- slot_id
- created_at
- updated_at

Plant status values:
- active
- harvested
- destroyed

Example:
- id: 5001
- tag_number: 1A4060300002191000001234
- strain_name: Diesel Cake #3
- status: active
- room_id: 1
- slot_id: 101

## Grid Rules
- Each room has a fixed number of rows and columns
- Each slot must be unique by room_id + row + column
- One slot can hold only one plant
- One plant can occupy only one slot at a time

## Slot Labels
Use grid labels like:
- Row 1, Column 1 = A1
- Row 1, Column 2 = A2
- Row 2, Column 1 = B1
- Row 3, Column 4 = C4

## Example Room Grid
[ A1 ] [ A2 ] [ A3 ] [ A4 ]
[ B1 ] [ B2 ] [ B3 ] [ B4 ]
[ C1 ] [ C2 ] [ C3 ] [ C4 ]

## User Actions and Data Changes

### Add Plant
User taps empty slot.
System creates plant record.
System assigns plant_id to slot.
Slot status becomes occupied.

### Move Plant
User selects occupied slot and taps Move.
System clears old slot plant_id.
System sets new slot plant_id.
Plant room_id and slot_id are updated.

### Harvest Plant
User selects occupied slot and taps Harvest.
Plant status becomes harvested.
Slot status becomes harvested or empty based on business rule.

### Destroy Plant
User selects occupied slot and taps Destroy.
Plant status becomes destroyed.
Slot status becomes destroyed or empty based on business rule.

## Recommended Business Rule for MVP
After harvest or destroy:
- update plant status
- clear the slot
- set slot status back to empty

This keeps the grid simple for first version.
