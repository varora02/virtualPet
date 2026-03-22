# 🎮 Pet Evolution & Leveling System Spec

## Overview
Implement a progression system where the pet grows, levels up, and visually evolves as users care for it and accumulate experience.

## Core Mechanic: Experience & Levels

### Level Progression

| Level | XP Required | Unlocks | Appearance | Special |
|-------|------------|---------|------------|---------|
| 1 | 0 | - | Baby Ellie (small) | Starting form |
| 2 | 100 | - | Baby Ellie (slightly bigger) | - |
| 3 | 250 | - | Child Ellie | - |
| 4 | 450 | - | Child Ellie (bigger) | - |
| 5 | 700 | Kitchen room | Teen Ellie | First evolution |
| 6 | 1000 | - | Teen Ellie (bigger) | - |
| 7 | 1350 | Study room | Adolescent Ellie | - |
| 8 | 1750 | Bathroom | Adolescent Ellie (bigger) | - |
| 9 | 2200 | - | Young Adult Ellie | - |
| 10 | 2700 | Garden room | Adult Ellie (full size) | Major evolution |
| 15 | 5000 | Master Bedroom | Elder Ellie (wise) | Rare evolution |
| 20 | 8000 | Mythical Theme | Mythical Ellie (glowing) | Legendary evolution |

### Experience Points (XP)

#### From Activities
| Action | XP | Notes |
|--------|----|----|
| Feed pet | 5 | Can do multiple times per day |
| Water pet | 5 | Can do multiple times per day |
| Play with pet | 10 | Costs energy |
| Workout logged | 15 | Once per real-world workout |
| Pomodoro session | 20 | Per completed 25-min session |
| Daily check-in | 3 | First login of day |
| Pet trick | 5 | Per successful trick |

#### Multipliers
- **Both users active same day**: 1.2x XP multiplier for day
- **Consecutive days logged in**: 1.1x per 3-day streak (caps at 1.5x)
- **Pet health > 80%**: 1.1x XP multiplier
- **Happiness > 80%**: 1.1x XP multiplier

### Level Up Mechanics

When pet levels up:
1. Animation plays (sparkles, glow effect)
2. XP bar resets to 0
3. Display level-up popup
4. Play "level up" sound effect
5. Grant any room unlocks
6. Update pet appearance
7. Send notification to both users
8. Award 25 bonus coins
9. Pet gets happiness boost (+15)

## Evolution System

### Visual Evolution

#### Sprite Changes
Each level has 3-4 visual variants:

**Baby Ellie** (Levels 1-4)
- Very small, cartoonish
- Large eyes
- Playful animation
- High ears

**Teen Ellie** (Levels 5-6)
- Medium size
- Less cartoonish features
- More refined look
- Proportional ears

**Adolescent Ellie** (Levels 7-9)
- Larger size
- More realistic proportions
- Developing trunk control
- Confident posture

**Adult Ellie** (Levels 10-14)
- Full size
- Mature appearance
- Controlled movements
- Dignified posture

**Elder Ellie** (Level 15+)
- Largest size
- Wise appearance
- Gray coloring
- Slow, graceful animations

**Mythical Ellie** (Level 20+)
- Ethereal glow effect
- Sparkle particles
- Purple/blue coloring
- Magical animations
- Special movement patterns

### Database Schema

```javascript
petData = {
  id: "sharedPet",
  name: "Ellie",
  level: 5,
  currentXP: 150,
  xpToNextLevel: 700,
  progression: {
    totalXPEarned: 850,
    levels: [
      {
        level: 1,
        reachedAt: <timestamp>,
        unlockedRoom: null,
        specialReward: null
      },
      {
        level: 5,
        reachedAt: <timestamp>,
        unlockedRoom: "kitchen",
        specialReward: "first_evolution_badge"
      }
    ]
  },
  appearance: {
    stage: "teen", // baby, teen, adolescent, adult, elder, mythical
    variant: 2, // Visual variant (1-4)
    hasGlow: false,
    colors: {
      body: "#9B9B9B",
      ears: "#8B8B8B",
      tusk: "#FFFACD"
    }
  },
  achievements: {
    evolutions: [5, 10, 15, 20],
    highestLevel: 5
  }
}
```

### Room Unlock Rewards

When pet levels up and unlocks a room:

```javascript
{
  trigger: "levelUp",
  level: 5,
  room: "kitchen",
  cost: 100, // Automatic! Don't need to pay coins
  message: "🎉 Ellie reached Level 5! Kitchen unlocked!",
  bonus: {
    coins: 50,
    happiness: 15
  }
}
```

## Cosmetics & Customization

### Pet Outfits (Unlockable)

| Outfit | Unlock | Cost | Notes |
|--------|--------|------|-------|
| Default | Level 1 | Free | Starting look |
| Casual | Level 5 | 30 coins | T-shirt |
| Fancy | Level 10 | 50 coins | Tuxedo |
| Winter | Level 7 | 40 coins | Scarf & hat |
| Summer | Level 8 | 40 coins | Sunhat & shades |
| Halloween | Level 12 | 60 coins | Costume (seasonal) |
| Holiday | Level 14 | 60 coins | Holiday outfit (seasonal) |
| Mythical | Level 20 | 100 coins | Magical robes |

### Pet Accessories

| Accessory | Unlock | Cost |
|-----------|--------|------|
| Bow tie | Level 3 | 25 coins |
| Collar | Level 5 | 25 coins |
| Hat | Level 7 | 30 coins |
| Glasses | Level 9 | 35 coins |
| Crown | Level 15 | 75 coins |
| Halo | Level 20 | 100 coins |

## Tricks System

### Unlockable Tricks

When pet learns a trick:
1. Show learning animation
2. Trick becomes available
3. Can use by clicking "Tricks" button
4. Each use costs energy (10-30)
5. Gains XP on successful use

| Trick | Unlock Level | Energy | XP | Special |
|-------|--------------|--------|----|----|
| Sit | 5 | 10 | 5 | Simple animation |
| Spin | 10 | 15 | 8 | Full rotation |
| Trumpet | 15 | 20 | 10 | Makes sound |
| Dance | 20 | 25 | 15 | Extended animation |
| Bow | 12 | 15 | 7 | Shows respect |
| Wave | 8 | 12 | 6 | Friendly gesture |

### Trick Performance

```javascript
performTrick(trickId) {
  // Check if pet has energy
  if (petData.energy < trick.energyCost) {
    return { success: false, reason: "notEnoughEnergy" };
  }

  // Reduce energy
  petData.energy -= trick.energyCost;

  // 85% success rate (higher with good mood)
  const successChance = 0.85 * (petData.happiness / 100);
  const success = Math.random() < successChance;

  if (success) {
    gainXP(trick.xp);
    gainHappiness(5);
    playAnimation(trick.animation);
    playSound(trick.sound);
  } else {
    playAnimation("fail");
    console.log("Ellie tried but failed...");
  }

  return { success, animation: trick.animation };
}
```

## Achievements & Badges

### Achievement Types

| Achievement | Trigger | Reward |
|-------------|---------|--------|
| First Level Up | Reach Level 2 | Badge + 10 coins |
| Evolution | Reach Level 5 | Badge + 25 coins |
| Leveler | Reach Level 10 | Badge + 50 coins |
| Mythical | Reach Level 20 | Badge + 100 coins + Special outfit |
| Daily Duo | Both users log in 7 days straight | Badge + 100 coins each |
| Trick Master | Learn all tricks | Badge + 50 coins |
| Pet Parent | Level pet to 10 | Badge + 75 coins |

### Badge Display
- Show badges on pet profile
- Display in house (wall of fame)
- Include in user stats

## Frontend Components

### LevelUpModal
```jsx
<LevelUpModal
  previousLevel={4}
  newLevel={5}
  rewards={{
    coins: 25,
    room: "Kitchen",
    happiness: 15
  }}
/>
```

### EvolutionAnimation
```jsx
<EvolutionAnimation
  oldStage="teen"
  newStage="adolescent"
  duration={2000}
/>
```

### TricksPanel
```jsx
<TricksPanel
  tricks={[
    { id: "sit", unlocked: true, available: true },
    { id: "spin", unlocked: false, unlocksAt: 10 }
  ]}
  onPerformTrick={(trickId) => {}}
/>
```

### ProgressionStats
```jsx
<ProgressionStats
  level={5}
  currentXP={150}
  xpToNextLevel={700}
  totalXPEarned={850}
  nextLevelUnlock="Kitchen Room"
/>
```

## Progression Display

### XP Bar
```
Level 5 ████░░░░░░ 150/700 XP
        [████████░░░░] 21%
```

### Pet Level Badge
```
╔══════════╗
║    Lvl   ║
║     5    ║
╚══════════╝
```

### Roadmap to Next Evolution
```
Current: Teen Ellie (Level 5)
Next Evolution: Adolescent (Level 7)
Progress: 150 XP / 500 XP needed
```

## Implementation Plan

### Phase 1: Basic Leveling (Week 1-2)
- XP system
- Level progression
- XP bar display
- Database schema

### Phase 2: Visual Evolution (Week 3)
- Sprite variants for each stage
- Evolution animations
- Appearance switching
- Animation testing

### Phase 3: Unlocks & Rewards (Week 4)
- Room unlocking
- Coin rewards
- Achievement system
- Badge display

### Phase 4: Tricks & Cosmetics (Week 5)
- Trick learning & performance
- Outfit system
- Accessory customization
- Polish animations

## Success Metrics

- Average pet level after 2 weeks: 5+
- Users performing tricks: 70%+
- Outfit customization usage: 60%+
- Daily XP gain: 50+ per user
- Level distribution: Healthy spread (not everyone maxed quickly)

## Edge Cases & Validation

- Don't allow level-up spam (validate XP server-side)
- Prevent trick use without energy
- Outfit changes persist across sessions
- Multiple evolutions in quick succession handled smoothly
- Offline XP accumulation with sync on login
