# TV CMS System

I have created a Content Management System and published catalog viewer

Here the system seperates content management from content consumption
- Editors manage draft content in the CMS.
- Admins can publish validated content.
- The viewer reads only the generated published catalogue.
- PostgreSQL is the source of truth for CMS data.
- `catalogue.json` is the published snapshot consumed by the viewer.

## Architecture
```text
                    ┌─────────────────┐
                    │   CMS UI        │
                    │ React + TS      │
                    └────────┬────────┘
                             │
                             │ HTTP
                             ▼
                    ┌─────────────────┐
                    │ FastAPI Backend │
                    └───────┬─────────┘
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
        ┌──────────────┐       ┌────────────────┐
        │ PostgreSQL   │       │ Storage        │
        │              │       │ Abstraction    │
        │ Draft data   │       │                │
        │ Published    │       │ Local storage  │
        │ status       │       │ / R2-ready     │
        └──────────────┘       └────────────────┘
                │
                │ Publish
                ▼
        ┌──────────────────┐
        │ catalogue.json   │
        │ Published        │
        │ snapshot         │
        └────────┬─────────┘
                 │
                 │ HTTP GET
                 ▼
        ┌──────────────────┐
        │ Viewer UI        │
        │ React + TS       │
        └──────────────────┘

```
## Roles & Permissions
#### Editor 
Can perform CRUD operations on the data but can not publish data to catalog.json file.
#### Admin
Can perform CRUS operations on the data and can publish data to catalog.json file.

The roles distinction is also done in fasAPI preventing manual api calls and role overwrites.

## How to Run
### Prerequisites
- Docker
- Docker Compose
- Git

### Environment
Copy the example environment file:
```bash
cp .env.example .env
```
### Start the Application
```bash
docker compose up --build
```

### Health Checkups
The backend exposes
```
GET /health
```

## Overall Content Flow
```text
Seed source data
        ↓
PostgreSQL draft records
        ↓
Editor searches / filters content
        ↓
Editor manages artwork
        ↓
Artwork validation
        ↓
Admin publishes
        ↓
catalogue.json generated
        ↓
Viewer reads published catalogue
        ↓
User browses / searches / filters
        ↓
User opens show details
```

## Environment Variables
All configurable environment variables are documented in:
``` .env.example ```
Local development uses a .env file that is excluded from Git.
In production, secrets should not be committed to the repository. They should be provided through the deployment platform's secret manager/environment configuration.

## Part E — Written

### 1. Atomic Publishing
Publishing first constructs the complete catalogue in memory.
The catalogue is written to a temporary file:
- catalogue.json.tmp
and only after the write completes is it moved into place using an atomic replacement.
This prevents viewers from reading a partially-written catalogue.
If the process dies before the replacement happens, the existing published catalogue remains available. The incomplete temporary file does not replace the last known-good published catalogue.

### 2. Storage Abstraction
Artwork storage is accessed through a storage abstraction rather than directly coupling the application to the filesystem.
Currently, artwork is stored on local disk.

To move to Cloudflare R2, the storage implementation would be replaced with an R2-backed implementation using the same storage interface.
The rest of the application would continue to call the storage abstraction instead of knowing whether the underlying storage is local disk or object storage.
The main changes would therefore be:

- R2 credentials/configuration
- R2 bucket configuration
- R2 upload implementation
- Public/object URL handling

The database would continue storing the artwork metadata/path needed by the application.

### 3. Search
The CMS search operates against PostgreSQL because the CMS is working with draft and editable data.

The viewer search operates against the published catalogue because the viewer is intentionally restricted to published data.
For a small catalogue, searching the in-memory published catalogue is simple and inexpensive.

This approach eventually stops being appropriate when the catalogue becomes large enough that downloading and scanning the entire catalogue for every viewer session becomes expensive in bandwidth, memory and client-side processing.

At that point, I would move search to a dedicated backend/search service while keeping the published catalogue approach for normal browse requests.

### 4. Why a Pre-published Catalogue?
The viewer could query PostgreSQL for every request, but that would couple the public viewer directly to the CMS database.
A pre-published catalogue provides a stable snapshot of approved content.

Benefits include:
- Fast reads
- Simple viewer architecture
- No direct database access from the public viewer
- Clear separation between draft and published state
- Easy rollback to a previous catalogue snapshot

The trade-off is that changes are not visible to viewers until another publish operation occurs.

### 5. What I Left Out + AI Usage
- Cloud Deployment
- Polishing UI
- Advanced user authentication ( my main goal was to show that roles work in their own access)

AI was used for generating code snippets for better time mangement and for debugging.
I spent time learnign and understadning the complete process by myself since CMS and docker both were a new technology for me.
I have added photos of my own notes while I was trying to understand the problem statement as a proof of work in the folder Proof_of_Work. 

### 6. Condition to accept Ep as Draft
```bash
has_artwork = len(ep.artworks) > 0
has_duration = ep.duration_seconds is not None and ep.duration_seconds > 0

if not has_artwork or not has_duration:
    # blocked
    continue
```

## Time Spent
```text
| Part                    | Approx. Time |
| ----------------------- | ------------ |
| Concept, Prblm Statement| 6 hours      |
| Backend & database      | 3 hours      |
| CMS UI                  | 2 hours      |
| Viewer UI               | 2 hours      |
| Docker / infrastructure | 1 hour       |
| Debugging & integration | 6 hours      |
| README / documentation  | 20 minutes   |
| Total                   | 20.20 hours  |
```

## Screen Recording
Here I add a drive link which contains the screen recording for the project
```text
https://www.loom.com/share/3d138b0722d44e7b8afb4cfa9ff6c4c8
```

