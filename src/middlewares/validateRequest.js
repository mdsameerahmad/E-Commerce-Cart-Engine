export const validateRequest = (schema) => async (req, res, next) => {
  const result = await schema.safeParseAsync({
    body: req.body,
    params: req.params,
    query: req.query,
  });

  if (!result.success) {
    const error = new Error("Validation Failed");
    error.statusCode = 400;
    error.validationErrors = result.error.issues.map((issue) => {
      const path = issue.path.filter((segment) => segment !== "body" && segment !== "params");

      return {
        field: path.join(".") || "request",
        message: issue.message,
      };
    });

    return next(error);
  }

  if (result.data.body) {
    req.body = result.data.body;
  }

  if (result.data.params) {
    Object.assign(req.params, result.data.params);
  }

  return next();
};
