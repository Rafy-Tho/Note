export function createSearchService({ repository } = {}) {
  return {
    search(userId, query) {
      return repository.search(userId, query);
    },
  };
}
