export function isUniqueViolation(error) {
  return error?.code === 'ER_DUP_ENTRY' || error?.errno === 1062;
}

export function isCheckConstraintViolation(error) {
  return (
    error?.code === 'ER_CHECK_CONSTRAINT_VIOLATED' ||
    error?.code === 'ER_CONSTRAINT_FAILED' ||
    error?.errno === 3819 ||
    error?.errno === 4025
  );
}
