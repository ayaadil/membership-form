module.exports = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    return res.status(400).json({
      error: 'Invalid data',
      fields: [...new Set(result.error.issues.map((i) => i.path.join('.') || source))],
    });
  }
  req[source] = result.data;
  next();
};
