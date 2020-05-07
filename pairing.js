// Idea: load data first (from remote CSV file named according to tournament ID),
// at first loading.
// Also connect to websocket server, with room ID this tournament.
// Then, send and receive events:
//  - chat
//  - result (including forfeit) --> if received, notify/alert/ask confirmation
//           timeout to confirm: after timeout without action, consider it confirmed.
//           timeout is 60 seconds?
//           if result confirmed: now send to the room, result is validated.
//           If disagreement, ask the room for decision.
//           Allow voting for a result: if a player should but doesn't accept a result,
//           like a loss or forfeit, ask the room, and everyone can vote (need game link).
//           After a forfeit without opponent action, player is out until he re-join.
//           [TODO: think about if neither player start the game, abandoned
//           --> If a game has no link... ? I think a supervisor is required
//           ==> admin(s) --> supervisor(s) --> users
//           need a 'Users' view with action "grant/revoke supervisor role"]
//  - new pairing (only forward): update view.
//  (with buttons "view(give/fix link)" [using provided game link if any],
//  and "give result[or vote, if not playing here but in tournament]")
// + button "launch new round" (active when all results given and confirmed)
// + button "pause tournament" => quit for a few rounds maybe
//          (but only players present initially can play)
// *****
// In the end when nbRounds == tournament.totalRounds, button "next round" is
// removed and a new tab appear with final computed grid. Always computed locally,
// either from data if was playing, or from CSV if open finished tournment page.
// *****
// Need users system + basic database with Tournament + Players.
// Can enter tournament and quit, modify rating at any moment before tournament starts.
// CSV file is generated at tournament beginning, with registered Players + level
// *****
// Vue: 3 stages, upcoming, running and completed.
// upcoming: show currently registered players (+ allow edit/remove)
//   --> known by looking at tournament datetime
// running: described above (+ chat) --> known if nbRounds < tournament.nbRounds
// finished: just compute and show grid (from CSV file).
