// Random (enough) string for socket and game IDs
export function getRandString() {
  return (
    Date.now().toString(36) +
    Math.random()
      .toString(36)
      .substr(2, 7)
  ).toUpperCase();
}

export function randInt(min, max) {
  if (!max) {
    max = min;
    min = 0;
  }
  return Math.floor(Math.random() * (max - min)) + min;
}

// Inspired by https://github.com/jashkenas/underscore
export function sample(arr, n) {
  n = n || 1;
  let cpArr = arr.map(e => e);
  for (let index = 0; index < n; index++) {
    const rand = randInt(index, arr.length);
    [ cpArr[index], cpArr[rand] ] = [ cpArr[rand], cpArr[index] ];
  }
  return cpArr.slice(0, n);
}

export function shuffle(arr) {
  return sample(arr, arr.length);
}
