# Yohaku Product Design Document

## 1. Purpose

This document defines the initial product direction and minimum viable product (MVP) scope for Yohaku. It focuses on product goals, the core experience, and functional requirements without discussing technical implementation.

## 2. Product Concept

Yohaku helps people learn Japanese through authentic Japanese YouTube content.

The product goes beyond translation. It helps users understand the vocabulary, grammar, natural expressions, tone, and context behind each sentence, turning content consumption and language learning into one continuous experience.

### One-line positioning

> Yohaku is a sentence-by-sentence comprehension tool for learning Japanese through authentic YouTube content.

## 3. Target Users

Yohaku is for anyone who wants to improve their Japanese by learning from authentic Japanese content.

The MVP does not segment users by JLPT level, proficiency, or area of interest. Learners at different levels can decide which explanations they need while using the product.

## 4. Problem to Solve

When watching authentic Japanese videos, learners often have to pause repeatedly and switch between subtitles, translation tools, dictionaries, grammar references, and general-purpose AI. The information is fragmented and often fails to explain what a sentence means in its immediate context.

The core problem Yohaku addresses is:

> Learners do not simply lack translations. They lack a continuous viewing experience that identifies and explains important Japanese learning points at the moment they appear.

## 5. Product Principles

### 5.1 Authentic content first

Users learn from Japanese YouTube videos they genuinely want to watch, rather than from a predefined course.

### 5.2 Understanding over translation

Translation communicates the meaning of a sentence. Yohaku's primary value is explaining why the Japanese sentence carries that meaning and what makes it worth learning.

### 5.3 AI as a content analyst, not a tutor

AI is used only to identify Japanese learning points and produce structured explanations. The MVP does not include open-ended chat or a conversational AI tutor.

### 5.4 Quality over quantity

The AI does not need to force a learning point into every sentence. Ordinary sentences may contain no notable points. For useful sentences, the AI should generally select only the one to three most valuable points.

### 5.5 Keep viewing and learning connected

Users should be able to move naturally between watching and deeper understanding without leaving the video or searching in another tool.

## 6. Core User Scenario

1. The user pastes a link to a Japanese YouTube video.
2. Yohaku displays the video and organizes its content into time-synchronized Japanese sentences.
3. The current Japanese sentence and its translation appear below the video.
4. The learning panel on the right accumulates new AI-selected learning points as the video progresses.
5. The user can keep watching or pause to read a detailed explanation.
6. Every learning point identified by the AI is collected automatically.
7. Yohaku organizes the collected material into a learning summary for the full video.

## 7. Core Screen Design

### 7.1 Video area

- Displays the YouTube video and basic playback controls.
- Video time is the shared reference for sentences and learning points.

### 7.2 Sentence and translation area

- Appears below the video.
- Displays the Japanese sentence at the current playback position.
- Translation is visible by default and can be hidden by the user.
- Translation should prioritize natural meaning over word-for-word rendering.
- The user can select Traditional Chinese or English as the translation language.

### 7.3 AI learning panel

- Appears to the right of the video as a vertically scrollable, cumulative feed.
- New learning points are appended as the video progresses. Older points are not replaced by the next sentence.
- Each learning point retains its source sentence and video timestamp so that its original context remains clear.
- No point is added when a sentence contains nothing especially useful to learn.
- Selecting a learning point pauses the video and shows its full explanation.
- When playback resumes, the panel continues accumulating new points with the video.

## 8. AI Learning Points

The AI may identify one or more of the following:

- **Vocabulary:** The meaning of a word in the current sentence, rather than only a dictionary definition.
- **Grammar:** How a grammar pattern shapes the meaning of the sentence.
- **Expressions:** Natural, common, or characteristically Japanese ways of phrasing something.
- **Tone:** Whether the sentence is direct, soft, casual, formal, uncertain, or carries another attitude.
- **Context:** Implications, cultural conventions, or speaker intent beyond the literal wording.

Each learning point should:

- Be directly relevant to the current sentence.
- Clearly explain why it is worth learning.
- Use concise, accessible language.
- Avoid repetitive, mechanical, or low-value analysis.
- Use the user's selected explanation language.

## 9. Learning Summary

The summary is an organized version of every AI-selected learning point in the video. It does not depend on users manually saving items.

The summary should:

- Automatically include every learning point identified by the AI.
- Merge duplicate or highly similar points.
- Group items into vocabulary, grammar, expressions, and tone/context.
- Retain the relevant Japanese sentence, translation, and video timestamp.
- Let users return from a learning point to the relevant moment in the video.

Its purpose is to turn the learning value discovered during viewing into a useful review note. It is not a generated course, quiz, or learning score.

## 10. Language Support

The MVP supports the following translation and explanation languages:

- Traditional Chinese
- English

Once a language is selected, translations, vocabulary notes, grammar explanations, and contextual analysis should all use that language. Traditional Chinese and English do not need to appear at the same time.

## 11. MVP Scope

The MVP includes:

1. Inputting a single YouTube video link.
2. Playing the video.
3. Displaying time-synchronized, sentence-level Japanese content.
4. Showing the Japanese sentence and a translation, visible by default, below the video.
5. Selecting Traditional Chinese or English for translations and explanations.
6. Using AI to select sentences and learning points worth studying.
7. Accumulating vocabulary, grammar, expression, tone, and context notes in a panel on the right.
8. Pausing the video and opening a full explanation when a learning point is selected.
9. Automatically creating a learning summary for the full video.
10. Returning to the relevant video timestamp from a learning point or the summary.

## 12. Out of Scope for the MVP

- Articles, podcasts, audio, videos, or documents outside YouTube.
- Open-ended AI tutoring or free-form chat.
- User segmentation by proficiency, JLPT level, or interests.
- Personalized curricula or learning paths.
- Quizzes, exercises, and learning scores.
- Flashcards and spaced repetition.
- Manual notes, tags, or complex summary editing.
- Social features, leaderboards, or content sharing.
- Automatically generated full courses.

## 13. Differentiation

### General translation tools

Translation tools primarily answer, “What does this sentence mean?” Yohaku also explains, “Why does this Japanese sentence convey that meaning, and what is worth learning from it?”

### General-purpose AI and AI tutors

General-purpose AI requires users to copy sentences, formulate questions, and evaluate the answers themselves. Yohaku proactively identifies valuable material within the video's context and presents it in a consistent structure without requiring a conversation.

### Traditional subtitle tools

Subtitle tools help users follow the content. Yohaku connects subtitles, language analysis, and video timestamps to support both exploration during playback and review afterward.

## 14. How to Judge MVP Success

The MVP should first validate these assumptions:

- Users are willing to bring Japanese YouTube videos they want to watch into Yohaku.
- The curated learning points help users understand sentences that would otherwise stop them.
- Users can return naturally to the video after reading an explanation without feeling that learning has disrupted viewing.
- The automatically generated summary is valuable enough to revisit after watching.
- Users see clear value beyond bilingual subtitles or a general translation tool.

