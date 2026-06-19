const errorHandler = async (error, req, res, next) => {
  let statusCode = error.statusCode || error.status || 500;
  let message = error.message || "Internal server error";

  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    statusCode = 400;
    message = "Validation Failed";
    error.validationErrors = [
      {
        field: "body",
        message: "Malformed JSON request body",
      },
    ];
  }

  if (error.code === 11000) {
    statusCode = 409;
    message = error.keyPattern?.userId
      ? "User already has an active cart"
      : "A user with this email already exists";
  }

  const response = {
    success: false,
    message,
  };

  if (error.validationErrors) {
    response.errors = error.validationErrors;
  }

  if (process.env.NODE_ENV !== "production") {
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
};

export default errorHandler;
