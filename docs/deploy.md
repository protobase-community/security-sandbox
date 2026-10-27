# Deploy and seed the live sandbox

For the operator. The secret stays on your own machine and offline: it is never in the repository, the app's
environment or its database. Seed once; the sandbox resets only when you regenerate the secret (step 5).

## 1. Create the app

In the [Protobase Cloud console](https://admin.protobase.net), press **New app** and pick **An existing GitHub
repository**: this one. Every push to `main` deploys, once `db:migrate` and `protobase doctor` pass. Add no
`SANDBOX_SECRET`, no sign-up and no sign-in provider to its settings.

## 2. Make the secret

On your own machine:

```sh
openssl rand -hex 32
```

Keep it offline, such as in a password manager or on paper. It rebuilds the exact data set, so it is what tells a
modification apart, and nobody else may ever see it.

## 3. Seed

Take the app's database connection string from the console. Read the secret without echoing it or leaving it in the
shell history, seed, and forget it again:

```sh
read -rs SANDBOX_SECRET && export SANDBOX_SECRET
DATABASE_URL='<connection string>' bun run db:seed --scale small
unset SANDBOX_SECRET
DATABASE_URL='<connection string>' bun run db:fingerprint
```

The seed prints the commitments of levels 1 to 5 and 7, and `db:fingerprint` the hash of every table and their total,
level 6's commitment. Keep the whole fingerprint output with the secret.

Never run `db:seed` against the live database again, except to regenerate the secret (step 5): it empties the tables
first.

## 4. Publish

In the README's Status section, write the app's address, the day you seeded it, the commitments and the total
fingerprint. Commit and push.

Create no accounts in the app, for yourself either: an account is something to attack, and signing in adds a row to
`core.users` (`db/migrations/013_auth_users.sql`). Look at the data with read-only queries on the database instead.

## 5. Regenerate the secret

When the secret may have leaked, or to start a fresh round, replace it and everything made from it:

1. Make a new secret (step 2) and keep it in place of the old one; the old one rebuilds nothing live any more.
2. Seed with it (step 3). This empties the app's tables, so any change a finding made is gone: check open reports
   against the old fingerprint first.
3. Publish (step 4): the new day, commitments and fingerprint replace the old ones in the README's Status section.

Accounts are not part of the seed: `auth` keeps what it had, which is nothing as long as nobody made one.

## Check a claim

- **A value (levels 1 to 5, 7).** `printf %s '<value>' | shasum -a 256` against the commitment. A value other than the
  canary: look it up in the database, such as `select id from leasing.tenants where internal_number = '<value>'`.
- **A change (level 6).** Run `db:fingerprint` against the live database and compare its total with the published one.
  To see which table changed, seed the secret into a local database (`bun run db:up`, `bun run db:migrate`, then step
  3 without `DATABASE_URL`), run `db:fingerprint` on both and diff them; then compare that table's rows.

`bun run db:seed` without `SANDBOX_SECRET` makes a new secret and prints it, as CI does for its throwaway database: that
secret belongs to that database alone.
