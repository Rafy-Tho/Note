export function sendData(response, data, status = 200) {
  return response.status(status).json({ data });
}

export function sendError(response, error) {
  const body = {
    error: {
      code: error.code,
      message: error.message,
    },
  };

  if (error.fields) {
    body.error.fields = error.fields;
  }

  return response.status(error.status).json(body);
}
