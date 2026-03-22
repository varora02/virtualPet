# 👥 Couple Collaboration & Challenges Spec

## Overview
Design systems that incentivize and reward couples to work together, exercise together, and study together to motivate real-world collaboration.

## Core Philosophy

The app should:
- ✅ Make it rewarding to do things together
- ✅ Celebrate both users equally
- ✅ Create friendly competition without toxicity
- ✅ Support different activity levels
- ✅ Be fun even when asynchronous

## Synchronized Action System

### Same-Day Bonuses

#### Workout Together
```
Event: Both users complete a workout on the same day

Trigger: User2 completes workout after User1 already did
Message: "🙌 You both worked out today! Ellie earned +20 bonus happiness!"

Rewards:
- Each user: +5 bonus coins
- Pet: +20 happiness
- Pet: +10 XP
- Log special activity: "Couple Workout"
- Progress toward "Fitness Duo" challenge
```

#### Study Together
```
Event: Both users complete a Pomodoro session in the same hour

Trigger: User2 starts Pomodoro while User1 is in active session
Notification: "User1 is studying! Want to join?"

Rewards (if both complete in same hour):
- Each user: +3 bonus coins
- Pet: +5 XP bonus
- Visual celebration on pet screen
- Progress toward "Study Partners" challenge
```

#### Check-in Together
```
Event: Both users log in within 1 hour of each other

Trigger: User2 logs in within 60 minutes of User1
Message: "You both logged in today! Ellie's happy to see you both!"

Rewards:
- Each user: +5 bonus coins
- Pet: +10 happiness
- Perfect attendance streak
- Streak display: "3 days in a row ✓"
```

#### Feed Together
```
Event: Both users feed the pet within 5 minutes of each other

Trigger: User2 feeds pet within 5 min of User1
Message: "Perfect timing! You both just fed Ellie!"

Rewards:
- Shared joy animation
- +5 coins each
- Pet gets full hunger bar
- Special log entry
```

### Database Schema for Synchronized Actions

```javascript
synchronizedActions = {
  workoutDuo: {
    enabled: true,
    window: "sameDay", // 24 hour window
    reward: {
      coins: 5,
      happiness: 20,
      xp: 10
    },
    lastTriggered: <timestamp>,
    count: 12 // Total times triggered
  },
  
  studySync: {
    enabled: true,
    window: "oneHour", // 1 hour window
    reward: {
      coins: 3,
      xp: 5
    },
    lastTriggered: <timestamp>,
    count: 24
  },
  
  feedTogether: {
    enabled: true,
    window: "fiveMinutes",
    reward: {
      coins: 5,
      happiness: 5
    },
    lastTriggered: <timestamp>,
    count: 8
  }
}
```

## Weekly Challenges

### Challenge Structure

Each week, 3-4 couple-specific challenges unlock:

```
┌──────────────────────────────────────┐
│ 🎯 This Week's Couple Challenges    │
├──────────────────────────────────────┤
│                                      │
│ 1️⃣ Workout Together                │
│    Both of you: 3 workouts each    │
│    Progress: Varun 2/3 | GF 1/3    │
│    Reward: 100 coins + Badge       │
│    Days Left: 5                    │
│    [Details]                       │
│                                      │
│ 2️⃣ Study Marathon                  │
│    Together: 10 Pomodoro sessions  │
│    Progress: 6/10 ████░░░░        │
│    Reward: 150 coins + Level Up    │
│    Days Left: 5                    │
│    [Details]                       │
│                                      │
│ 3️⃣ Daily Check-In Streak           │
│    Both login every day this week  │
│    Progress: 4/7 days ✓✓✓✓        │
│    Reward: 50 coins per day        │
│    Days Left: 3                    │
│    [Details]                       │
│                                      │
│ 4️⃣ Care Champions                  │
│    Combined: 50 pet interactions   │
│    Progress: 32/50 ██████░░        │
│    Reward: 200 coins + Special Pet │
│    Days Left: 5                    │
│    [Details]                       │
│                                      │
└──────────────────────────────────────┘
```

### Challenge Examples

#### Challenge 1: "Workout Warriors"
```
Goal: Both users complete 3+ workouts each

Metric Tracking:
- User1 Workouts: [✓ Mon, ✓ Wed, ✓ Fri] (3/3)
- User2 Workouts: [✓ Mon, ✓ Tue] (2/3)

Progress Bar: User1 Done! User2 1 more needed

Reward on Completion:
- 100 coins to shared account
- Pet outfit: "Athlete Outfit"
- Badge: "Workout Warriors"
- Celebration on pet screen

Failure Handling:
- If not completed by week end:
  "You missed this one! Try next week."
  - No penalty
  - Maybe partial reward? (50 coins if 2/3 complete)
```

#### Challenge 2: "Study Synchronized"
```
Goal: Together complete 10 Pomodoro sessions
       (must be logged within same hour for synchronization bonus)

Rules:
- Sessions count only if within 1 hour of each other
- Asynchronous sessions still count, but no bonus
- Sync bonus: +5 coins per synced session

Example Success:
- Mon 2pm: User1 Pomodoro (1/10)
- Mon 2:15pm: User2 Pomodoro (2/10, +5 sync bonus)
- Wed 7pm: User1 Pomodoro (3/10)
- Thu 6pm: User2 Pomodoro (4/10, no sync)
- ...
- Progress: 10/10 ✓ COMPLETE

Rewards:
- 150 coins
- Pet levels up
- Special study room decoration
- Badge: "Study Synchronized"
```

#### Challenge 3: "Consistency Duo"
```
Goal: Both users log in EVERY day for 7 days

Rules:
- Both must log in on the same calendar day
- Window: 00:00 - 23:59 (same day)
- No exceptions (missing one day resets progress)

Progress Tracker:
Day 1: ✓ Both in
Day 2: ✓ Both in
Day 3: ✓ Both in
Day 4: ⏳ Waiting for User2... (deadline 11:59pm)
Day 5: ✗ User2 didn't log in (RESET)

If completed:
- 50 coins each
- Pet happiness +30
- Pet learns new trick
- Badge: "7-Day Partners"
- Bonus: Unlock next week's exclusive challenge
```

#### Challenge 4: "Care Champions"
```
Goal: Combined 50 pet interactions (any action)

Actions that count:
- Feed: 1 point
- Water: 1 point
- Play: 1 point
- Workout: 2 points
- Pomodoro: 2 points

Progress:
Varun: 15 actions
GF: 17 actions
Total: 32/50 ████░░░░ 64%

Weekly Leaderboard:
1. GF: 17 actions (leader 👑)
2. Varun: 15 actions

Rewards:
- 200 coins shared
- Pet costume
- Special celebration animation
- Both get "Care Champion" badge
```

## Leaderboard & Stats

### Private Couple Leaderboard

```
┌──────────────────────────────────┐
│ 📊 This Week's Stats             │
├──────────────────────────────────┤
│                                  │
│ Activity Count:                  │
│ 👑 GF: 18 actions                │
│    Varun: 15 actions             │
│                                  │
│ Coins Earned:                    │
│ 👑 Varun: 120 coins              │
│    GF: 100 coins                 │
│                                  │
│ Workout Count:                   │
│ 👑 GF: 4 workouts                │
│    Varun: 2 workouts             │
│                                  │
│ Pomodoro Sessions:               │
│ 👑 Varun: 8 sessions             │
│    GF: 6 sessions                │
│                                  │
│ Combined Contribution:           │
│ Varun: 48% of pet care           │
│ GF: 52% of pet care              │
│                                  │
│ (No real competition, just fun!) │
│                                  │
└──────────────────────────────────┘
```

### Time-Based Achievements

```javascript
achievements = {
  weekly: {
    "First Synchronized Workout": "Complete 1 workout each same day",
    "Study Partners": "Complete 1 Pomodoro within same hour",
    "Perfect Week": "Both log in all 7 days",
    "Care Duo": "50 combined interactions"
  },
  
  monthly: {
    "Relationship Unlocked": "Reach 100 synced actions",
    "Fitness Couple": "50 combined workouts",
    "Study Squad": "100 combined Pomodoros",
    "Pet Parent": "Pet reaches level 10"
  },
  
  special: {
    "Anniversary": "Both logged in for 365 days",
    "Milestone": "Pet reaches specific level",
    "Season": "Complete seasonal challenge"
  }
}
```

## Communication Features

### In-App Messages

Users can leave each other notes:

```
┌──────────────────────────────┐
│ 💬 Message for Your Partner  │
├──────────────────────────────┤
│                              │
│ "Nice workout! 💪"           │
│ [Send]                       │
│                              │
│ Recent Messages:             │
│ "Great job on the Pomodoro!" │
│ -from GF, 2h ago            │
│                              │
│ "Ellie misses you 🐘"        │
│ -from System, 4h ago        │
│                              │
│ "Let's study together later?"│
│ -from GF, Yesterday         │
│                              │
└──────────────────────────────┘
```

### Pet-Generated Messages

The pet can "message" users:

```
From Ellie:
"GF just fed me! I wish Varun would play with me 👉👈"

"You both worked out today! I'm so happy! 🎉"

"It's been 12 hours since anyone played with me 😢"

"Your partner completed a Pomodoro! You should too! 📚"
```

### Notifications

```
Push Notifications:

"Your partner just had a workout! 
 Want to grab your sneakers too? 🏃‍♂️"

"You both have 4 days to complete the 'Workout Warriors' challenge!
 You need 1 more workout, she needs 2 more. 💪"

"Uh oh! You haven't logged in today. 
 Your partner did! Come hang with Ellie 🐘"

"You're both studying right now! 
 Ellie is enjoying the focus energy 📚✨"
```

## Incentive Design

### Why Together is Better

Without bonuses:
```
Both workout same day: +20 coins + 20 XP each
```

With bonuses:
```
Both workout same day: +25 coins + 25 XP each + 
                       +5 bonus coins + 20 pet happiness
```

**Difference**: 5 bonus coins + shared happiness makes it more rewarding

### Progression Paths

**Path 1: Individual but Parallel**
```
User1: Workout Mon/Wed/Fri
User2: Workout Tue/Thu/Sat
(Different schedules, but get daily bonuses)
```

**Path 2: Synchronized**
```
User1: Workout Mon/Wed/Fri
User2: Workout Mon/Wed/Fri
(Same schedule, get all bonuses + sync rewards)
```

Both paths are valid, but Path 2 is more rewarding.

## Database Schema

```javascript
coupleChallenges = {
  week52of2026: {
    challenges: [
      {
        id: "workout_warriors",
        title: "Workout Warriors",
        goal: "Both users: 3+ workouts each",
        startDate: <timestamp>,
        endDate: <timestamp>,
        progress: {
          user1: 2,
          user2: 1,
          total: 3,
          target: 6
        },
        completed: false,
        rewards: {
          coins: 100,
          happiness: 20,
          outfit: "athlete_outfit"
        },
        participantStats: {
          user1: {
            actions: 2,
            completedOn: null
          },
          user2: {
            actions: 1,
            completedOn: null
          }
        }
      }
    ],
    stats: {
      totalChallengesCompleted: 3,
      currentStreak: 3,
      highestStreak: 5
    }
  },
  
  synchronizedActions: [
    {
      id: "sync_action_001",
      type: "workout_duo",
      user1: "varun@...",
      user2: "gf@...",
      timestamp: <timestamp>,
      rewardsAwarded: true,
      coins: 10,
      happiness: 20
    }
  ]
}
```

## Design Principles

### Anti-Toxicity
- ❌ Don't compare users negatively
- ✅ Do celebrate what they're doing well
- ❌ Don't shame inactivity
- ✅ Do encourage gently with pet messages
- ❌ Don't force synchronization
- ✅ Do reward it when it happens

### Fairness
- Different users have different schedules
- Support both sync and async play
- Partial challenge credit possible
- No "you lost" messages (only "try next week")

### Positivity
- Emphasize "you both" instead of competition
- Celebrate the pet's joy at seeing both users
- Frame challenges as team goals
- Always include pet as the beneficiary

## Success Metrics

- Synchronized action rate: 30%+ of actions
- Challenge completion rate: 70%+
- Partner coordination: 50%+ of weeks all challenges met
- Engagement boost: +25% when active challenges
- Relationship impact: Users report it encourages real-world activity

## Future Enhancements

- Voice/video chat integration during workouts
- Fitness leaderboards (private, just couple)
- Shared photo memories
- Couple-only pet skins (unlocked after 30 days together)
- Partner appreciation moments
- Special anniversary challenges

## Example Week Flow

```
Monday:
- GF completes workout
- System: "GF worked out! You're 2/3. Want to join her?"
- Pet gets +15 energy

Tuesday:
- Varun completes workout
- System: "🎉 You both worked out! Ellie is happy!"
- Both get +5 bonus coins
- Challenge progress: Workout Warriors 2/3 → 3/3 ✓ COMPLETE

Wednesday:
- Both attempt Pomodoros within same hour
- System: "Study sync! +5 bonus coins each!"
- Challenge: Study Synchronized progress 1/10 → 2/10

Thursday:
- GF logs in, no Varun yet
- Ellie message: "Varun, your GF is here. Come play! 🐘"

Friday:
- Both log in and feed pet
- Challenge: Care Champions 32/50 → 34/50
- Pet reaction: Celebration animation

Saturday:
- System reminds: "You're so close to 'Consistency Duo'! 
                   Just 1 more day of both logging in!"

Sunday:
- Both log in before midnight
- Challenge: Consistency Duo 6/7 → 7/7 ✓ COMPLETE
- WEEKLY ACHIEVEMENT: +50 coins each + special badge

```
