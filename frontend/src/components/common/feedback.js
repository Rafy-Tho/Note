export function isAllowedLink(value) {
  return value === '' || /^(https?:\/\/|mailto:)/i.test(value.trim());
}

export function appendToast(toasts, toast, limit = 3) {
  return [...toasts.slice(-(limit - 1)), toast];
}
