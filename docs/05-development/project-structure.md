# Project Structure

```text
frontend/src/{app,components,features,pages,hooks,lib,utils,constants,styles}
backend/src/{app,config,common,db,modules}
backend/migrations/
backend/test/
e2e/
docs/
```

Keep feature behavior close to its feature. Keep database access out of UI code, business rules out of controllers, and shared code independent of feature internals.
