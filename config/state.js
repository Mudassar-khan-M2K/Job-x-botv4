// Shared state between bot and dashboard
// Avoids circular require imports

let _isConnected = false;
let _startTime = null;

function setConnected(val) {
  _isConnected = val;
  if (val && !_startTime) _startTime = new Date().toISOString();
}

function isConnected() {
  return _isConnected;
}

function getStartTime() {
  return _startTime;
}

module.exports = { setConnected, isConnected, getStartTime };
