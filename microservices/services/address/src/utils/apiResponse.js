function ok(res, data, message = "OK", status = 200) {
  return res.status(status).json({ success: true, message, data });
}
function fail(res, message, status, details) {
  const finalStatus = status ?? 400;

  return res
    .status(finalStatus)
    .json({ success: false, message, ...(details ? { details } : {}) });
}
module.exports = { ok, fail };
