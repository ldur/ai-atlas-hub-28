

## Auto-Approve Tips

Currently, submitted learning items (tips) have `published: false` and require admin approval. The change is to auto-publish them immediately.

### Changes

1. **`src/pages/Learning.tsx`** -- Change the `handleSubmitTip` function to set `published: true` instead of `false` when inserting a new learning item.

That's a single-line change. No database migration needed since `published` is already a nullable boolean column.

