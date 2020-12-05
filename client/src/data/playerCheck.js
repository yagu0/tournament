export function checkPlayer(p) {
  if (!p.elo || !p.elo.toString().match(/^[0-9]+$/))
    return "Elo: positive integer";
  return "";
}
