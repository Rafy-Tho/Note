# Search Design

## Purpose

This document defines how the MVP searches notes by title, content, and tags.

## Search Decision

Use PostgreSQL full-text search for the MVP. Do not add a dedicated search service.

```text
Query
  -> Normalize and validate
  -> Scope to authenticated user
  -> Filter Active and Archived notes
  -> Search PostgreSQL document
  -> Rank and paginate results
```

## Searchable Data

The search document contains:

- Note title
- Plain text extracted from the rich-text content
- Associated tag names

Rich-text markup itself is not searched as raw HTML or raw JSON.

The search document must be updated in the same transaction when title, content, or tag associations change.

## Search Scope

Normal search must apply these filters before returning results:

```text
note.user_id = authenticated_user_id
note.state IN (active, archived)
```

Trashed notes are excluded. Users access them through the Trash endpoint.

## Query Behavior

- Trim leading and trailing whitespace.
- Reject an empty query instead of performing an unrestricted search.
- Normalize query input using the selected PostgreSQL text-search configuration.
- Treat search input as data, not executable SQL.
- Return an empty result when no authorized note matches.
- Apply the API pagination limit, with a maximum of 100 results per page.

## Ranking and Ordering

Use weighted search fields:

1. Title matches have the highest weight.
2. Tag matches have the next-highest weight.
3. Content matches have the lowest weight.

Order results by search rank descending, then `updated_at` descending.

The response should identify the note and matching metadata without returning unnecessary private content.

## Indexing

Use a PostgreSQL full-text search vector and a GIN index. Maintain supporting indexes for:

- `(user_id, state)`
- `(user_id, updated_at)`
- Tag associations used by the search document

The exact text-search configuration and vector maintenance mechanism are implementation details for the database and API implementation.

## Authorization

Ownership filtering is mandatory and cannot be added only after searching. The query must restrict results to the authenticated user before data is returned.

Requests with an invalid or inaccessible resource must not reveal another user's note, tag, title, or content.

## Failure Handling

- Invalid query: return a validation error.
- No matches: return a successful empty collection.
- Database/search failure: return a safe server error without query or database details.
- Timeout: stop the request and return a retryable error when safe.

## Performance Target

Search must meet the NFR-03 p95 target of 500 ms or less under the defined MVP dataset and test load.

Measure search using realistic numbers of notes, content, and tags rather than an empty database.

## Testing

Test at minimum:

- Title matches.
- Content matches.
- Tag matches.
- Active and Archived inclusion.
- Trashed-note exclusion.
- User A cannot see User B results.
- Empty and invalid queries.
- Pagination and result ordering.
- Search performance under the defined test dataset.

## Requirement Mapping

| Search decision | Requirements |
| --- | --- |
| Search title, content, and tags | FR-28, US-20, US-21 |
| Ownership isolation | FR-29, FR-43, NFR-09, NFR-10, NFR-34 |
| Empty results and Trash exclusion | FR-30, FR-31, NFR-38 |
| PostgreSQL performance | NFR-02, NFR-03, NFR-07, NFR-25 |

## Out of Scope

- Dedicated search infrastructure
- Cross-user search
- Searching Trashed notes through normal search
- AI or semantic search
- Advanced fuzzy matching
- Search suggestions
