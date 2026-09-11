import { randomUUID } from 'node:crypto';

export function requestContext(request, response, next) {
  const suppliedRequestId = request.get('x-request-id');
  const requestId =
    suppliedRequestId && /^[A-Za-z0-9._:-]{1,100}$/.test(suppliedRequestId)
      ? suppliedRequestId
      : randomUUID();
  request.requestId = requestId;
  response.set('x-request-id', requestId);
  next();
}
