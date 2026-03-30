# API Actions

## GET /rooms
Return all rooms

## GET /rooms/:id/slots
Return all slots for a room

## GET /plants/:id
Return one plant

## POST /plants
Create a plant and assign to slot

Request body:
- tag_number
- strain_name
- room_id
- slot_id

## POST /plants/:id/move
Move plant to another slot

Request body:
- destination_room_id
- destination_slot_id

## POST /plants/:id/harvest
Harvest a plant

Request body:
- harvested_at
- notes

## POST /plants/:id/destroy
Destroy a plant

Request body:
- destroyed_at
- reason
- notes
