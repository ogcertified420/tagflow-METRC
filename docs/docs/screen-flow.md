# Screen Flow

## 1. Rooms List Screen
Purpose:
Show all rooms available to the user.

Visible elements:
- Screen title: Rooms
- List of room cards
- Room name
- Occupied count
- Total slot count
- Add Room button

User actions:
- Tap room card -> open Room Map Screen
- Tap Add Room -> open Add Room form

---

## 2. Room Map Screen
Purpose:
Show a visual grid of slots for one room.

Visible elements:
- Back button
- Room name
- Refresh button
- Scan Tag button
- Add Plant button
- Grid of slots

Slot display:
- Empty slot: plus icon or "Empty"
- Occupied slot: tag number
- Optional strain label
- Optional state indicator

User actions:
- Tap empty slot -> open Add Plant Modal
- Tap occupied slot -> open Plant Action Menu
- Tap Refresh -> reload room data
- Tap Back -> return to Rooms List

---

## 3. Add Plant Modal
Purpose:
Create a plant and place it into an empty slot.

Visible fields:
- Tag number
- Strain name
- Room name
- Slot label

Buttons:
- Save
- Cancel

Validation:
- Tag number required
- Slot must be empty
- Tag number must be unique

User actions:
- Tap Save -> create plant, assign to slot, close modal, refresh room map
- Tap Cancel -> close modal

---

## 4. Plant Action Menu
Purpose:
Show actions for an occupied slot.

Visible fields:
- Tag number
- Strain name
- Status
- Slot label

Buttons:
- Move
- Harvest
- Destroy
- Details
- Cancel

User actions:
- Tap Move -> open Move Plant Modal
- Tap Harvest -> open Harvest Confirm Modal
- Tap Destroy -> open Destroy Confirm Modal
- Tap Details -> open Plant Detail Modal
- Tap Cancel -> close menu

---

## 5. Move Plant Modal
Purpose:
Move plant from one slot to another.

Visible fields:
- Current room
- Current slot
- Destination room
- Destination slot

Buttons:
- Confirm Move
- Cancel

Validation:
- Destination slot must be empty

User actions:
- Tap Confirm Move -> update plant room_id and slot_id, clear old slot, fill new slot, refresh room map
- Tap Cancel -> close modal

---

## 6. Harvest Confirm Modal
Purpose:
Confirm harvest action.

Visible fields:
- Tag number
- Slot label
- Optional notes

Buttons:
- Confirm Harvest
- Cancel

User actions:
- Tap Confirm Harvest -> set plant status to harvested, clear slot, refresh room map
- Tap Cancel -> close modal

---

## 7. Destroy Confirm Modal
Purpose:
Confirm destroy action.

Visible fields:
- Tag number
- Slot label
- Reason
- Optional notes

Buttons:
- Confirm Destroy
- Cancel

User actions:
- Tap Confirm Destroy -> set plant status to destroyed, clear slot, refresh room map
- Tap Cancel -> close modal

---

## 8. Plant Detail Modal
Purpose:
Show plant information without changing it.

Visible fields:
- Plant ID
- Tag number
- Strain name
- Status
- Room
- Slot
- Created at
- Updated at

Buttons:
- Close
