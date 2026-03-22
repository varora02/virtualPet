# 💰 Coins & Upgrade System Spec

## Overview
Implement an in-game economy where users earn coins through activities and spend them on upgrades, cosmetics, and room unlocks.

## Earning Coins

### Activity-Based Earnings

| Activity | Coins | Notes | Frequency |
|----------|-------|-------|-----------|
| Pomodoro Session | 10 | Per completed 25-min | Multiple/day |
| Workout Logged | 15 | Per real-world workout | 1-2/day |
| Daily Login | 5 | First login of day | 1/day |
| Level Up | 25 | One-time per level | Weekly |
| Milestone (10 levels) | 100 | Bonus at specific levels | Rare |
| Complete Challenge | 50-100 | Weekly couple challenges | Weekly |
| Unlock Achievement | 10-50 | Various achievements | Ongoing |

### Bonus Multipliers

#### Couple Bonuses
- **Both work out same day**: +5 coins each (10 total bonus)
- **Both complete Pomodoro same hour**: +3 coins to pet's "energy fund"
- **Synchronized actions** (feed within 5 min): +2 bonus coins
- **Both log in within 1 hour**: +5 coins shared

#### Consistency Bonuses
- **3-day login streak**: 1.1x coin multiplier that day
- **7-day login streak**: 1.2x coin multiplier that day
- **30-day streak**: Special badge + 50 coin bonus

#### Health Bonuses
- **Pet health > 80%**: 1.1x multiplier on earned coins
- **Pet happiness > 80%**: 1.1x multiplier on earned coins

### Example Daily Earnings
```
Monday Activity Log:
- Morning Pomodoro (25 min): 10 coins
- Afternoon Pomodoro (25 min): 10 coins
- Evening Workout: 15 coins
- Daily Login: 5 coins
- Both users worked out: +10 bonus coins
Subtotal: 50 coins

Multipliers:
- 5-day streak: 1.2x
- Pet health 90%: 1.1x
- Total multiplier: 1.32x

Daily Total: 66 coins
```

## Spending Coins

### Shop Categories

#### 1. Furniture & Decorations

**Bedroom**
```
- Basic Lamp: 20 coins
- Nightstand: 25 coins
- Dresser: 35 coins
- Plant (small): 15 coins
- Plant (large): 25 coins
- Rug: 30 coins
- Painting: 40 coins
- Mirror: 25 coins
- Bookshelf: 45 coins
- Lamp (fancy): 35 coins
```

**Kitchen**
```
- Refrigerator: 40 coins
- Counter: 50 coins
- Stove: 45 coins
- Food Bowl: 10 coins
- Sink: 35 coins
- Table: 55 coins
- Chairs (set): 40 coins
- Cupboard: 50 coins
- Plant: 15 coins
```

**Garden**
```
- Swing: 60 coins
- Slide: 70 coins
- Sandbox: 50 coins
- Flowers (set): 20 coins
- Rocks (set): 15 coins
- Path: 25 coins
- Bench: 35 coins
- Tree: 40 coins
- Fountain: 75 coins
- Fence (upgrade): 30 coins
```

**Study**
```
- Desk: 45 coins
- Chair: 30 coins
- Bookshelf: 45 coins
- Lamp: 20 coins
- Plant: 15 coins
- Whiteboard: 30 coins
- Clock: 25 coins
- Photo Frame: 20 coins
- Keyboard: 40 coins
```

#### 2. Pet Cosmetics

**Outfits**
```
- Casual Shirt: 30 coins
- Fancy Tuxedo: 50 coins
- Winter Outfit: 40 coins
- Summer Hat Set: 40 coins
- Halloween Costume: 60 coins (seasonal)
- Holiday Outfit: 60 coins (seasonal)
```

**Accessories**
```
- Bow Tie: 25 coins
- Collar: 25 coins
- Party Hat: 30 coins
- Sunglasses: 35 coins
- Crown: 75 coins (luxury)
- Halo: 100 coins (legendary)
```

**Color Variants** (Recolor the pet)
```
- Pink Ellie: 50 coins
- Blue Ellie: 50 coins
- Golden Ellie: 75 coins
- Rainbow Ellie: 100 coins (seasonal)
```

#### 3. Room Unlocks

```
- Kitchen: 100 coins
- Study Room: 120 coins
- Garden: 150 coins
- Bathroom: 80 coins
- Master Bedroom: 100 coins
```

#### 4. Special Items

**Pet Food**
```
- Gourmet Apple: 10 coins (special food)
- Premium Hay: 15 coins
- Royal Treat: 20 coins
- Golden Banana: 50 coins (rare)
```

**Pet Toys**
```
- Ball: 25 coins
- Toy Elephant: 40 coins
- Music Box: 50 coins
- Luxury Toy Set: 75 coins
```

**Themes & Cosmetics**
```
- Room Theme Pack: 30 coins
- Sound Effect Pack: 20 coins (enable sounds)
- Particle Effect: 25 coins
- Photo Filter: 20 coins
```

**Limited Time Items** (Seasonal/Event)
```
- Valentine's Decoration: 50 coins (Feb)
- Summer Splash Outfit: 60 coins (June-Aug)
- Halloween Special: 80 coins (Oct)
- Holiday Bundle: 100 coins (Dec)
```

## Coin Management UI

### Coin Display

```
┌─────────────────────┐
│ Coins: 500 🪙       │
│ Available: 500      │
│ Spent: 150          │
│ Total Earned: 650   │
└─────────────────────┘
```

### Shop Interface

```
┌───────────────────────────────────────┐
│ 🏪 Coin Shop                          │
├───────────────────────────────────────┤
│ Your Balance: 500 🪙                  │
├───────────────────────────────────────┤
│ Categories:                           │
│ [All] [Furniture] [Pet] [Rooms]      │
│ [Food] [Toys] [Limited Time]          │
├───────────────────────────────────────┤
│                                       │
│ 💡 Lamp                    20 🪙     │
│ Add warmth to any room     [Buy]     │
│                                       │
│ 🪴 Plant (Large)           25 🪙     │
│ Decorative & pretty         [Buy]     │
│                                       │
│ 👔 Fancy Tuxedo            50 🪙     │
│ Make Ellie look classy     [Buy]     │
│ ⭐ (Limited Time - 3 days left)      │
│                                       │
│ 🍎 Gourmet Apple           10 🪙     │
│ Special treat for pet       [Buy]     │
│                                       │
└───────────────────────────────────────┘
```

### Purchase Confirmation

```
┌──────────────────────────────┐
│ Buy Fancy Tuxedo?            │
├──────────────────────────────┤
│                              │
│ Price: 50 🪙                 │
│ Your Balance: 500 🪙         │
│ After Purchase: 450 🪙       │
│                              │
│ [Confirm] [Cancel]           │
│                              │
└──────────────────────────────┘
```

### Insufficient Coins

```
┌──────────────────────────────┐
│ ❌ Insufficient Coins        │
├──────────────────────────────┤
│                              │
│ Fancy Tuxedo: 50 🪙         │
│ Your Balance: 35 🪙         │
│ You need 15 more coins       │
│                              │
│ 💡 Tip: Complete more       │
│ Pomodoros to earn coins!     │
│                              │
│ [OK]                        │
│                              │
└──────────────────────────────┘
```

## Database Schema

```javascript
// Users collection
users/
  user1@email.com/
    coins: {
      balance: 500,
      totalEarned: 1200,
      totalSpent: 700,
      lastEarnedAt: <timestamp>,
      history: [
        {
          type: "earn",
          amount: 10,
          source: "pomodoro",
          timestamp: <timestamp>
        },
        {
          type: "spend",
          amount: 50,
          item: "tuxedo",
          timestamp: <timestamp>
        }
      ]
    }

// Purchases collection (for inventory)
purchases/
  user1@email.com/
    furniture: {
      lamp_001: { quantity: 3, purchasedAt: <timestamp> },
      plant_large: { quantity: 1, purchasedAt: <timestamp> }
    },
    cosmetics: {
      tuxedo: { owned: true, equipped: true, purchasedAt: <timestamp> },
      bow_tie: { owned: true, equipped: false, purchasedAt: <timestamp> }
    },
    food: {
      gourmet_apple: { quantity: 5, purchasedAt: <timestamp> }
    }

// Transactions (audit log)
transactions/
  {unique_id}:
    userId: "user1@email.com",
    type: "earn" | "spend",
    amount: 10,
    source: "pomodoro" | "item_purchase",
    itemId: "tuxedo" | null,
    timestamp: <timestamp>,
    balanceBefore: 500,
    balanceAfter: 510,
    verified: true
```

## Spending Patterns & Analytics

### Track User Spending

```javascript
coinStats = {
  totalEarned: 1200,
  totalSpent: 700,
  balance: 500,
  spendingByCategory: {
    furniture: 200,
    cosmetics: 250,
    food: 50,
    roomUnlocks: 200
  },
  topPurchases: [
    { item: "Tuxedo", cost: 50, bought: 1 },
    { item: "Lamp", cost: 20, bought: 3 },
    { item: "Garden Swing", cost: 60, bought: 1 }
  ],
  earningBySource: {
    pomodoro: 400,
    workout: 300,
    daily_login: 100,
    level_up: 100,
    challenges: 300
  }
}
```

### Display Stats

```
┌────────────────────────────┐
│ 💰 Coin Statistics         │
├────────────────────────────┤
│                            │
│ Total Earned: 1,200 🪙    │
│ Total Spent: 700 🪙       │
│ Current Balance: 500 🪙    │
│                            │
│ Top Category (spent):      │
│ Cosmetics: 250 🪙         │
│                            │
│ Top Earner:                │
│ Pomodoro Sessions: 400 🪙 │
│                            │
└────────────────────────────┘
```

## Anti-Cheating Measures

### Server-Side Validation
```javascript
// NEVER trust client calculations
purchaseItem(userId, itemId) {
  // 1. Get current balance from database
  const user = await getUser(userId);
  const currentBalance = user.coins.balance;

  // 2. Verify item exists and get price
  const item = await getItem(itemId);
  if (!item) throw new Error("Item not found");

  // 3. Check sufficient balance
  if (currentBalance < item.price) {
    throw new Error("Insufficient coins");
  }

  // 4. Deduct coins
  await updateUserCoins(userId, currentBalance - item.price);

  // 5. Record transaction in audit log
  await recordTransaction(userId, "spend", item.price, itemId);

  // 6. Add item to inventory
  await addToInventory(userId, itemId);

  return { success: true, newBalance: currentBalance - item.price };
}
```

### Prevent Exploits
- Don't calculate balance on client
- Verify all transactions server-side
- Log all coin operations for audit
- Rate-limit earning (max coins per day)
- Detect suspicious patterns (sudden spike in coins)

## Progression Gates

### Spending Requirements
Some items locked until certain conditions:
- Luxury items: Pet must be Level 10+
- Seasonal items: Only available during season
- Special outfits: Must own base outfit first
- Limited edition: Only 100 purchases allowed

### Earning Limits
```javascript
// Prevent infinite coin farming
dailyEarningCaps = {
  pomodoro: 200, // Max 20 sessions/day
  workout: 150, // Max 10 workouts/day
  login: 5, // Once per day
  challenges: 200 // Weekly cap
}
```

## Future Monetization (Optional)

If adding real-money purchases:
- Premium cosmetics (cost USD, not coins)
- Coin packs for real money
- Battle pass system
- Keep core gameplay free (cosmetics only)

## Success Metrics

- Average coin balance: 200+ (healthy hoarders)
- Items owned per user: 15+ (engagement)
- Daily earnings: 50+ coins (active participation)
- Purchase frequency: 2-3 items per week
- Coin usage: 50%+ of earned (spend encouragement)

## Implementation Checklist

- [ ] Coin database schema
- [ ] Earning system (XP → coins)
- [ ] Shop UI component
- [ ] Purchase validation
- [ ] Inventory management
- [ ] Transaction logging
- [ ] Analytics dashboard
- [ ] Anti-cheat measures
- [ ] Balance testing
- [ ] Coin reset system (for testing)
