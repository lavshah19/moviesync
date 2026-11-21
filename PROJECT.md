# moviesync

A private app for two people to recommend movies to each other.

## Users
- Exactly two accounts, one per role: `jyotsan` and `dipika`.
- Accounts have a **username** and a password (no email). Usernames are people's names:
  letters, numbers, spaces and `. _ -`, 2–30 characters. They're stored normalised (trimmed,
  single spaces, lowercase), so they're unique ignoring case and logging in as
  "Jyotsan  HAMAL" finds "jyotsan hamal". Taken: `409 That username is already taken.`
- The role is picked at registration. Once a role is taken, registering with it again is
  rejected (`409 This role is already taken`). Enforced by a unique index on `User.role`.

## Screen (home page `/`, login required)
Two columns side by side (stacked on mobile), one per person:

| Jyotsan's column            | Dipika's column             |
|-----------------------------|-----------------------------|
| movies Dipika suggested     | movies Jyotsan suggested    |
| input: only Dipika sees it  | input: only Jyotsan sees it |

- You **cannot add** to your own column. The input box appears only in the other person's
  column.
- Each movie shows its name and year, when it was suggested, and when it was watched.
- An edited movie shows an "edited" label (hover shows when it was edited).

## Who can do what

| Action                        | Column owner | The recommender |
|-------------------------------|:------------:|:---------------:|
| Add a movie                   | no           | yes             |
| Tick / untick "watched"       | yes          | no              |
| Delete the movie              | no           | yes             |
| Edit the movie text           | no           | yes, only until watched |

- The recommender can delete a movie even after it was marked watched.
- Editing is allowed only while the movie is not watched. Once ticked, the recommender can
  only delete it (otherwise the owner's tick would point at a different movie).
  Editing a watched movie returns `409 Already watched, can't edit`.
- Rules are enforced on the backend; the UI only hides buttons the user can't use.

## Movie format
- Input must be `Name - YYYY`, e.g. `Titanic - 1997`.
- Spaces around the dash are optional: `Titanic-1997` and `Titanic -1997` are accepted and
  saved as `Titanic - 1997`.
- Names may contain dashes: `Spider-Man - 2002` parses as name `Spider-Man`, year `2002`
  (the last ` - YYYY` is the year).
- En/em dashes (`–`, `—`) are accepted too: phone keyboards auto-replace `-`.
- Regex: `^(.+?)\s*[-–—]\s*(\d{4})$`, then the name is trimmed, inner spaces collapsed, and it
  must contain a letter or digit (max 200 characters).
- Year range: 1888 to next year.
- Same validation on the frontend (zod, instant feedback) and the backend (zod, the real check).
- Applies to both adding and editing.

## Duplicates
- The same name and year can't be in the same column twice, ignoring case
  (`titanic - 1997` = `Titanic - 1997`). Reply: `409 Already in their list`.
- The same movie may be in both columns.
- Also checked on edit (editing into a movie already in that column is rejected).
- Enforced by a unique index on `(forRole, title, year)` with case-insensitive collation.

## Timestamps
- `createdAt`: when the movie was suggested.
- `editedAt`: when the recommender last edited it, `null` if never. `createdAt` is never
  changed by an edit, so the original suggestion date is kept.
- `watchedAt`: when it was ticked. Unticking sets it back to `null`.
  `watched` is simply `watchedAt !== null`.
- Ticking an already-watched movie changes nothing (the first `watchedAt` is kept).

## Data model: `Movie`

| Field     | Type                     | Notes                                   |
|-----------|--------------------------|-----------------------------------------|
| title     | string                   | trimmed, e.g. `Titanic`                 |
| year      | number                   | 1888 to next year                       |
| forRole   | `jyotsan` \| `dipika`    | whose column it is in                   |
| addedBy   | ObjectId -> User         | the recommender                         |
| editedAt  | Date \| null             | null = never edited                     |
| watchedAt | Date \| null             | null = not watched                      |
| createdAt | Date                     | from `timestamps: true`                 |

## API (all require login, under `/api/movies`)

| Method | Path                 | Body                     | Who                         |
|--------|----------------------|--------------------------|-----------------------------|
| GET    | `/movies`            | -                        | both; returns both columns  |
| POST   | `/movies`            | `{ "movie": "Titanic - 1997" }` | adds to the OTHER person's column |
| PATCH  | `/movies/:id`        | `{ "movie": "Titanic - 1997" }` | recommender only (else 403), only if not watched (else 409) |
| PATCH  | `/movies/:id/watched`| `{ "watched": true }`    | column owner only (else 403) |
| DELETE | `/movies/:id`        | -                        | recommender only (else 403) |

- The server decides the column on POST (`forRole` = the other role); the client never sends it.

## Updates (realtime)
- Socket.IO on the backend's own port. The socket only **pushes**; every write still goes
  through the HTTP API (one place for validation, permissions and errors).
- Auth: the browser calls `GET /api/auth/socket-ticket` (cookie) for a 60-second ticket and
  sends it in the handshake (`auth: { ticket }`). Tickets carry `purpose: "socket"`, so a
  ticket can't be used as an access token or the other way round. Refused handshakes reply
  `NO_TICKET`, `INVALID_TICKET` or `USER_NOT_FOUND`.
- The browser connects to the backend **directly** (Vercel rewrites don't proxy WebSockets),
  so the backend's `CORS_ORIGIN` must list the frontend origin.
- Both people share one room (`board`). Events, sent after a successful write only:

| Event           | Payload                         | When                          |
|-----------------|---------------------------------|-------------------------------|
| `movie:created` | `{ movie }`                     | a movie is suggested          |
| `movie:updated` | `{ movie }`                     | edited, ticked or unticked    |
| `movie:deleted` | `{ id, forRole }`               | removed                       |

- The sender receives its own events too (its other tabs stay in sync); clients apply them
  idempotently (upsert / remove by id).
- Fallback: the list also reloads when the tab regains focus, so a missed event heals itself.
- Code: `backend/src/socket/` (`index.ts` server + `broadcast`, `auth.ts` handshake,
  `events.ts` the contract). Checked by `npm run test:e2e` (`scripts/socket.e2e.ts`).
- Frontend: `frontend/src/modules/socket/` (`events.ts` mirrors the backend contract,
  `api/` fetches the ticket, `hooks/useSocket.ts` owns the connection). `useMovies` applies
  the events to the board. No connection indicator is shown: a "Live" dot read as "the other
  person is online", which it isn't (see Future plans: presence). `useSocket` still returns
  the status for when presence is built.
  - Connects while the board is mounted (logged in), disconnects on logout.
  - Fresh ticket on every connect; a refused handshake is retried after 5s.
  - Refetches the list after every reconnect, and reconnects at once when the browser reports
    it's back online (Socket.IO's own heartbeat can take ~45s to notice a dead connection).
  - Env: `NEXT_PUBLIC_SOCKET_URL` = the backend URL (default `http://localhost:3002`). It is
    baked in at build time, so set it on Vercel before building.

## Long lists (decision: no pagination)
- `GET /movies` returns every movie in one request. Two people add maybe a few hundred movies a
  year (~100 KB of JSON), which loads in milliseconds.
- On screen, each column scrolls inside its own ticket; on desktop the page itself never scrolls.
- Cursor pagination / infinite scroll was considered and rejected for now. It would complicate:
  - the counts ("8 to watch · 2 watched", the greeting line), which would need extra count queries;
  - the two-part sort (unwatched by `createdAt`, then watched by `watchedAt`), where ticking a
    movie moves it between parts and a cursor can skip or repeat items;
  - the reload on tab focus, which would have to refetch every loaded page.
- If a column gets long, step 1 is a frontend-only "Show watched (N)" fold (watched movies are
  what piles up).
- Step 2, only past roughly 1,000 movies per column: per-column fetches,
  `GET /movies?forRole=…&cursor=<createdAt,_id>`, plus a small summary endpoint for the counts.

## Code layout
- Backend: `backend/src/modules/movie/` with `models`, `validator`, `repository`, `services`,
  `controller`, `routes`, mounted in `backend/src/routes/index.ts`.
- Frontend: `frontend/src/modules/movie/` with `api`, `components`, `hooks`, `schema`, `types`;
  the two columns render on `frontend/src/app/page.tsx` inside `AuthGuard`.

## Future plans

### Presence: "Dipika is here"
Not built yet. A "Live" connection dot was tried and removed: it only meant *your own*
connection was up, and both of us read it as "the other person is online".

- Show the other person's status next to the greeting: "**Dipika is here**" (green dot) while
  connected, "Dipika was here 2h ago" (grey) when not, from a `lastSeen` time.
- Backend (`src/socket/`): count open sockets per user (two tabs = still one person). On the
  first connect broadcast `presence:update { role, online: true }`; on the last disconnect
  save `User.lastSeen` and broadcast `{ role, online: false, lastSeen }`. Send the current
  state to a socket when it connects, so a fresh page doesn't start blank.
- Frontend: a `presence` handler in `useSocket`, a small `Presence` component in
  `modules/socket/components/`. If an own-connection hint is wanted too, word it so it
  can't be mistaken for presence (e.g. only show "Reconnecting…" while offline).
- Edge cases: a phone going to sleep disconnects after the ~45s heartbeat, so "online" can lag
  that long; rapid reconnects shouldn't flicker (wait a few seconds before showing "offline").
