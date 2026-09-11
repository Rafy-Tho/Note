# Implementation Plan

Implementation is organized as growing vertical slices. New product capabilities should add a new slice document or extend the most relevant existing slice; the list is not fixed.

## Slice Order

1. Project foundation
2. Authentication and authorization
3. Notes and writing
4. Notebooks and organization
5. Tags
6. Search
7. Additional approved MVP capabilities as they are added

## Slice Completion Loop

```text
Requirements -> database -> backend/API -> frontend -> UI states
             -> tests -> acceptance verification -> progress evidence
```

Complete shared foundations before relying on them in feature slices. Test security, ownership, rich-text safety, autosave conflicts, and data-loss behavior as part of the relevant slice.

## Current Priorities

- Finish browser verification for implemented authentication and workspace behavior.
- Complete authorization integration across all protected resources.
- Complete rich-text/autosave, trash, tags, search, and organization verification.
- Run testing hardening before deployment preparation.
