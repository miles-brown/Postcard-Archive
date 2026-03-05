# OCR & Transcription Pipeline

This document details the pipeline for transcribing the handwritten content on scraped postcards into searchable database text.

After items are successfully stored in the database, their text must be transcribed. Items begin their lifecycle with a `transcriptionStatus: "pending"`.

## Vision Processing Engine

The transcription engine queries the database for all pending postcards. It passes their high-resolution S3 images sequentially to **Gemini 2.5 Flash** (via Forge API connection) acting as an OCR engine.

### System Prompt

The LLM is fed the following system prompt to coerce exact transcription behavior without conversational fluff:

> "You are an expert at reading and transcribing historical handwritten text from postcards. Transcribe the handwritten text exactly as it appears, preserving line breaks and formatting. If text is unclear or illegible, indicate with [illegible]. Include any dates, signatures, or addresses you can identify. Respond with ONLY the transcribed text, no additional commentary."

### Vision Limitations Filter

The user prompt passed with the image includes the message, *"Please transcribe all handwritten text visible in this postcard image. Include any dates, addresses, messages, and signatures."*

It asks the API to process at `detail: "high"` to ensure maximum readability of faint cursive ink.

## Processing & Scoring

### Confidence Scoring

Handwriting is infamously difficult to process reliably. As a fallback mechanism, the LLM is instructed to place an `[illegible]` tag wherever it fails to confidently read the cursive.

A backend algorithm calculates an objective confidence score from this:
`((totalWords - illegibleCount) / totalWords) * 100`

This assigns a solid numerical value to the accuracy of a transcription, which gets saved back to the database as a percentage object.

### Language Detection

Because the postcards are sourced from European conflicts, they frequently contain mixed scripts. The backend parses the resulting text against Regex heuristics to determine the likely dominant language of the postcard:

- **German (`de`)**: Requires `/[äöüß]/i`
- **French (`fr`)**: Requires `/[àâçéèêëîïôùûü]/i`
- **English (`en`)**: Default fallback if no foreign special characters are noted.

## Completion Status

After a processing attempt, the postcards status is either updated to `"completed"` or `"failed"` depending on image count processing successes.
