export function maxWeightMatching(edges, maxcardinality=false) {
  if (!edges) return [];
  const nedge = edges.length;
  let nvertex = 0;
  let integerWeights = true;
  for (let [i, j, w] of edges) {
    if (i >= nvertex) nvertex = i + 1
    if (j >= nvertex) nvertex = j + 1
    if (integerWeights && w != Math.floor(w)) integerWeights = false;
  }
  const maxweight = Math.max.apply(null, edges.map(e => e[2]));
  const endpoint =
    [...Array(2*nedge).keys()].map(i => edges[Math.floor(i/2)][i%2]);
  let neighbend = [...Array(nvertex).fill([])];
  for (let k=0; k<nedge; k++) {
    const [i, j, w] = edges[k];
    neighbend[i].push(2*k+1)
    neighbend[j].push(2*k);
  }
  let mate = [...Array(nvertex).fill(-1)];
  let labelend = [...Array(2 * nvertex).fill(-1)];
  let inblossom = [...Array(nvertex).keys()];
  let blossomparent = [...Array(2 * nvertex).fill(-1)];
  let blossomchilds = [...Array(2 * nvertex).fill(null)];
  let blossombase =
    [...Array(nvertex).keys()].concat([...Array(nvertex).fill(-1)]);
  let blossombestedges = [...Array(2 * nvertex).fill(null)];
  let unusedblossoms = [...Array(nvertex).keys()].map(a => a + nvertex);
  let dualvar =
    [...Array(nvertex).fill(maxweight)].concat([...Array(nvertex).fill(0)]);
  // Undefined vars are defined in main loop in the end
  let label = undefined;
  let bestedge = undefined;
  let allowedge = undefined;
  let queue = undefined;
  let blossomendps = [...Array(2 * nvertex).fill(null)];

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
      let b = inblossom[v];
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
    for (const b of path) label[b] = 1;
    return base;
  };

  const addBlossom = (base, k) => {
    let [v, w, wt] = edges[k];
    const bb = inblossom[base];
    const b = unusedblossoms.pop();
    let bv = inblossom[v];
    let bw = inblossom[w];
    blossombase[b] = base;
    blossomparent[b] = -1;
    blossomparent[bb] = b;
    let path = blossomchilds[b] = [];
    let endps = blossomendps[b] = [];
    while (bv != bb) {
      blossomparent[bv] = b;
      path.push(bv);
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
    for (k of blossombestedges[b])
      if (bestedge[b] == -1 || slack(k) < slack(bestedge[b])) bestedge[b] = k;
  };

  const expandBlossom = (b, endstage) => {
    for (const s of blossomchilds[b]) {
      blossomparent[s] = -1;
      if (s < nvertex) inblossom[s] = s;
      else if (endstage && dualvar[s] == 0) expandBlossom(s, endstage);
      else for (let v of blossomLeaves(s)) inblossom[v] = s;
    }
    if (!endstage && label[b] == 2) {
      entrychild = inblossom[endpoint[labelend[b] ^ 1]];
      let j = blossomchilds[b].findIndex(e => e == entrychild);
      if (j & 1) {
        j -= blossomchilds[b].length;
        var jstep = 1;
        var endptrick = 0;
      }
      else {
        var jstep = -1;
        var endptrick = 1;
      }
      let p = labelend[b];
      while (j != 0) {
        label[endpoint[p ^ 1]] = 0;
        label[endpoint[blossomendps[b][j-endptrick]^endptrick^1]] = 0;
        assignLabel(endpoint[p ^ 1], 2, p);
        allowedge[Math.floor(blossomendps[b][j-endptrick] / 2)] = true;
        j += jstep;
        p = blossomendps[b][j-endptrick] ^ endptrick;
        allowedge[Math.floor(p/2)] = true;
        j += jstep;
      }
      const bv = blossomchilds[b][j];
      label[endpoint[p ^ 1]] = label[bv] = 2;
      labelend[endpoint[p ^ 1]] = labelend[bv] = p;
      bestedge[bv] = -1;
      j += jstep;
      while (blossomchilds[b][j] != entrychild) {
        bv = blossomchilds[b][j];
        if (label[bv] == 1) {
          j += jstep;
          continue;
        }
        for (const v of blossomLeaves(bv)) if (label[v] != 0) break;
        if (label[v] != 0) {
          label[v] = 0;
          label[endpoint[mate[blossombase[bv]]]] = 0;
          assignLabel(v, 2, labelend[v]);
        }
        j += jstep
      }
    }
    label[b] = labelend[b] = -1;
    blossomchilds[b] = blossomendps[b] = null;
    blossombase[b] = -1;
    blossombestedges[b] = null;
    bestedge[b] = -1;
    unusedblossoms.push(b);
  };

  const augmentBlossom = (b, v) => {
    let t = v;
    while (blossomparent[t] != b) t = blossomparent[t];
    if (t >= nvertex) augmentBlossom(t, v);
    let i = j = blossomchilds[b].findIndex(e => e == t);
    if (i & 1) {
      j -= blossomchilds[b].length;
      var jstep = 1;
      var endptrick = 0;
    }
    else {
      var jstep = -1;
      var endptrick = 1;
    }
    while (j != 0) {
      j += jstep;
      t = blossomchilds[b][j];
      const p = blossomendps[b][j-endptrick] ^ endptrick;
      if (t >= nvertex) augmentBlossom(t, endpoint[p]);
      j += jstep;
      t = blossomchilds[b][j];
      if (t >= nvertex) augmentBlossom(t, endpoint[p ^ 1]);
      mate[endpoint[p]] = p ^ 1;
      mate[endpoint[p ^ 1]] = p;
    }
    blossomchilds[b] =
      blossomchilds[b].slice(i).concat(blossomchilds[b].slice(0, i));
    blossomendps[b] =
      blossomendps[b].slice(i).concat(blossomendps[b].slice(0, i));
    blossombase[b] = blossombase[blossomchilds[b][0]];
  };

  const augmentMatching = (k) => {
    const [v, w, wt] = edges[k];
    for (let [s, p] of [[v, 2*k+1], [w, 2*k]]) {
      while (true) {
        const bs = inblossom[s];
        if (bs >= nvertex) augmentBlossom(bs, s)
        mate[s] = p;
        if (labelend[bs] == -1) break;
        const t = endpoint[labelend[bs]];
        const bt = inblossom[t];
        s = endpoint[labelend[bt]];
        const j = endpoint[labelend[bt] ^ 1];
        if (bt >= nvertex) augmentBlossom(bt, j);
        mate[j] = labelend[bt];
        p = labelend[bt] ^ 1;
      }
    }
  };

  debugger;
  for (let t=0; t < nvertex; t++) {
    label = [...Array(2 * nvertex).fill(0)];
    bestedge = [...Array(2 * nvertex).fill(-1)];
    allowedge = [...Array(nedge).fill(false)];
    for (let i=nvertex; i < 2 * nvertex; i++) blossombestedges[i] = null;
    queue = [];
    for (let v=0; v<nvertex; v++)
      if (mate[v] == -1 && label[inblossom[v]] == 0) assignLabel(v, 1, -1);
    let augmented = 0;
    let kslack = undefined;
    while (true) {
      while (queue.length > 0 && !augmented) {
        const v = queue.pop();
        for (const p of neighbend[v]) {
          const k = Math.floor(p / 2);
          const w = endpoint[p];
          if (inblossom[v] == inblossom[w]) continue;
          if (!allowedge[k]) {
            kslack = slack(k)
            if (kslack <= 0) allowedge[k] = true;
          }
          if (allowedge[k]) {
            if (label[inblossom[w]] == 0) assignLabel(w, 2, p ^ 1);
            else if (label[inblossom[w]] == 1) {
              const base = scanBlossom(v, w);
              if (base >= 0) addBlossom(base, k);
              else {
                augmentMatching(k);
                augmented = 1;
                break;
              }
            }
            else if (label[w] == 0) {
              label[w] = 2;
              labelend[w] = p ^ 1;
            }
          }
          else if (label[inblossom[w]] == 1) {
            const b = inblossom[v];
            if (bestedge[b] == -1 || kslack < slack(bestedge[b]))
              bestedge[b] = k;
          }
          else if (label[w] == 0) {
            if (bestedge[w] == -1 || kslack < slack(bestedge[w]))
              bestedge[w] = k;
          }
        }
      }
      if (augmented) break
      let deltatype = -1;
      let [delta, deltaedge, deltablossom] = [null, null, null];
      if (!maxcardinality) {
        deltatype = 1;
        delta = Math.min.apply(null, dualvar.slice(0, nvertex));
      }
      for (let v=0; v<nvertex; v++) {
        if (label[inblossom[v]] == 0 && bestedge[v] != -1) {
          const d = slack(bestedge[v]);
          if (deltatype == -1 || d < delta) {
            delta = d;
            deltatype = 2;
            deltaedge = bestedge[v];
          }
        }
      }
      for (let b=0; b < 2 * nvertex; b++) {
        if (blossomparent[b] == -1 && label[b] == 1 && bestedge[b] != -1) {
          kslack = slack(bestedge[b]);
          if (integerWeights) var d = Math.floor(kslack / 2);
          else var d = kslack / 2;
          if (deltatype == -1 || d < delta) {
            delta = d;
            deltatype = 3;
            deltaedge = bestedge[b];
          }
        }
      }
      for (let b = nvertex; b < 2*nvertex; b++) {
        if (
          blossombase[b] >= 0 &&
          blossomparent[b] == -1 &&
          label[b] == 2 &&
          (deltatype == -1 || dualvar[b] < delta)
        ) {
          delta = dualvar[b];
          deltatype = 4;
          deltablossom = b;
        }
      }
      if (deltatype == -1) {
        deltatype = 1;
        delta = Math.max(0, Math.min.apply(null, dualvar.slice(0, nvertex)));
      }
      for (let v=0; v < nvertex; v++) {
        if (label[inblossom[v]] == 1) dualvar[v] -= delta;
        else if (label[inblossom[v]] == 2) dualvar[v] += delta;
      }
      for (let b = nvertex; b < 2*nvertex; b++) {
        if (blossombase[b] >= 0 && blossomparent[b] == -1) {
          if (label[b] == 1) dualvar[b] += delta;
          else if (label[b] == 2) dualvar[b] -= delta;
        }
      }
      if (deltatype == 1) break;
      else if (deltatype == 2) {
        allowedge[deltaedge] = true;
        let [i, j, wt] = edges[deltaedge];
        if (label[inblossom[i]] == 0) [i, j] = [j, i];
        queue.push(i);
      }
      else if (deltatype == 3) {
        allowedge[deltaedge] = true;
        let [i, j, wt] = edges[deltaedge];
        queue.push(i);
      }
      else if (deltatype == 4) expandBlossom(deltablossom, false);
    }
    if (!augmented) break;
    for (let b = nvertex; b < 2*nvertex; b++) {
      if (
        blossomparent[b] == -1 &&
        blossombase[b] >= 0 &&
        label[b] == 1 &&
        dualvar[b] == 0
      ) {
        expandBlossom(b, true);
      }
    }
  }
  for (let v=0; v < nvertex; v++)
    if (mate[v] >= 0) mate[v] = endpoint[mate[v]];
  return mate;
}
