# Plan

## Tomorrow (2025-10-14)

1. Fix remaining schema validation errors (fields returning empty arrays instead of null/string)
2. Implement data transformation from Platsbanken API format to our database models
3. Save jobs to database with proper upsert logic for Company and JobSourceLink
4. Add date range filtering (published_after parameter) to fetch only new jobs since last sync
5. Set up scheduled job to run sync periodically
