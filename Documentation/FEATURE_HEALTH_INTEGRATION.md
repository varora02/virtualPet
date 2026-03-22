# 🏃 Real-World Data Integration Spec

## Overview
Integrate with Apple Health and Google Fit to automatically track user fitness data and impact the pet's stats and progression.

## Apple HealthKit Integration

### What We'll Track

#### Workouts
```javascript
// Supported workout types:
workoutTypes = {
  "running": { energyGain: 30, xp: 20 },
  "walking": { energyGain: 15, xp: 10 },
  "cycling": { energyGain: 25, xp: 18 },
  "gym": { energyGain: 35, xp: 22 },
  "sports": { energyGain: 30, xp: 20 },
  "swimming": { energyGain: 35, xp: 22 },
  "hiking": { energyGain: 30, xp: 20 },
  "other": { energyGain: 20, xp: 15 }
}
```

#### Sleep Data
```javascript
sleepTracking = {
  "durationMinutes": number,
  "quality": "good" | "fair" | "poor",
  "startTime": timestamp,
  "endTime": timestamp
}
```

#### Activity Rings
```javascript
dailyActivity = {
  "move": number, // Calories burned (goal: 300)
  "exercise": number, // Minutes (goal: 30)
  "stand": number, // Hours (goal: 12)
  "steps": number,
  "heartRate": number
}
```

### Implementation Flow

```
┌──────────────────┐
│ User Opens App   │
└────────┬─────────┘
         ↓
┌──────────────────────────────┐
│ "Sync Health Data?"          │
│ "Virtual Pet needs permission│
│ to access your fitness data" │
│ [Allow] [Not Now]            │
└────────┬─────────────────────┘
         ↓
┌──────────────────┐
│ Request HealthKit│
│ Permissions      │
└────────┬─────────┘
         ↓
┌──────────────────────────────┐
│ User grants permission in     │
│ Settings → Health → Virtual   │
│ Pet → Toggle switches         │
└────────┬─────────────────────┘
         ↓
┌──────────────────────────┐
│ App queries last 30 days  │
│ of health data            │
└────────┬─────────────────┘
         ↓
┌──────────────────────┐
│ Process & Apply to   │
│ Pet Stats            │
└──────────────────────┘
```

### Code Implementation

```javascript
// 1. Import HealthKit library (for React Native/iOS)
import { HKHealthStore } from 'react-native-health';

// 2. Request permissions
const requestHealthPermissions = async () => {
  const permissions = {
    permissions: {
      read: [
        HKHealthStore.constants.Permissions.HKWorkoutTypeIdentifier,
        HKHealthStore.constants.Permissions.HKSleepAnalysis,
        HKHealthStore.constants.Permissions.HKStepCount,
        HKHealthStore.constants.Permissions.HKActiveEnergyBurned
      ]
    }
  };
  
  try {
    const granted = await RNHealth.requestAuthorization(permissions);
    if (granted) {
      // Fetch and sync data
      await syncHealthData();
    }
  } catch (error) {
    console.error('Health permission error:', error);
  }
};

// 3. Fetch workouts
const fetchWorkouts = async (startDate, endDate) => {
  const workouts = await RNHealth.getWorkouts({
    startDate,
    endDate,
    ascending: false
  });
  
  return workouts.map(workout => ({
    type: workout.workoutActivityName,
    duration: workout.duration,
    calories: workout.calories,
    distance: workout.distance,
    date: new Date(workout.startDate)
  }));
};

// 4. Fetch sleep data
const fetchSleepData = async (startDate, endDate) => {
  const sleep = await RNHealth.getSamples({
    startDate,
    endDate,
    type: HKHealthStore.constants.Permissions.HKSleepAnalysis,
    ascending: false
  });
  
  return sleep.map(entry => ({
    startTime: new Date(entry.startDate),
    endTime: new Date(entry.endDate),
    duration: entry.endDate - entry.startDate,
    quality: classifySleepQuality(entry)
  }));
};

// 5. Apply health data to pet
const applyHealthDataToPet = async (workouts, sleepData) => {
  let petUpdate = {
    energy: petData.energy,
    happiness: petData.happiness,
    health: petData.health,
    xp: 0
  };

  // Process workouts
  workouts.forEach(workout => {
    const workoutType = normalizeWorkoutType(workout.type);
    const impact = workoutTypes[workoutType] || workoutTypes.other;
    
    petUpdate.energy = Math.min(100, petUpdate.energy + impact.energyGain);
    petUpdate.xp += impact.xp;
  });

  // Process sleep
  sleepData.forEach(sleep => {
    const durationHours = sleep.duration / 3600000;
    const quality = sleep.quality;
    
    if (durationHours >= 8 && quality === 'good') {
      petUpdate.energy = 100; // Full rest
      petUpdate.health = Math.min(100, petUpdate.health + 10);
      petUpdate.happiness = Math.min(100, petUpdate.happiness + 5);
    } else if (durationHours < 6) {
      petUpdate.energy = Math.max(0, petUpdate.energy - 20);
      petUpdate.health = Math.max(0, petUpdate.health - 5);
    }
  });

  // Save to Firebase
  await updateDoc(doc(db, 'pets', SHARED_PET_ID), petUpdate);
};
```

## Google Fit Integration

### Similar Implementation for Android

```javascript
// Using Google Fit API
import { GoogleFitService } from 'react-native-google-fit';

const requestGoogleFitPermissions = async () => {
  const options = {
    scopes: [
      'fitness.BODY_READ',
      'fitness.ACTIVITY_READ'
    ]
  };

  try {
    const canAuthorize = await GoogleFitService.authorize(options);
    if (canAuthorize) {
      await syncGoogleFitData();
    }
  } catch (error) {
    console.error('Google Fit permission error:', error);
  }
};

const fetchGoogleFitWorkouts = async (startDate, endDate) => {
  const result = await GoogleFitService.getDailyStepCountSamples({
    startDate,
    endDate,
    bucketUnit: 'DAY',
    bucketInterval: 1
  });

  return result.map(day => ({
    date: new Date(day.startDate),
    steps: day.steps[0].value,
    calories: calculateCaloriesFromSteps(day.steps[0].value)
  }));
};
```

## Pet Impact System

### Workout Impact

```javascript
workoutImpact = {
  // Each workout affects multiple stats
  
  standardWorkout: {
    // 30 min workout
    energyGain: 25,
    hungerIncrease: 15,
    happinessBoost: 10,
    xpGain: 20,
    coinBonus: 15
  },
  
  intensiveWorkout: {
    // 60+ min workout
    energyGain: 35,
    hungerIncrease: 25,
    happinessBoost: 20,
    xpGain: 30,
    coinBonus: 25
  },
  
  lowIntensityWorkout: {
    // Light walk, yoga
    energyGain: 15,
    hungerIncrease: 10,
    happinessBoost: 5,
    xpGain: 10,
    coinBonus: 10
  }
}
```

### Sleep Impact

```javascript
sleepImpact = {
  excellentSleep: {
    // 8+ hours, good quality
    energyRestore: 100,
    healthBoost: 15,
    happinessBoost: 10,
    moodChange: "happy"
  },
  
  goodSleep: {
    // 7-8 hours, decent quality
    energyRestore: 80,
    healthBoost: 10,
    happinessBoost: 5,
    moodChange: "happy"
  },
  
  poorSleep: {
    // < 6 hours or bad quality
    energyRestore: 40,
    healthDecrease: 10,
    happinessDecrease: 5,
    moodChange: "tired"
  },
  
  noSleepData: {
    // No sleep tracked
    energyRestore: 50,
    healthChange: 0,
    moodChange: "neutral"
  }
}
```

### Activity Ring Impact

```javascript
activityRingImpact = {
  moveRingComplete: {
    // 300+ calories
    coinBonus: 10,
    xpGain: 5,
    healthBoost: 5
  },
  
  exerciseRingComplete: {
    // 30+ min exercise
    coinBonus: 15,
    xpGain: 10,
    energyGain: 20
  },
  
  standRingComplete: {
    // 12+ hours standing
    coinBonus: 5,
    xpGain: 2
  },
  
  allRingsComplete: {
    // All three rings
    bonusCoins: 30,
    bonusXp: 20,
    happinessBoost: 15,
    specialBadge: "Activity Champion"
  }
}
```

## User Interface

### Permission Request

```
┌────────────────────────────────┐
│ 🏃 Sync Your Fitness Data      │
├────────────────────────────────┤
│                                │
│ Let Virtual Pet access your:   │
│                                │
│ ☐ Workouts & Activities       │
│ ☐ Sleep Data                   │
│ ☐ Steps & Calories             │
│ ☐ Heart Rate                   │
│                                │
│ Your data stays private & is   │
│ only used to care for Ellie.   │
│                                │
│ [Allow] [Skip for Now]         │
│                                │
└────────────────────────────────┘
```

### Health Data Dashboard

```
┌─────────────────────────────────┐
│ 📊 Your Fitness Impact          │
├─────────────────────────────────┤
│                                 │
│ This Week's Data:               │
│                                 │
│ 🏃 Workouts: 4 sessions         │
│    Energy Gained: +100          │
│    Coins Earned: +60            │
│                                 │
│ 😴 Sleep Quality: Good          │
│    Nights: 6/7                  │
│    Ellie's Health: +30          │
│                                 │
│ 👟 Steps: 45,000                │
│    Daily Avg: 6,500             │
│    Happiness: +20               │
│                                 │
│ 🎯 All Activity Rings Done: YES │
│    ⭐ Activity Champion Badge   │
│    Bonus: +50 coins             │
│                                 │
└─────────────────────────────────┘
```

### Sync Status

```
┌──────────────────────────┐
│ ✅ Data Synced          │
│ Last Updated: 2 hours ago│
│                          │
│ [Sync Now] [Settings]   │
└──────────────────────────┘
```

## Notification System

### Workout Notifications

When user completes workout:
```
"🎉 Great workout! Ellie gained 25 energy!"
```

When user logs workout from Apple Health:
```
"✅ Your run was synced! Ellie got 20 XP"
```

### Sleep Notifications

```
"😴 You slept 8 hours! Ellie is fully rested."
```

```
"⚠️ Only 5 hours of sleep. Ellie is tired."
```

### Couple Notifications

When both workout same day:
```
"🙌 You both worked out today! 
 Ellie earned +20 bonus happiness!"
```

## Data Privacy & Security

### What We Store
```
// We DO store (anonymized)
- Workout type and duration
- Sleep hours and quality (inferred)
- Steps per day (aggregated)
- Activity completions

// We DON'T store
- Exact location data
- Heart rate raw data
- Medical diagnoses
- Personal identifiable info
```

### Privacy Policy Updates
Include in app privacy policy:
- "We read your Health app data to enhance gameplay"
- "Your health data never leaves your device unless synced to our database"
- "Data is encrypted in transit and at rest"
- "You can revoke permission anytime in Settings"

### Data Retention
- Keep last 90 days of data
- Delete older data automatically
- User can delete all health data anytime
- GDPR compliant data handling

## Implementation Timeline

### Phase 1: iOS (Week 1-2)
- [ ] Apple HealthKit integration
- [ ] Permission flow
- [ ] Workout fetching
- [ ] Sleep data parsing
- [ ] Pet impact system
- [ ] Testing with real devices

### Phase 2: Android (Week 3-4)
- [ ] Google Fit integration
- [ ] Parallel permission flow
- [ ] Data normalization
- [ ] Testing

### Phase 3: Polish & Features (Week 5-6)
- [ ] UI refinement
- [ ] Notification system
- [ ] Sync optimization
- [ ] Error handling
- [ ] Analytics

## Success Metrics

- Permission grant rate: 70%+
- Automatic workout sync: 85%+ of logged workouts
- Sleep tracking adoption: 60%+
- Engagement boost: +40% daily active users
- Data accuracy: 95%+ match with source

## Edge Cases & Handling

```javascript
// No health app installed
if (!isHealthAppAvailable()) {
  showManualEntryOption();
}

// Permission denied
if (!healthPermissionGranted) {
  showPermissionRationaleDialog();
}

// No recent data
if (workouts.length === 0) {
  showZeroStateWithInstructions();
}

// Data sync conflict
if (localWorkoutExists(workout)) {
  deduplicateWorkout(workout);
}

// Offline sync
if (offline) {
  queueSyncForLater();
}
```

## Future Enhancements

- Wearable app for Apple Watch / Wear OS
- Share health progress with partner
- Leaderboards (private couple only)
- Health goals integration
- Custom notifications based on health data
- Premium health analytics dashboard
