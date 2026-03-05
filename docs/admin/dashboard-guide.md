# Admin Dashboard Guide

*Status: Active*

This document details how administrators should operate the admin dashboard, including workflows for reviewing transcriptions, triggering manual scrapes, and managing the ingestion queue.

## Accessing the Dashboard

The admin dashboard is restricted to users with the `admin` role in the database.

1. Authenticate via the OAuth portal.
2. If your `openId` matches the `OWNER_OPEN_ID` in the server environment variables, your account was automatically granted admin rights upon the first login.
3. Access the dashboard via the `/admin` route or the user dropdown menu.

## Dashboard Sections

### 1. Scraping Activity Monitor

- **Purpose**: Tracks the status of automated cron jobs and manual scrapes.
- **Usage**: Shows recent scraping logs, including items found vs. items actually added (after deduplication). If a scrape enters a `failed` state, review the error message displayed in the table.

### 2. Manual Scraper Trigger

- **Purpose**: Force a synchronous scrape instead of waiting for the 6-hour cron scheduler.
- **Usage**:
  - Select a specific **War Period** (WWI, WWII, Holocaust) or leave it set to "All" to execute sequentially.
  - Click the **Start Scraping** button.
  - *Warning*: This process ties up the worker and requires downloading potentially large numbers of hi-res images. Do not close the browser context until the RPC call resolves.

### 3. Transcription Review Interface (Todo Phase 2)

- **Purpose**: Curate, approve, or edit AI OCR outputs.
- **Usage**:
  - Review postcards flagged with low confidence scores (e.g., `< 60%`).
  - Read the attached high-resolution image to manually interpret `[illegible]` tags.
  - Edit the text within the dashboard and click "Approve" to convert the status to `completed` and push it to the live public gallery.

### 4. Listing Management

- **Purpose**: Complete CRUD access to the underlying postcard dataset.
- **Usage**:
  - Use the dataset table to locate specific items.
  - **Edit**: Correct misattributed titles, dates, or prices.
  - **Hide/Delete**: Hard-delete or toggle the `isPublic` visibility boolean to immediately withdraw cards containing highly sensitive or offensive imagery not appropriate for the archive front page.
