# moviesync

A private app for two people to recommend movies to each other.

## Users
- Exactly two accounts, one per role: `jyotsan` and `dipika`.
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

## Updates
- For now: the list loads on page load and reloads when the tab regains focus.
- Later: realtime with sockets (the backend already has `/auth/socket-ticket`).

## Code layout
- Backend: `backend/src/modules/movie/` with `models`, `validator`, `repository`, `services`,
  `controller`, `routes`, mounted in `backend/src/routes/index.ts`.
- Frontend: `frontend/src/modules/movie/` with `api`, `components`, `hooks`, `schema`, `types`;
  the two columns render on `frontend/src/app/page.tsx` inside `AuthGuard`.
