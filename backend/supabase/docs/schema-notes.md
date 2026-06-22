# Supabase Schema Notes

## RLS guidance (server-first)
- Use the Supabase `service_role` key on the server for all writes.
- Enable RLS on all tables and add read-only policies for clients if needed.
- Suggested baseline policies:
  - `rooms`, `room_members`, `room_ready_state`, `room_blacklist`, `room_preferlist`:
    allow `select` to `authenticated` and `anon` (public game browser).
  - History tables (`games`, `rounds`, `round_posts`, `guesses`, `leaderboard_snapshots`):
    allow `select` to `authenticated` and `anon` if you want public history/leaderboards.
  - `players`: restrict `select` to server unless you want public usernames.
- Keep inserts/updates/deletes server-only (service role) for all tables.

## Mapping notes (server -> DB)

### Users / players
- `User.id` -> `players.id` (UUID generated on server or DB)
- `User.username` -> `players.username`
- `User.icon` -> `room_members.icon`
- `User.score` -> `room_members.score`
- `User.roomID` -> `room_members.room_id`

### Room state
- `ServerRoom.id` -> `rooms.id`
- `ServerRoom.name` -> `rooms.name`
- `ServerRoom.owner` -> `rooms.owner_player_id`
- `ServerRoom.postsPerRound` -> `rooms.posts_per_round`
- `ServerRoom.roundsPerGame` -> `rooms.rounds_per_game`
- `ServerRoom.curRound` -> `rooms.cur_round`
- `ServerRoom.postsViewedThisRound` -> `rooms.posts_viewed_this_round`
- `ServerRoom.gameStarted` -> `rooms.game_started`
- `ServerRoom.members` -> `room_members` rows
- `ServerRoom.allUsersReady` -> `room_ready_state`
- `ServerRoom.blacklist` -> `room_blacklist`
- `ServerRoom.preferlist` -> `room_preferlist`

### Posts and tags
- `Post.id` -> `posts.id`
- `Post.url` -> `posts.url`
- `Post.tags[]` -> `post_tags` rows

### Game history
- Game start/end -> `games.started_at` / `games.ended_at`
- Round index -> `rounds.round_index`
- Served post order -> `round_posts.post_order`
- Guess tag + score -> `guesses.guessed_tag`, `guesses.score`
- Leaderboard -> `leaderboard_snapshots.snapshot` (json map of player_id to score)
