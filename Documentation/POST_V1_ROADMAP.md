# 🐘 Virtual Pet - Post V1 Roadmap

## Overview
This document outlines all the features and enhancements planned for versions 2.0 and beyond, after the core MVP (V1) is complete and deployed.

---

# 📋 Table of Contents
1. [House Customization](#house-customization)
2. [Pet Evolution & Leveling](#pet-evolution--leveling)
3. [Coins & Upgrade System](#coins--upgrade-system)
4. [Real-World Data Integration](#real-world-data-integration)
5. [Enhanced Pet Mechanics](#enhanced-pet-mechanics)
6. [Social & Collaboration](#social--collaboration)
7. [Polish & Quality](#polish--quality)
8. [Timeline & Priorities](#timeline--priorities)

---

# House Customization

## Vision
Transform the pet's living space from a single room into a multi-room house that both users can customize together.

## Features

### Multiple Rooms
- **Starting Room**: Simple cozy bedroom (included in V1)
- **Living Room**: For playing games and activities
- **Kitchen**: Where the pet eats
- **Garden/Outdoor**: Where pet exercises
- **Master Bedroom**: Sleeping area (ties to sleep tracking)
- **Bathroom**: Hygiene stat management
- **Study Room**: Pomodoro-focused environment

### Room Unlocking System
- Unlock new rooms by reaching certain pet levels
- Example: Level 5 → Unlock Kitchen, Level 10 → Unlock Garden
- Each unlock costs coins (50-200 coins)

### Customization Options
- **Wallpapers/Themes**: Change room aesthetics
- **Furniture**: Buy and place furniture items
- **Lighting**: Different lighting options
- **Color Schemes**: Personalize room colors
- **Decorations**: Plants, paintings, rugs, etc.

### Implementation
```
Database Structure:
rooms/
├── bedroom/
│   ├── unlocked: true
│   ├── theme: "cozy"
│   ├── furniture: ["bed", "lamp"]
│   └── decorations: {...}
├── kitchen/
│   ├── unlocked: false
│   └── ...
└── ...

coins/
├── totalEarned: 500
├── spent: 100
└── available: 400
```

---

# Pet Evolution & Leveling

## Vision
Give the pet a growth arc. As users care for it and reach milestones, the pet evolves and changes appearance.

## Leveling System

### Level Milestones
| Level | Requirement | Reward |
|-------|-------------|--------|
| 1 | Starting | Ellie (baby elephant) |
| 5 | 50 total feed actions | Teen Ellie (slightly larger) |
| 10 | 100 total actions | Adult Ellie (full size) |
| 15 | 5 days of consistent care | Elder Ellie (wise appearance) |
| 20 | 10 pomodoro sessions + 50 workouts | Mythical Ellie (sparkles, glow) |

### Experience System
- **Feed**: +5 XP
- **Water**: +5 XP
- **Play**: +10 XP
- **Workout**: +15 XP
- **Pomodoro Session**: +20 XP
- **Daily Check-in**: +3 XP (bonus for logging in)

### Evolution Mechanics
```javascript
// Pseudo-code
if (xpTotal >= nextLevelThreshold) {
  levelUp();
  // Show evolution animation
  // Update pet appearance/sprite
  // Grant unlock rewards
}
```

### Evolution Rewards
- Level 5: Unlock Kitchen
- Level 10: Unlock Garden
- Level 15: Unlock Elder Costume
- Level 20: Unlock Mythical Theme + Special Abilities

---

# Coins & Upgrade System

## Vision
Create an economy where activities earn coins, and coins unlock customizations and upgrades.

## Coin Earning
| Activity | Coins | Notes |
|----------|-------|-------|
| Pomodoro Session | 10 | Per completed 25-min session |
| Workout Logged | 15 | Per workout activity |
| Daily Check-in Bonus | 5 | First login of the day |
| Pet Level Up | 25 | One-time per level |
| Achievement Unlocked | 50-100 | Varies |

## Coin Spending

### Furniture & Decorations
- Basic Chair: 25 coins
- Cozy Bed: 50 coins
- Plant (small): 15 coins
- Plant (large): 35 coins
- Painting: 40 coins
- Rug: 30 coins
- Lamp: 20 coins
- Bookshelf: 45 coins

### Room Unlocks
- Kitchen: 100 coins
- Garden: 150 coins
- Study Room: 120 coins
- Bathroom: 80 coins
- Master Bedroom: 100 coins

### Pet Cosmetics
- Pet Hat: 30 coins
- Pet Glasses: 35 coins
- Pet Collar: 25 coins
- Seasonal Outfit: 60 coins

### Special Items
- Food Types (gourmet): 10 coins per meal
- Pet Toys (luxury): 40-60 coins
- Photo Filter: 20 coins

## Shop Interface
```
Coin Balance: 500 🪙

Categories:
├── Furniture
├── Decorations
├── Pet Cosmetics
├── Special Items
└── Room Unlocks

Each item shows:
- Icon
- Name
- Cost
- Description
- "Buy" button
```

---

# Real-World Data Integration

## Vision
Connect the virtual pet to real fitness and health data for deeper immersion and motivation.

## Apple Health Integration

### What We Can Track
- **Workouts**: Running, walking, cycling, gym sessions
- **Steps**: Daily step count
- **Sleep**: Duration and quality
- **Heart Rate**: During workouts
- **Calories**: Burned and consumed

### How It Works
```
User's iPhone
    ↓
Apple HealthKit API
    ↓
Virtual Pet App
    ↓
Pet Stats Updated Automatically
```

### Pet Impact
- **Workout Logged**: +25 energy, +15 XP
- **10,000+ Steps**: Pet gets +10 happiness
- **8+ Hours Sleep**: Pet gets full energy restore
- **Poor Sleep (< 6 hours)**: Pet becomes tired/sad

## Google Fit Integration

### Similar to Apple Health
- Capture workout data from Android
- Track steps, sleep, heart rate
- Same pet stat impacts

## Manual Fallback
For users without health tracking:
- Manual "Log Workout" button
- Manual "Log Sleep" input
- Manual activity tracking

## Implementation Steps
1. Integrate Apple HealthKit SDK (V2.1)
2. Request user permissions
3. Query health data daily
4. Update pet stats based on thresholds
5. Show "powered by HealthKit" UI indicator

---

# Enhanced Pet Mechanics

## Mood System Expansion

### Current (V1)
- happy, sad, tired, hungry, playful

### Expanded (V2)
- **happy**: All stats good, recently played
- **sad**: Neglected (hasn't been fed in 24h)
- **tired**: Low energy (< 30%)
- **hungry**: High hunger (> 70%)
- **playful**: Recently played
- **sick**: Health < 50%
- **grateful**: Just fed after being hungry
- **excited**: About to level up
- **bored**: No interaction for 48h+

### Mood-Triggered Events
- Sad → Pet refuses to play until happy
- Tired → Pet sleeps (unresponsive for 4 hours)
- Sick → Requires healing activities (rest, food)
- Bored → Performance decreases

## Pet Personality Traits

### Trait System
Each pet gets random personality traits that affect behavior:

| Trait | Effect |
|-------|--------|
| Lazy | Gains energy slower, likes rest |
| Energetic | Loses energy faster, needs more play |
| Hungry | Hunger increases faster |
| Friendly | Happiness from play is higher |
| Shy | Happiness from play is lower |
| Smart | Learns faster (XP +20%) |
| Forgetful | Forgets tricks if not practiced |

### Storage
```javascript
petData = {
  personality: {
    energyGain: 0.8, // 80% normal rate
    hungerRate: 1.2, // 120% normal rate
    playHappiness: 1.5, // 150% multiplier
  }
}
```

## Tricks & Abilities

### Unlockable Tricks
As pet levels up, it learns new tricks:

- Level 5: Sit
- Level 10: Spin
- Level 15: Trumpet (makes sound)
- Level 20: Dance

### Using Tricks
- Each trick requires energy (10-30 per use)
- Tricks give happiness and XP
- Tricks can fail if energy is low
- Some tricks have special effects (sound, animation)

## Health System Expansion

### Current (V1)
- Single "health" stat (0-100)

### Expanded (V2)
- **Nutrition**: Based on food quality
- **Exercise**: Based on workouts
- **Sleep**: Based on rest
- **Mental**: Based on play/happiness
- **Overall Health**: Average of above

### Health Impacts
- Poor health → Pet gets sick more often
- Sick → Requires rest + nutrition to recover
- Neglect → Health degrades over time

---

# Real-World Collaboration Features

## Vision
Incentivize the user and their girlfriend to work together and do activities together.

## Couple Challenges

### Weekly Challenges
```
🎯 This Week's Challenges:

1. "Workout Together"
   - Both of you complete 3 workouts each
   - Reward: 100 coins + pet gets special costume
   - Progress: Varun (2/3) | GF (1/3)

2. "Study Marathon"
   - Complete 10 pomodoro sessions TOGETHER
   - Reward: 150 coins + pet levels up
   - Progress: 6/10 sessions

3. "Care Consistency"
   - Both log in every day this week
   - Reward: 50 coins each day
   - Progress: 4/7 days
```

### Couple Bonuses
- **Both workout same day**: +20 bonus coins each
- **Both study (pomodoro) same hour**: +5 bonus XP to pet
- **Both log in within 1 hour**: +10 happiness to pet
- **Synchronized actions** (both feed within 5 min): Rarer buff effect

### Leaderboard (Private)
```
Activity This Week:
Varun: 15 total actions
GF: 18 total actions

Pet Stats Contribution:
Varun: 40% of care
GF: 60% of care
```

## Communication Features

### In-App Messages
- Leave notes for each other: "Great job on the workout! 💪"
- Pet messages: "Ellie is waiting for you both! 🐘"
- Reminders: "Your GF just fed me, can you give me water?"

### Notifications
- "Your GF is taking a Pomodoro session - want to join?"
- "Your pet is hungry! Can one of you feed Ellie?"
- "You both logged in today - keep it up!"

---

# Polish & Quality

## UI/UX Improvements

### Animations
- Pet evolution animation (caterpillar → butterfly style)
- Coin earning popup
- Level-up sparkle effect
- Furniture placement animation
- Room transition animations

### Sound Effects (Optional)
- Feed sound: Nom nom
- Play sound: Playful chirp
- Level up: Ding!
- Coin earned: Cash register
- Error: Sad beep
- Toggle on/off in settings

### Accessibility
- Dark mode support
- High contrast mode
- Larger text options
- Keyboard navigation
- Screen reader support

## Performance

### Optimization
- Lazy load images
- Minimize database queries
- Cache room themes
- Debounce rapid clicks
- Optimize SVG animations

### Offline Support
- Work offline, sync when online
- Local storage for recent actions
- Queue updates to send later

## Bug Fixes & Polish
- Edge case handling
- Error boundary implementation
- Loading state refinement
- Empty state handling
- Input validation

---

# Social Features (Future)

## Future Consideration (V3+)

### Friend's Pets
- View friends' pets (read-only)
- See their care statistics
- Congratulate on achievements

### Pet Profiles
- Share public profile link
- Show pet photos/moments
- Display stats and achievements
- Show "Pet of the Month"

### Community Events
- Global challenges (all users combined)
- Seasonal events
- Limited-time cosmetics

---

# Timeline & Priorities

## V2.0 (Q2 2026)
**Priority: High Impact, Moderate Complexity**

- [ ] Coins & Shop System
- [ ] Multiple Rooms (3-4 basic rooms)
- [ ] Pet Evolution (5 levels with visual changes)
- [ ] Furniture & Decorations (20+ items)
- [ ] Mood System Expansion (10 moods)
- [ ] Couple Challenges (3-5 weekly)
- [ ] Dark Mode
- [ ] Bug fixes & UI polish

**Estimated Effort**: 6-8 weeks

## V2.1 (Q3 2026)
**Priority: Real-World Integration**

- [ ] Apple HealthKit Integration
- [ ] Google Fit Integration
- [ ] Sleep Tracking Integration
- [ ] Workout Auto-logging
- [ ] Pet personality traits
- [ ] Tricks & Abilities

**Estimated Effort**: 4-6 weeks

## V2.2 (Q4 2026)
**Priority: Polish & Quality**

- [ ] Sound Effects
- [ ] Advanced Animations
- [ ] Accessibility improvements
- [ ] Performance optimization
- [ ] Offline support
- [ ] Seasonal events

**Estimated Effort**: 4 weeks

## V3.0 (2027)
**Priority: Social & Community**

- [ ] Pet profiles & sharing
- [ ] Friend's pets
- [ ] Community leaderboard
- [ ] Pet photos/memories
- [ ] Advanced personalization

---

# Technical Debt & Considerations

## Backend Scalability
- Currently Firebase works for 2 users
- If expanding, consider:
  - Database optimization
  - Query indexing
  - Batch operations
  - Cloud Functions for complex logic

## Security Updates
- Review Firebase rules regularly
- Add rate limiting for actions
- Prevent coin exploitation
- Validate all inputs

## Code Quality
- Extract reusable components
- Reduce code duplication
- Improve error handling
- Add proper logging

---

# Success Metrics

## For V2.0
- Daily active usage: 2 check-ins per day (95%+ of days)
- Pet reaches Level 5: Within 2 weeks
- Coins earned: 500+ in first month
- Couple challenges completed: 80%+ completion rate

## For V2.1
- Health data integration: 100% successful sync rate
- Automatic workout logging: Used for 50%+ of workouts
- Engagement increase: +30% usage with health features

## For Overall Product
- Fun factor: Users should laugh/smile when interacting
- Relationship impact: Encourages couples to work out together
- Motivation: Real-world tasks feel rewarding through pet

---

# Open Questions for Team

1. **Art Style**: Do we commission custom elephant sprites for evolutions, or use vector/emoji?
2. **Sound Design**: Do we hire a composer, or use royalty-free SFX?
3. **Health Data**: Start with Apple Health only, or parallel Google Fit support?
4. **Monetization**: Will this always be free, or add premium cosmetics later?
5. **Multiple Pets**: Should advanced users be able to have multiple pets, or always one shared pet?
6. **Multiplayer Events**: Should we add more couple-specific challenges, or keep it personal?

---

# Conclusion

This roadmap provides a clear path from MVP to a fully-featured pet care app with deep integration into users' real lives. The priorities are balanced between:

- **Core Gameplay**: More pet interactions and customization
- **Real-World Connection**: Health data integration
- **Couple Bonding**: Collaborative challenges
- **Polish**: Making it feel premium and complete

**Start with V2.0 only after V1 is stable and deployed to production.**

