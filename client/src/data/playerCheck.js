export function checkPlayer(p) {
  if (!p.elo || !p.elo.toString().match(/^[0-9]+$/))
    return "Elo: positive integer";
  if (!p.name || !p.name.match(/^[\w-]+$/))
    return "User name: alphanumerics, underscore and hyphen";
  return "";
}
