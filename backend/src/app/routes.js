import { createHealthRouter } from '../modules/health/health.routes.js';
import { createAuthRouter } from '../modules/auth/auth.routes.js';
import {
  createNotesRouter,
  createTrashRouter,
  createFavoritesRouter,
} from '../modules/notes/notes.routes.js';
import {
  createNoteTagsRouter,
  createTagsRouter,
} from '../modules/tags/tags.routes.js';
import { createSearchRouter } from '../modules/search/search.routes.js';
import { createNotebooksRouter } from '../modules/notebooks/notebooks.routes.js';

export function configureRoutes(
  app,
  {
    databaseCheck,
    authService,
    config,
    notesService,
    tagsService,
    searchService,
    notebooksService,
  },
) {
  app.use('/api/v1/health', createHealthRouter({ databaseCheck }));
  app.use('/api/v1/auth', createAuthRouter({ authService, config }));
  app.use(
    '/api/v1/notes',
    createNotesRouter({ authService, config, service: notesService }),
  );
  app.use(
    '/api/v1/search',
    createSearchRouter({ authService, config, service: searchService }),
  );
  app.use(
    '/api/v1/trash',
    createTrashRouter({ authService, config, service: notesService }),
  );
  app.use(
    '/api/v1/favorites',
    createFavoritesRouter({ authService, config, service: notesService }),
  );
  app.use(
    '/api/v1/notebooks',
    createNotebooksRouter({ authService, config, service: notebooksService }),
  );
  app.use(
    '/api/v1/tags',
    createTagsRouter({ authService, config, service: tagsService }),
  );
  app.use(
    '/api/v1/notes',
    createNoteTagsRouter({ authService, config, service: tagsService }),
  );
}
