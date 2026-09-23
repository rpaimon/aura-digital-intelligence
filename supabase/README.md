# Supabase database files

- `migrations/` is the production migration history.
- `bootstrap.sql` is for a **brand-new** Supabase project only; it contains the original foundation followed by all retained migrations through the current clean master.

For the existing Aura Digital Intelligence production database, do **not** rerun the bootstrap. Apply only migrations that have not yet been run. For this clean-master release, the only new migration is `014_clean_master_editorial_copy.sql`.
