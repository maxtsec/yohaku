# Yohaku prototype

A throwaway, dependency-free prototype of the learning screen described in
[DESIGN.md](../DESIGN.md). It exists to make the interaction design reviewable
before the real stack is built, and it is **not** the beginning of the app —
the real frontend is React + TypeScript + Vite under `src/yohaku-web`, per
[TECHNICAL.md](../TECHNICAL.md).

## What is real and what is not

| | |
| --- | --- |
| Real | The YouTube video and the IFrame Player API: playback, pause, seek, and time polling every 250 ms |
| Real | All the playback-sync rules — accumulate, de-duplicate, forward-jump, no carry-over into gaps |
| Real | URL validation, summary merging, and the coverage check over learning points |
| **Fixture** | The transcript, translations, and all 25 learning points ([fixture.js](fixture.js)) |
| **Simulated** | The analysis wait: staged progress on a timer, no server and no job queue |
| **Absent** | Transcript provider, backend, database, Gemini — nothing calls out to any API |

The bundled transcript is authored sample data. It does **not** correspond to
what is said in the embedded video, and the banner at the top of the page says
so. The point of pairing it with a real video is to exercise real player
timing, not to imply the analysis came from that video.

## Running it

The YouTube IFrame Player API does not work from `file://` or `data:` URLs, so
the page needs a real HTTP origin. There is no Node or build step; a
dependency-free PowerShell static server is included.

```bash
powershell -ExecutionPolicy Bypass -File prototype/serve.ps1
```

Then open <http://localhost:5173/>. Pass `-Port 8080` to use another port.

A `.claude/launch.json` entry named `prototype` starts the same server.

## What to look at

1. **Submit screen** — paste any YouTube URL. Validation accepts `watch`,
   `youtu.be`, `embed`, `shorts`, `live` and `m.`/`music.` hosts, and rejects
   non-YouTube hosts and malformed IDs. Whatever you submit, the bundled
   fixture analysis is what plays back.
2. **Analysing screen** — the staged wait. Analysis finishes *before* the
   learning screen opens; playback never triggers analysis.
3. **Learning screen**
   - The current sentence and its translation sit under the video. The
     translation is on by default and can be hidden.
   - The right column accumulates learning points as the video reaches them.
     Old points are never replaced.
   - **Rewind** adds nothing new — points are de-duplicated by ID.
   - **Jump forward** reveals every point up to that time at once.
   - In a gap with no sentence, the panel goes idle instead of leaving the
     previous sentence on screen.
   - Clicking a point pauses the video and expands the full explanation with
     its source sentence; only the timestamp seeks.
   - Scrolling up stops the column auto-scrolling and offers a "new points
     below" button.
   - Switching language swaps every string, including open explanations. The
     two languages are never mixed.
4. **Summary tab** — covers the whole video regardless of playback position,
   groups by category, merges duplicate points while keeping every source
   timestamp, and prints a coverage line asserting that all 25 points are
   accounted for.

## Checking it

`validateFixture()` runs on load and logs to the console. It enforces the rules
the backend will have to enforce: unique point IDs, at most three points per
sentence, known categories only, both languages present, non-overlapping
sentence timings, and a summary covering every point exactly once.

```
[yohaku] fixture OK — 16 sentences, 25 learning points
```

`window.yohaku` exposes `state`, `FIXTURE`, `seekTo`, `tick`, `buildSummary`,
`parseYouTubeId` and `validateFixture` so the behaviours above can be driven
from the console.

## Known limitations

- Everything lives in memory; a reload starts over.
- The analysis wait is a fixed timer, so it does not exercise polling, retries,
  `quota_exhausted`, or any failure path.
- Both languages are precomputed in one fixture. The real system treats a
  language as part of the analysis cache key and would run a separate analysis.
- Sentence timings are hand-written round numbers, not real subtitle cues, so
  this says nothing about how well real cue timings segment into sentences.
- Desktop-first. Below 900 px the columns stack; the layout is not designed for
  phones.
