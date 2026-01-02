# Historical Postcard Archive

An automated system that scrapes eBay for handwritten postcards related to WWI, WWII, and the Holocaust, transcribes the handwriting using AI OCR, and displays them in a searchable public gallery.

## Features

- **Automated eBay Scraping**: Continuously searches eBay for historical handwritten postcards
- **AI-Powered Transcription**: Uses LLM vision capabilities to transcribe handwritten text
- **Public Gallery**: Searchable and filterable gallery of postcards with transcriptions
- **Admin Dashboard**: Monitor scraping activity, manage postcards, and trigger manual operations
- **Database Storage**: All postcards, images, and transcriptions stored in MySQL database
- **S3 Integration**: Images stored in S3 for reliable, scalable storage

## Tech Stack

- **Frontend**: React 19, Tailwind CSS 4, shadcn/ui
- **Backend**: Node.js, Express, tRPC
- **Database**: MySQL (via Drizzle ORM)
- **Storage**: AWS S3
- **Scraping**: Firecrawl MCP
- **OCR**: OpenAI Vision API

## Getting Started

### Prerequisites

- Node.js 22+
- MySQL database
- AWS S3 bucket
- Firecrawl MCP access

### Installation

```bash
# Install dependencies
pnpm install

# Set up database
pnpm db:push

# Start development server
pnpm dev
```

### Environment Variables

The following environment variables are automatically configured in the Manus platform:

- `DATABASE_URL` - MySQL connection string
- `BUILT_IN_FORGE_API_KEY` - API key for LLM and storage services
- `BUILT_IN_FORGE_API_URL` - API endpoint for built-in services

## Usage

### Public Gallery

Visit `/gallery` to browse all public postcards. Features include:

- Filter by war period (WWI, WWII, Holocaust)
- Search by title and description
- View individual postcard details with transcriptions

### Admin Dashboard

Visit `/admin` to access the admin dashboard (requires admin role). Features include:

- **Manual Scraper**: Trigger eBay scraping on demand
- **Transcription Processing**: Process pending transcriptions
- **Scraping Logs**: Monitor recent scraping activity
- **Postcard Management**: View, edit, hide/publish, or delete postcards

### Automated Scheduling

The system includes scheduled tasks for automated operation:

#### Option 1: Using Manus Schedule Tool (Recommended)

The Manus platform provides a built-in scheduling system. To set up automated tasks:

1. Use the Manus schedule tool to create recurring tasks
2. Schedule `runScheduledScrapeAndTranscribe` to run every 6 hours
3. The function is exported from `server/scheduledTasks.ts`

Example schedule configuration:
- **Task**: Scrape and Transcribe
- **Frequency**: Every 6 hours (4 times daily)
- **Function**: `runScheduledScrapeAndTranscribe`

#### Option 2: Manual Cron Setup

If deploying outside Manus, create a cron job:

```bash
# Edit crontab
crontab -e

# Add this line to run every 6 hours
0 */6 * * * cd /path/to/postcard-archive && node -e "require('./dist/scheduledTasks.js').runScheduledScrapeAndTranscribe()"
```

#### Available Scheduled Functions

- `runScheduledScrapeAndTranscribe()` - Runs both scraping and transcription
- `runScheduledScrape()` - Scraping only
- `runScheduledTranscription()` - Transcription only

## Database Schema

### Tables

- **postcards**: Main postcard listings with metadata
- **postcardImages**: Images associated with postcards (S3 references)
- **transcriptions**: OCR transcriptions of handwritten text
- **scrapingLogs**: Activity logs for monitoring
- **users**: User authentication and roles

### War Periods

- `WWI` - World War I (1914-1918)
- `WWII` - World War II (1939-1945)
- `Holocaust` - The Holocaust (1933-1945)

## API Endpoints (tRPC)

### Public Procedures

- `postcards.list` - List all public postcards with filters
- `postcards.getById` - Get single postcard with images and transcriptions
- `postcards.searchByTranscription` - Search postcards by transcribed text

### Admin Procedures

- `admin.scraper.run` - Manually trigger scraper
- `admin.scraper.logs` - Get recent scraping logs
- `admin.transcription.processAll` - Process pending transcriptions
- `admin.postcards.listAll` - List all postcards (including hidden)
- `admin.postcards.update` - Update postcard metadata
- `admin.postcards.delete` - Delete postcard

## Design

The application uses a **Scandinavian minimalist aesthetic**:

- **Colors**: Pale cool gray background with bold black text
- **Typography**: Bold sans-serif for primary text, thin subtitles
- **Accents**: Soft pastel blue and blush pink geometric shapes
- **Spacing**: Generous negative space throughout

## Development

### Running Tests

```bash
pnpm test
```

### Database Migrations

```bash
# Generate and apply migrations
pnpm db:push
```

### Type Checking

```bash
pnpm check
```

## Deployment

1. Create a checkpoint: The admin should save a checkpoint from the Manus UI
2. Click "Publish" in the Manus UI to deploy
3. Set up automated scheduling using the Manus schedule tool
4. Configure custom domain (optional)

## Troubleshooting

### Scraper Not Finding Results

- Check Firecrawl MCP connection
- Verify eBay search URLs are accessible
- Review scraping logs in admin dashboard

### Transcription Failures

- Ensure images are properly uploaded to S3
- Check LLM API quota and rate limits
- Review transcription status in admin dashboard

### Database Connection Issues

- Verify `DATABASE_URL` environment variable
- Check database server status
- Ensure migrations are applied

## License

MIT

## Contributing

This is an automated archival project. Contributions welcome for:

- Additional search queries for better coverage
- Improved OCR accuracy
- Enhanced filtering and search capabilities
- Historical context and metadata enrichment
