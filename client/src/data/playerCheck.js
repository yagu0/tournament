export function checkPlayer(p) {
  if (!p.elo.toString().match(/^[0-9]+$/))
    return "Elo: positive integer";
  if (!p.name.match(/^[\w-]+$/))
    return "User name: alphanumerics, underscore and hyphen";
  return "";
}
