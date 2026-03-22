# 🏠 House Customization Feature Spec

## Overview
Allow users to customize their pet's living space by unlocking new rooms and purchasing furniture/decorations.

## User Stories

### US1: View Pet's House
**As a** user  
**I want to** see my pet's house with different rooms  
**So that** I can explore and customize the living space

**Acceptance Criteria:**
- Can view current house with all unlocked rooms
- Rooms display with themed background
- Furniture/decorations are visible in each room
- Can navigate between rooms
- See list of locked rooms (with unlock requirements)

### US2: Unlock New Rooms
**As a** user  
**I want to** unlock new rooms by reaching pet level milestones  
**So that** I have more spaces to customize

**Acceptance Criteria:**
- Rooms unlock based on pet level
- Display unlock requirement clearly
- Show "Level X Required" for locked rooms
- Once unlocked, room is permanently available
- Can switch to newly unlocked room immediately

### US3: Purchase Furniture
**As a** user  
**I want to** buy furniture items using coins  
**So that** I can customize the pet's living space

**Acceptance Criteria:**
- See available furniture in shop
- Know cost of each item
- Purchase with coins if have enough
- Item appears in room after purchase
- Coin balance updates immediately
- Can't purchase if insufficient coins (show warning)

### US4: Place Furniture
**As a** user  
**I want to** place furniture items in specific locations in a room  
**So that** I can arrange the space how I like

**Acceptance Criteria:**
- Drag-and-drop or click-to-place interface
- Furniture snaps to grid
- Can move furniture to different locations
- Can remove furniture (goes back to storage)
- Changes persist after closing app

### US5: Change Room Themes
**As a** user  
**I want to** change the wallpaper/theme of a room  
**So that** rooms feel personalized

**Acceptance Criteria:**
- See theme options for each room
- Themes have different colors/styles
- Can switch themes freely (or for small cost)
- Preview theme before applying
- Theme applies to entire room

## Room Definitions

### Bedroom (Starting Room)
| Property | Value |
|----------|-------|
| Unlocked At | Start |
| Purpose | Pet sleeping/rest |
| Themes | Cozy, Modern, Minimalist, Luxury |
| Base Furniture | Bed, Nightstand |
| Available Items | Lamp, Plant, Rug, Painting, Mirror |

### Kitchen
| Property | Value |
|----------|-------|
| Unlocked At | Level 5 |
| Cost | 100 coins |
| Purpose | Feeding location |
| Themes | Rustic, Modern, Colorful, Elegant |
| Base Furniture | Table, Chairs |
| Available Items | Fridge, Counter, Stove, Food Bowl, Decorations |

### Garden/Outdoor
| Property | Value |
|----------|-------|
| Unlocked At | Level 10 |
| Cost | 150 coins |
| Purpose | Playing/exercising |
| Themes | Natural, Zen, Playful, Fantasy |
| Base Furniture | Grass, Trees, Fence |
| Available Items | Swing, Slide, Sandbox, Flowers, Rocks, Path |

### Study Room
| Property | Value |
|----------|-------|
| Unlocked At | Level 7 |
| Cost | 120 coins |
| Purpose | Pomodoro/focus space |
| Themes | Academic, Cozy, Modern, Inspiring |
| Base Furniture | Desk, Chair, Bookshelf |
| Available Items | Lamp, Plant, Whiteboard, Clock, Photos, Keyboard |

### Master Bedroom
| Property | Value |
|----------|-------|
| Unlocked At | Level 15 |
| Cost | 100 coins |
| Purpose | Luxury rest space |
| Themes | Luxury, Romantic, Modern, Nature |
| Base Furniture | King Bed, Nightstands |
| Available Items | Chandelier, Fireplace, Artwork, Ottoman, Curtains |

### Bathroom
| Property | Value |
|----------|-------|
| Unlocked At | Level 8 |
| Cost | 80 coins |
| Purpose | Hygiene/cleanliness |
| Themes | Spa, Modern, Minimalist, Playful |
| Base Furniture | Bathtub, Sink, Mirror |
| Available Items | Toilet, Towel Rack, Shower, Candles, Plants, Rug |

## Furniture Catalog

### Bedroom Furniture
- **Bed** (Starting, Free)
- Nightstand (25 coins)
- Dresser (35 coins)
- Lamp (20 coins)
- Plant (15 coins)
- Rug (30 coins)
- Painting (40 coins)
- Mirror (25 coins)

### Kitchen Furniture
- **Table** (Starting, Free)
- **Chairs** (Starting, Free)
- Refrigerator (40 coins)
- Counter (50 coins)
- Stove (45 coins)
- Food Bowl (10 coins)
- Plant (15 coins)
- Painting (30 coins)

### Garden Items
- **Grass** (Starting, Free)
- **Trees** (Starting, Free)
- **Fence** (Starting, Free)
- Swing (60 coins)
- Slide (70 coins)
- Sandbox (50 coins)
- Flowers (20 coins)
- Rocks (15 coins)
- Path (25 coins)
- Bench (35 coins)

### Study Room Furniture
- **Desk** (Starting, Free)
- **Chair** (Starting, Free)
- **Bookshelf** (Starting, Free)
- Lamp (20 coins)
- Plant (15 coins)
- Whiteboard (30 coins)
- Clock (25 coins)
- Photos (20 coins)
- Keyboard (40 coins)

## Database Schema

```javascript
// House collection
houses/
  shared/  // One house per user pair
    rooms/
      bedroom/
        name: "Bedroom"
        unlocked: true
        theme: "cozy"
        unlockedAt: <timestamp>
        furniture: [
          { id: "bed_001", type: "bed", x: 100, y: 200 },
          { id: "lamp_001", type: "lamp", x: 200, y: 150 }
        ]
      kitchen/
        name: "Kitchen"
        unlocked: false
        unlockedAt: null
        requirement: "level >= 5"
        cost: 100
        furniture: []
      ...
    
    inventory/
      // Furniture user owns but hasn't placed
      bed_002: 1
      lamp_002: 3
      plant_001: 2
    
    stats/
      totalSpent: 500
      roomsUnlocked: 3
      furniseTotal: 15
```

## UI Mockup

```
┌─────────────────────────────────────────┐
│  🐘 Ellie's House                       │
├─────────────────────────────────────────┤
│                                         │
│  [Bedroom] [Kitchen] [Garden] [Study]  │
│  [Master] [Bathroom] [Locked?]          │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│   ┌──────────────────────────────────┐  │
│   │                                  │  │
│   │     🛏️  🪴  🖼️                     │  │
│   │                                  │  │
│   │              🐘                  │  │
│   │                                  │  │
│   │  💡                              │  │
│   └──────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│ [Shop] [Themes] [Inventory] [Move]     │
└─────────────────────────────────────────┘
```

## Shop Interface

```
┌──────────────────────────────┐
│  🏪 Furniture Shop           │
├──────────────────────────────┤
│ Coins: 500 🪙                │
├──────────────────────────────┤
│ Categories:                  │
│ [All] [Bedroom] [Kitchen]   │
│ [Garden] [Study] [Bathroom] │
├──────────────────────────────┤
│                              │
│ Lamp          20 🪙          │
│ 💡 [Buy]                    │
│                              │
│ Plant         15 🪙          │
│ 🪴 [Buy]                    │
│                              │
│ Painting      40 🪙          │
│ 🖼️ [Buy]                     │
│                              │
│ Rug           30 🪙          │
│ [Buy]                       │
│                              │
└──────────────────────────────┘
```

## Implementation Notes

### Frontend Components
- `HouseView.jsx` - Main house display
- `RoomRenderer.jsx` - Render individual room
- `FurnitureShop.jsx` - Shop interface
- `FurniturePlacement.jsx` - Drag & drop
- `RoomThemePicker.jsx` - Theme selector
- `InventoryPanel.jsx` - Owned furniture

### Key Functions
- `purchaseFurniture(furnitureId)` - Buy item
- `placeFurniture(furnitureId, roomId, x, y)` - Place in room
- `unlockRoom(roomId)` - Unlock new room
- `changeTheme(roomId, themeId)` - Change room theme
- `removeFurniture(roomId, furnitureId)` - Remove from room

### Backend/Firebase
- New collection: `houses`
- Update `pets` with `unlockedRooms` array
- Track coin usage in `users` collection
- Validate purchases server-side (prevent cheating)

## Success Metrics
- Users visit house view at least 3x per week
- Average room customization: 50%+ of available slots filled
- Coins spent: 50+ per week (shows engagement)
- Theme changes: 1+ per week (shows creativity)

## Edge Cases
- User purchases same furniture twice → Can place multiple
- User removes furniture → Returns to inventory
- User changes theme while in room → Smooth transition
- User tries to purchase without coins → Show error
- Pet still displays over furniture → Z-index handling
- Room view on mobile → Responsive scaling
