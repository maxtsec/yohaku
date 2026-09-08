# Yohaku

> Yohaku is a sentence-by-sentence comprehension tool for learning Japanese through authentic YouTube content.

Yohaku goes beyond translation. It explains the vocabulary, grammar, natural expressions, tone, and context behind each sentence of a Japanese YouTube video, so that watching content and learning the language become one continuous experience.

**Status:** design and technical planning only. No application code has been written yet. This repository currently contains the product and technical documents that define the MVP.

## The problem

Learners watching authentic Japanese videos pause repeatedly and switch between subtitles, translation tools, dictionaries, grammar references, and general-purpose AI. The information is fragmented and often fails to explain what a sentence means in its immediate context.

Yohaku's premise is that learners do not simply lack translations — they lack a continuous viewing experience that identifies and explains important learning points at the moment they appear.

## How it works

1. The user submits a Japanese YouTube URL and picks an explanation language (`zh-Hant` or `en`).
2. The backend fetches timed Japanese subtitles, cleans them, and groups them into sentences.
3. Sentences are sent to the AI in batches to produce a natural translation and 0–3 learning points per sentence.
4. All validated learning points are consolidated into a Summary.
5. Only after analysis is complete does the user enter the learning screen. Playback never calls the AI.

## Core experience

- **Video area** — YouTube player; video time is the shared reference for subtitles and learning points.
- **Sentence and translation** — below the video, showing the current Japanese sentence with translation on by default (can be hidden).
- **Learning points column** — on the right, accumulating as the video progresses. New points are appended rather than replacing older ones, each keeping its source sentence and timestamp. Rewinding does not duplicate entries.
- **Detail view** — clicking a learning point pauses the video and expands the full explanation.
- **Summary** — all learning points for the video, grouped by category, with the original sentence, translation, and a link back to the video position.

Learning point categories: `vocabulary`, `grammar`, `expression`, `tone`, `context`.

## Product principles

- **Authentic content first** — learning material comes from videos users actually want to watch, not a prepared course.
- **Comprehension over translation** — explain *why* a sentence means what it means.
- **AI is a content analyst, not a tutor** — no free-form chat or open-ended AI tutor.
- **Quality over quantity** — ordinary sentences may have no learning points at all.
- **Watching and learning stay continuous** — users should never have to leave the video to look something up.

## Out of scope for the MVP

Sources other than YouTube, open-ended AI chat, JLPT/proficiency segmentation, personalised learning paths, quizzes and scoring, flashcards and spaced repetition, manual notes and tags, social features, and generated courseware.

## Planned architecture

```text
React Web App
  ├─ YouTube IFrame: video playback
  └─ ASP.NET Core API
       ├─ PostgreSQL: data and persisted jobs
       └─ Hangfire worker
            ├─ transcript provider interface
            └─ Gemini API
```

| Layer | Choice |
| --- | --- |
| Frontend | React, TypeScript, Vite |
| UI | Tailwind CSS, shadcn/ui |
| Backend | ASP.NET Core Web API, C# |
| Data access | Entity Framework Core, Npgsql |
| Database | PostgreSQL |
| Background jobs | Hangfire |
| AI | Gemini API, official `Google.GenAI` .NET SDK |
| Player | YouTube IFrame Player API |

The Gemini key lives only on the backend. The browser reaches results through the API and never calls Gemini or the database directly. Exact package, .NET, and model versions are pinned during implementation.

### Planned API

| Method and path | Purpose |
| --- | --- |
| `POST /api/analyses` | Submit `{ youtubeUrl, language }`; returns analysis ID, status, and whether it was a cache hit |
| `GET /api/analyses/{id}` | Status, current stage, completed/total batches, and safe error information |
| `GET /api/analyses/{id}/result` | Video, sentences, translations, learning points, and Summary |
| `POST /api/analyses/{id}/retry` | Re-enqueue a retryable failed job, keeping completed batches |

Job lifecycle is `queued → processing → ready`, with `failed` for errors. Stable error codes include `invalid_url`, `transcript_unavailable`, `video_not_embeddable`, `quota_exhausted`, and `analysis_failed`.

### Planned layout

```text
src/
  Yohaku.Api/       # API, services, EF Core, background jobs
  yohaku-web/       # React, TypeScript, Vite
tests/
  Yohaku.Api.Tests/
```

## Open questions

These are unresolved dependencies, not solved problems:

- **Transcript source.** The official YouTube caption download API requires edit rights on the video, so it cannot be assumed to work for arbitrary public videos. A third-party provider will only be chosen after verifying Japanese support, timestamps, stability, cost, and terms. An `ITranscriptProvider` interface isolates this decision.
- **Deployment.** Hosting provider, cost, and public user authentication are not yet selected.
- **Versions.** Exact package and Gemini model versions are chosen at implementation time.

Fixed transcript fixtures can be used to develop and test the analysis pipeline, but that does not mean the real YouTube input path is done.

## Documents

| Document | 中文 | English |
| --- | --- | --- |
| Product design | [DESIGN.md](DESIGN.md) | [DESIGN-en.md](DESIGN-en.md) |
| Technical design | [TECHNICAL.md](TECHNICAL.md) | [TECHNICAL-en.md](TECHNICAL-en.md) |

Product requirements are defined by `DESIGN.md`. Changes to product or technical decisions are mirrored across the Chinese and English versions.

## Development

There is no build yet. Once implementation starts, local development uses the Vite dev server, ASP.NET Core, and a local or Docker PostgreSQL instance, with the frontend proxying to the API. The Gemini API key is stored in .NET User Secrets and is never committed or logged.

`Claude.md` and `agent.md` are local collaboration instructions and are intentionally git-ignored.

## Name

余白 (*yohaku*) is the Japanese word for the empty space left on a page — the margin that gives the content room to be understood.
