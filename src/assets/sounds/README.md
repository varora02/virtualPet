# Sound Assets

All audio files go here. Two folders:

## `music/`
Looping background tracks. Use `.ogg` (preferred) or `.mp3`.

| Filename              | When it plays                         |
|-----------------------|---------------------------------------|
| `ambient_day.ogg`     | Default daytime loop                  |
| `ambient_night.ogg`   | Night-time loop (after 16:00 PST)     |

## `sfx/`
Short sound effects. Use `.ogg` or `.wav` (wav = zero latency, good for snappy hits).

| Filename          | Triggered by                          |
|-------------------|---------------------------------------|
| `eat.ogg`         | Cat/hare finishes eating grass        |
| `drink.ogg`       | Cat/hare finishes drinking at well    |
| `rest.ogg`        | Rest action starts (yawn/settle)      |
| `coin.ogg`        | Coin earned                           |
| `levelup.ogg`     | Level-up animation starts             |
| `celebrate.ogg`   | Celebration run triggered             |
| `thought.ogg`     | Thought bubble appears (soft pop)     |
| `campfire.ogg`    | Short loop: crackling fire (optional) |

## Tips
- Keep sfx under **100 KB** each — load at startup, play instantly.
- Music tracks can be larger (streamed, not preloaded into memory).
- Browsers block autoplay until the first user gesture (any button click).
  The `useSoundManager` hook handles this automatically.
