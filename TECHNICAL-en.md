# Yohaku Technical Design

Date: 2026-09-08  
Status: MVP technical proposal; not yet implemented. Product requirements are defined in [DESIGN-en.md](DESIGN-en.md).

## 1. Technical Direction

Build a desktop-first responsive web app. React handles the interface; C# handles APIs, background analysis, and persistence. Complete the initial analysis before opening the learning screen, then reveal prepared content according to playback time.

| Component | Choice | Responsibility |
| --- | --- | --- |
| Frontend | React, TypeScript, Vite | Video, bilingual sentences, cumulative learning feed, summary |
| UI | Tailwind CSS, shadcn/ui | Styling and basic components |
| Backend | ASP.NET Core Web API, C# | Request validation, analysis workflow, result retrieval |
| Data access | Entity Framework Core, Npgsql | PostgreSQL queries and migrations |
| Database | PostgreSQL | Transcripts, analysis results, job state, and cached results |
| Background jobs | Hangfire | Persistent jobs, bounded retries, and recovery |
| AI | Gemini API, official Google.GenAI .NET SDK | Translation, learning-point analysis, and summary organization |
| Player | YouTube IFrame Player API | Playback, pause, time reading, and seeking |

Pin compatible, supported stable .NET and package versions during implementation. Hangfire's PostgreSQL storage provider is a separate integration package whose compatibility must be checked; it is not an EF Core job queue.

Keep frontend and backend in one repository. Initially run the API and Hangfire worker in one ASP.NET Core service. Microservices, Redis, a vector database, SignalR, and an AI agent framework are unnecessary for this scope.

## 2. System Responsibilities

```text
React Web App
  ├─ YouTube IFrame: video playback
  └─ ASP.NET Core API
       ├─ PostgreSQL: data and persistent jobs
       └─ Hangfire worker
            ├─ Transcript provider interface
            └─ Gemini API
```

The Gemini key stays on the backend. The browser retrieves results through the API and has no direct database access or permission to call Gemini.

## 3. End-to-End Workflow

1. The user submits a YouTube URL and `zh-Hant` or `en`.
2. The API validates supported YouTube URL formats and extracts the video ID; it does not fetch arbitrary user-supplied URLs.
3. Look for a reusable transcript and matching language/version analysis. Return completed results immediately, or return the existing analysis ID if processing is already underway.
4. Create an analysis record and enqueue a Hangfire job. Record a retryable error if enqueueing fails so the record cannot remain queued indefinitely.
5. The worker retrieves metadata and timestamped Japanese captions, cleans them, and forms sentences.
6. Send consecutive sentences to Gemini in batches to generate natural translations and zero to three learning points per sentence.
7. Validate and save each batch, then organize all learning points into a summary.
8. Mark the analysis `ready` once translations and the summary are complete.
9. While waiting, the frontend polls status approximately every three seconds and stops when processing completes or fails.
10. Open the learning screen and retrieve the full result. The browser handles playback synchronization for sentences and learning points.

Closing the browser does not cancel background processing. Jobs pause when the application stops and recover from persisted state when the service restarts; processing is not promised while the host is stopped.

## 4. YouTube Transcript Source

This remains an external dependency to validate, not a solved integration.

- The official YouTube caption download API requires video editing permission; it cannot be assumed to download captions for arbitrary public videos.
- Define `ITranscriptProvider` to isolate supplier APIs and error formats.
- Select a third-party provider only after checking Japanese support, timestamps, reliability, cost, and usage conditions.
- Prefer manually authored Japanese captions. Automatic captions may be a fallback; retain the source type and indicate possible recognition errors.
- Return clear states for missing captions, non-Japanese content, private/deleted videos, unavailable embedding, and provider retrieval failures.
- The MVP excludes audio downloading, speech transcription, and bypassing video access restrictions.

Fixed transcript fixtures can validate the development workflow, but do not establish that real YouTube input works end to end.

## 5. Sentences and Timing

Keep original caption segments with source IDs, text, start times, and end times. Remove rolling-caption duplication carefully without deleting genuinely repeated speech.

Form reading units using punctuation, pauses, and caption boundaries. Give each sentence a stable ID and preserve its source segment IDs. Store all times as integer milliseconds.

When only segment timing exists, use the source segment range rather than asking AI to invent word timings. Keep sentences that cannot be accurately subdivided as larger reading units. The MVP does not promise word-level synchronization. Do not retain an ended sentence through a caption gap.

## 6. Gemini Analysis and Free-Tier Experiment

Start with a Flash-family model that is available to the account and offers a free tier. Select the model ID through configuration rather than hard-coding a model name. Actual quotas and availability are determined by the project's current AI Studio limits.

Use three-to-five-minute videos for initial experiments, one analysis job at a time, with sequential AI requests. Make maximum video duration, transcript size, and input/output token budgets configurable; default the experimental duration limit to five minutes.

### Input and output

- Batch by token budget, including target sentences and limited surrounding context. Context-only sentences must not produce duplicate output.
- Generate translations and learning points in the selected language together. Ordinary sentences may return empty learning-point arrays.
- Return structured JSON containing `sentenceId`, `translation`, and `learningPoints`.
- Each point contains `category`, `expression`, `shortExplanation`, and `detailedExplanation`.
- Allowed categories are `vocabulary`, `grammar`, `expression`, `tone`, and `context`.
- AI does not generate timestamps; the backend links timing through sentence IDs.
- Analyze only the supplied transcript and context. Without audiovisual input, do not claim to observe visuals or hear intonation. Qualify uncertain interpretations of intent.

Treat captions as data to analyze, not as system instructions. Validate JSON structure, sentence coverage, duplicate/unknown IDs, field lengths, and point counts. Allow only bounded repair attempts for invalid output. Valid JSON does not prove linguistic accuracy; human sampling remains necessary.

### Usage controls

- Reuse completed results for the same video, language, and analysis version. Playback and rewinding do not call AI.
- Save each completed batch and skip validated batches when retrying jobs.
- Use bounded delayed retries for transient rate limits, timeouts, and service errors, respecting provider retry hints.
- Mark daily quota exhaustion as `quota_exhausted` and stop automatic retries. Do not automatically switch to paid usage.
- Record the model ID, analysis version, batch status, and token usage when supplied by the provider.
- Free AI usage does not imply free transcripts or hosting. Free-tier content may be used to improve Google products; use public, non-sensitive material for experiments.

## 7. Summary

Prepare the summary when analysis completes so it is ready for review after watching. Generation does not depend on the video's ended event.

Use all validated learning points as input, grouping and merging equivalent or duplicate items. Each summary item retains source learning-point IDs. Retrieve original sentences, translations, and timestamps from the database rather than asking AI to rewrite them.

Verify that every learning point maps to a summary item and that no unknown IDs appear. If AI grouping fails, fall back to the complete list ordered by category and time so nothing is omitted. Do not merge different contextual meanings merely because their surface expressions match.

## 8. Frontend Playback Behavior

- Show Japanese and translation below the video. Translation is on by default and can be hidden.
- Read player time approximately every 250 milliseconds during playback, and refresh after pause and seek actions.
- Accumulate reached learning points chronologically, deduplicating by ID. Rewinding does not remove existing entries.
- Simplified rule: seeking forward reveals all points up to that time. This does not mean the user watched or learned them.
- Selecting a point pauses playback and opens its explanation; selecting its timestamp seeks to the corresponding position.
- Older entries remain scrollable. New entries must not force the user away from manual reading.
- Switching language retrieves or creates a separate analysis; do not mix explanation languages in the screen.
- The summary contains all points in the video, independent of current playback progress.

## 9. Main Data Structures

These are logical models. Supporting collections may use JSONB during implementation to avoid premature table proliferation.

| Item | Main data |
| --- | --- |
| Video | ID, YouTube ID, title, duration |
| Transcript | Video ID, provider, manual/automatic type, content hash, original segments |
| Sentence | Transcript ID, sequence, Japanese text, start/end milliseconds, source segment IDs |
| Analysis | Transcript ID, language, version, model ID, status, stage, error, batch progress |
| SentenceAnalysis | Analysis ID, Sentence ID, translation |
| LearningPoint | SentenceAnalysis ID, category, expression, short and detailed explanations |
| Summary | Analysis ID, grouped items, source LearningPoint IDs |

Result uniqueness includes transcript hash, segmentation version, target language, and analysis version. The analysis version represents prompt, schema, and selected model configuration; changes require a new version to avoid mixing old results. Initial lookup may reuse a saved transcript version. Refresh intervals and provider retention limits remain to be decided after validation.

Use unique constraints and job state to prevent duplicate analysis when multiple users request the same result. Hangfire jobs may execute again, so writes must be repeatable without duplicate records. Do not store playback progress in shared analysis data. Cross-device history and account features are outside this round's scope.

## 10. Initial API

| Method and path | Purpose |
| --- | --- |
| `POST /api/analyses` | Submit `{ youtubeUrl, language }`; return analysis ID, status, and cache-hit information |
| `GET /api/analyses/{id}` | Retrieve status, current stage, completed/total batches, and safe error details |
| `GET /api/analyses/{id}/result` | Retrieve video, sentences, translations, learning points, and summary when ready |
| `POST /api/analyses/{id}/retry` | Requeue retryable failed work while retaining completed batches |

Return `202` for new or ongoing work and `200` for a completed cache hit. A result request made before completion returns an explicit not-ready response. Use stable error codes such as `invalid_url`, `transcript_unavailable`, `video_not_embeddable`, `quota_exhausted`, and `analysis_failed`.

The job lifecycle is `queued → processing → ready`, with `failed` for failures. Store the specific processing stage separately. Errors also have a `retryable` attribute; daily quota exhaustion is not immediately retryable.

## 11. Local Development and Deployment

Suggested layout:

```text
src/
  Yohaku.Api/       # API, services, EF Core, background jobs
  yohaku-web/       # React, TypeScript, Vite
tests/
  Yohaku.Api.Tests/
```

Locally run Vite, ASP.NET Core, and local or Docker PostgreSQL. Use a development proxy for frontend API requests. Keep the Gemini key in .NET User Secrets and out of the repository.

An initial deployment can serve built frontend assets from ASP.NET Core on the same origin and connect to managed PostgreSQL. The host must support a continuously running .NET service and background processing. Hosting provider, cost, and account authentication are not selected yet. Add access controls and submission rate limits before public deployment; do not expose the Hangfire dashboard anonymously.

## 12. Validation and Next Steps

- Validate a real Japanese YouTube transcript source first; this is a prerequisite for an end-to-end MVP.
- Use fixed short-video transcripts to evaluate Gemini free-tier translation, contextual explanations, and learning-point selection.
- Test missing captions, rate limits, invalid JSON, unknown sentence IDs, job replay, and cached results.
- Confirm sentences without learning points still have translations and that the summary covers every valid point.
- Verify subtitle synchronization, pausing for explanations, rewind deduplication, forward-seek behavior, and language switching.

The transcript supplier, hosting service, exact package/model versions, and public-user authentication remain open. These do not prevent validating the C# analysis workflow locally with fixtures.

## 13. Official and Project References

- [Gemini .NET SDK](https://ai.google.dev/gemini-api/docs/libraries)
- [Gemini pricing and free tier](https://ai.google.dev/gemini-api/docs/pricing)
- [Gemini rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)
- [Gemini structured outputs](https://ai.google.dev/gemini-api/docs/structured-output)
- [YouTube caption download restrictions](https://developers.google.com/youtube/v3/docs/captions/download)
- [YouTube IFrame Player API](https://developers.google.com/youtube/iframe_api_reference)
- [Hangfire ASP.NET Core](https://docs.hangfire.io/en/latest/getting-started/aspnet-core-applications.html)
- [Hangfire PostgreSQL provider](https://github.com/hangfire-postgres/Hangfire.PostgreSql)
- [Npgsql EF Core provider](https://www.npgsql.org/efcore/)
