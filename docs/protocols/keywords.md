# Keywords & Search Queries

This document lists the specific keywords and search queries used by the scraping engine to find relevant historical postcards.

## eBay Search Queries

The system executes search queries directly against `ebay.com/sch/i.html`. These queries are designed to maximize the retrieval of authentic, handwritten postcards from specific periods.

### WWI Queries

- `WWI handwritten postcard`
- `World War 1 handwritten postcard`
- `WW1 soldier postcard handwritten`
- `WWI field postcard handwritten`
- `Great War soldier letter postcard`
- `1914-1918 handwritten postcard`

### WWII Queries

- `WWII handwritten postcard`
- `World War 2 handwritten postcard`
- `WW2 soldier postcard handwritten`
- `WWII military postcard handwritten`
- `1939-1945 soldier postcard`
- `World War II field post handwritten`

### Holocaust Queries

- `Holocaust postcard handwritten`
- `concentration camp postcard`
- `ghetto postcard handwritten`
- `Jewish persecution postcard`
- `Holocaust survivor postcard`

## Query Mechanics

- The queries prioritize the word "handwritten" to filter out blank or unused postcards.
- Searching by specific years (e.g., 1914-1918) helps capture listings where the seller might not explicitly use "WWI" or "World War 1".
- The queries are appended with `_sop=10` during scraping to sort strictly by "Newly Listed", ensuring a continuous stream of fresh inventory.
