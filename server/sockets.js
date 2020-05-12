// TODO: when OS upgrade on all machines:
//const url = require('url');
//const query = new URL(req.url).query;
// + get rid of method below

// Node version in Ubuntu 16.04 does not know about URL class
function getJsonFromUrl(url) {
  const query = url.substr(2); //starts with "/?"
  let result = {};
  query.split("&").forEach((part) => {
    const item = part.split("=");
    result[item[0]] = decodeURIComponent(item[1]);
  });
  return result;
}

// Helper to safe-send some message through a (web-)socket:
function send(socket, message) {
  if (!!socket && socket.readyState == 1)
    socket.send(JSON.stringify(message));
}

module.exports = function(wss) {
  // Associative array sid --> socket
  let clients = {};
  wss.on("connection", (socket, req) => {
    const query = getJsonFromUrl(req.url);
    const sid = query["sid"];
    const page = query["page"]; //tournament ID
    const notifyRoom = (code, obj={}) => {
      if (!clients[page]) return;
      Object.keys(clients[page]).forEach(k => {
        if (k == sid) return;
        send(clients[page][k], Object.assign({ code: code }, obj));
      });
    };
    const messageListener = (objtxt) => {
      const obj = JSON.parse(objtxt);
      // Only "notify room" events:
      notifyRoom(obj.code, { data: obj.data });
    };
    const closeListener = () => {
      delete clients[page][sid];
      if (Object.keys(clients[page]).length == 0) delete clients[page];
    };
    if (!clients[page]) clients[page] = {};
    // Since a new SID is generated each time, clients[sid] does not exist yet:
    clients[page][sid] = socket;
    socket.on("message", messageListener);
    socket.on("close", closeListener);
  });
}
