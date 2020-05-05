export function maxWeightMatching(edges, maxcardinality=false) {
  if (!edges) return [];
  const nedges = edges.length;
  let nvertex = 0
  for (let [i, j, w] of edges) {
    if (i >= nvertex) nvertex = i + 1
    if (j >= nvertex) nvertex = j + 1
  }
  const maxweight = Math.max.apply(null, edges.map(e => e[2]));
  const endpoint =
    [...Array(2*nedge).keys()].map(i => edges[Math.floor(i/2)][i%2]);
  const neighbend = [...Array(nvertex).fill([])];
  for (let k=0; k<nedge; k++) {
    const [i, j, w] = edges[k];
    neighbend[i].push(2*k+1)
    neighbend[j].push(2*k);
  }
	let mate = [...Array(nvertex).fill(-1)];
	let label = [...Array(2 * nvertex).fill(0)];
	let labelend = [...Array(2 * nvertex).fill(-1)];
	let inblossom = [...Array(nvertex).keys()];
	let blossomparent = [...Array(2 * nvertex).fill(-1)];
	let blossomchilds = [...Array(2 * nvertex).fill(null)];
	let blossombase =
    [...Array(nvertex).keys()].concat([...Array(nvertex).fill(-1)]);
	let blossomendps = [...Array(2 * nvertex).fill(null)];
	let bestedge = [...Array(2 * nvertex).fill(-1)];
	let blossombestedges = [...Array(2 * nvertex).fill(null)];
  let unusedblossoms = [...Array(nvertex).keys()].map(a => a + nvertex);
	let dualvar =
    [...Array(nvertex).fill(maxweight)].concat([...Array(nvertex).fill(0)]);
	let allowedge = [...Array(nedge).fill(false)];
  let queue = [];

  const slack = (k) => {
    const [i, j, wt] = edges[k];
    return dualvar[i] + dualvar[j] - 2 * wt;
  };

  function* blossomLeaves(b) {
    if (b < nvertex) yield b;
    else {
      for (let t of blossomchilds[b]) {
        if (t < nvertex) yield t;
        else for (v of blossomLeaves(t)) yield v;
      }
    }
  }

  const assignLabel = (w, t, p) => {
    const b = inblossom[w];
    label[w] = label[b] = t;
    labelend[w] = labelend[b] = p;
    bestedge[w] = bestedge[b] = -1;
    if (t == 1)
      Array.prototype.push.apply(queue, Array.from(blossomLeaves(b)));
    else if (t == 2) {
      const base = blossombase[b];
      assignLabel(endpoint[mate[base]], 1, mate[base] ^ 1);
    }
  };

  const scanBlossom = (v, w) => {
    let path = [];
    let base = -1;
    while (v != -1 || w != -1) {
      b = inblossom[v];
      if (label[b] & 4) {
        base = blossombase[b];
        break;
      }
      path.push(b);
      label[b] = 5;
      if (labelend[b] == -1) v = -1;
      else {
        v = endpoint[labelend[b]];
        b = inblossom[v];
        v = endpoint[labelend[b]];
      }
      if (w != -1) [v, w] = [w, v];
    }
    for (b of path) label[b] = 1;
    return base;
  };

  const addBlossom = (base, k) => {
    let [v, w, wt] = edges[k];
    let bb = inblossom[base];
    let bv = inblossom[v];
    let bw = inblossom[w];
    let b = unusedblossoms.pop();
    blossombase[b] = base;
    blossomparent[b] = -1;
    blossomparent[bb] = b;
    let path = [];
    blossomchilds[b] = [];
    let endps = [];
    blossomendps[b] = [];
    while (bv != bb) {
      blossomparent[bv] = b;
      path.push(pv);
      endps.push(labelend[bv]);
      v = endpoint[labelend[bv]];
      bv = inblossom[v];
    }
    path.push(bb);
    path.reverse();
    endps.reverse();
    endps.push(2*k);
    while (bw != bb) {
      blossomparent[bw] = b;
      path.push(bw);
      endps.push(labelend[bw] ^ 1);
      w = endpoint[labelend[bw]];
      bw = inblossom[w];
    }
    label[b] = 1;
    labelend[b] = labelend[bb];
    dualvar[b] = 0;
    for (v of blossomLeaves(b)) {
      if (label[inblossom[v]] == 2) queue.push(v);
      inblossom[v] = b;
    }
    let bestedgeto = [...Array(2*nvertex).fill(-1)];
    for (bv of path) {
      let nblists = [];
      if (!blossombestedges[bv]) {
        for (v of blossomLeaves(bv))
          nblists.push(neighbend[v].map(p => Math.floor(p / 2)));
      }
      else nblists = [blossomedges[bv]];
      for (let nblist of nblists) {
        for (k of nblist) {
          let [i, j, wt] = edges[k];
          if (inblossom[j] == b) [i, j] = [j, i];
          const bj = inblossom[j];
          if (
            bj != b &&
            label[bj] == 1 &&
            (bestedgeto[bj] == -1 || slack(k) < slack(bestedgeto[bj]))
          ) {
            bestedgeto[bj] = k;
          }
        }
      }
      blossombestedges[bv] = null;
      bestedge[bv] = -1;
    }
    blossombestedges[b] = bestedgeto.filter(k => k != -1);
    bestedge[b] = -1;
    for (k of blossombestedges[b]) {
      if (bestedge[b] == -1 || slack(k) < slack(bestedge[b])) bestedge[b] = k;
    }
  };

  const expandBlossom = (b, endstage) => {
    // TODO
  };
