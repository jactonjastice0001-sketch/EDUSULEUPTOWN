const path = require('path');

// On Render, mount a persistent disk (e.g. at /var/data) and set DATA_DIR to
// that path — otherwise every deploy/restart wipes users, orders, and menu
// edits, since the container's local filesystem is ephemeral. Locally, this
// just defaults to backend/data as before.
const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, '..', 'data');

// Same idea for uploaded dish photos — point this at a subfolder of the same
// mounted disk in production so images survive redeploys too.
const UPLOAD_ROOT = process.env.UPLOADS_ROOT
  ? path.resolve(process.env.UPLOADS_ROOT)
  : path.join(__dirname, '..', 'uploads');

module.exports = { DATA_DIR, UPLOAD_ROOT };
