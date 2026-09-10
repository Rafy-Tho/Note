export function createSidebarCountsService({ repository } = {}) {
  return {
    get(userId) {
      return repository.get(userId);
    },
  };
}
