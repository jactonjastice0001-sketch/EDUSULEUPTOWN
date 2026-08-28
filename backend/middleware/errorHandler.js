// Centralized error handler — never leaks stack traces or internals to the client.
function notFound(req, res, next) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Multer file-upload errors (bad type, too large) should surface as 400s with
  // their real message, not a generic 500.
  const isUploadError = err.name === 'MulterError' || /image|file/i.test(err.message || '');
  const status = err.status || (isUploadError ? 400 : 500);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  } else {
    console.error(err.message);
  }
  res.status(status).json({
    error: status === 500 ? 'Something went wrong on our end. Please try again.' : err.message,
  });
}

module.exports = { notFound, errorHandler };
