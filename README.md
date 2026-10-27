# Security sandbox

A real [Protobase](https://github.com/PrototeamHQ/protobase) app, running on Protobase Cloud, that we invite you to
break into. It is a property management back office (owners, properties, tenants, leases, rent and maintenance) with
roles, fields revealed on request, a REST API and an MCP endpoint. Hidden in its data are values nobody can compute,
not even from this source code. Read one, change any data, or get in at all, and tell us.

- **The source is public.** Study it: everything the app does is in this repository and in Protobase's.
- **Nobody has an account for you.** Sign-up is closed and we hand out no test accounts: you start signed out.
- **It is not a demo and never resets.** What you change stays changed.
- **There are no planted bugs.** The point is to test the real product.

## Status

Not live yet. When it is, this section gives its address, the day it was seeded, and the SHA-256 commitments of the
levels below.

| Level | Canary | SHA-256 |
| --- | --- | --- |
| 1 | inbox token of organization 1 | not published yet |
| 2 | internal number of tenant 1 | not published yet |
| 3 | key safe code of property 1 | not published yet |
| 4 | API key of organization 1 | not published yet |
| 5 | webhook secret of organization 1 | not published yet |
| 6 | fingerprint of all data (`db:fingerprint`, total) | not published yet |
| 7 | the secret | not published yet |

## Levels

Each level is a different kind of exposure. Its canary is one value, committed to above; every other value of the same
kind counts the same, and we check those against the database.

1. **A hidden column.** Organizations are public: signed out, `GET /api/v1/organizations` gives their id, name and city.
   Their table has another column, `inbox_token`, that the data config leaves out. Obtain one.
2. **A field no screen shows.** A tenant's `internal_number` is in the tenants' data config for admins, managers and
   finance, but on no list or page. Obtain one.
3. **Revealed on request.** A property's key safe and smart lock codes (`access_codes`) are a
   [sensitive field](https://docs.protobase.net/reference/data-config/#sensitive-fields): no list or page carries them,
   admins and managers reveal one at a time, and each reveal is audited. Obtain one.
4. **A resource with no screen.** `integrations` holds the payment provider's API key, for admins only, through the API
   and MCP. Obtain one.
5. **A table with no resource.** `core.webhook_secrets` exists in Postgres, but nothing in the app reads it. Obtain one.
6. **Change anything.** Add, change or delete any row in the app's tables (any schema but `auth`). Make the smallest
   change that shows it, such as your handle in one field.
7. **The secret.** It is not on the server at all (see below). If you have it, something went very wrong: tell us how.

Getting a session or token of any role, or acting as another user, counts too: show it with what it then lets you read
or do.

## How the data is made

All data is generated from one secret: 32 random bytes that we keep offline. We use it only to seed the database, from
our own machine. It is not in this repository, not in the app's environment and not in its database.

- **The realistic data** (names, homes, leases, rent, tickets) comes from the seed's own generator, seeded with 32 bits
  of HMAC-SHA256(secret, "world:…"). That generator is not cryptographic and 32 bits can be searched, so this data is
  not protected, and working out its seed tells you nothing about the secret.
- **The protected values** (levels 1 to 5) are each HMAC-SHA256(secret, label) itself, such as
  `tenant-number:1`, written as 140 to 160 bits of base32. They are as good as random: knowing this source code and all
  the other data gives no way to compute one. The only way to have one is to read it from the server.

See `seed/sandbox.ts`. A commitment is the SHA-256 of the value as text, so anyone can check a claim:

```sh
printf %s '<the value>' | shasum -a 256
```

The same secret always rebuilds exactly the same data. `bun run db:fingerprint` hashes every row of the app's tables,
and its total right after seeding is level 6's commitment: when it no longer matches, a row changed, and seeding the
secret into an empty database again shows which table.

## Rules

In scope: the sandbox app at the address under [Status](#status), on Protobase Cloud: its web app, the REST API
(`/api/v1`), sign-in (`/api/auth`), the MCP endpoint (`/api/mcp`) and its OAuth, and Protobase as it runs this app.

Out of scope:

- denial of service, load tests and brute force at volume;
- other apps on Protobase Cloud, the console and the platform's infrastructure;
- social engineering, phishing and anything physical, against us or anyone else.

Stop once you have shown a finding, and keep it to yourself until we have fixed it.

## Report a finding

Email [contact@protobase.net](mailto:contact@protobase.net) with the level in the subject, the value you read or the
change you made, and the steps to repeat it. Please do not open a GitHub issue for a finding. We check the value
against the commitments, or the change against the fingerprint, and answer.

## Study the source

- `protobase.config.ts`: sign-in, with no `signUp` and no `socialProviders`, so nobody can make an account; MCP on.
- `config/roles.ts`: the roles, and what `anonymous`, anyone signed out, may read.
- `config/<name>/data.ts` and `ui.ts`: each resource's fields and access, and its screens.
- `db/migrations/`: the database, with the levels' tables and columns in `017_challenges.sql`.
- `seed/sandbox.ts` and `seed/steps/sandbox.ts`: how the protected values are made and written.
- `db/fingerprint.ts`: how a change is found.
- [docs.protobase.net](https://docs.protobase.net) and [PrototeamHQ/protobase](https://github.com/PrototeamHQ/protobase):
  Protobase itself.

| Role | Works on |
| --- | --- |
| `admin` | everything |
| `manager` | the portfolio, tenants and leases, tickets and inspections, access codes; reads rent, payments and arrears |
| `finance` | rent charges, payments, deposits and valuations; reads leases, tenants and the portfolio |
| `maintenance` | tickets (changes only those assigned to them), work orders, inspections and vendors; reads properties, units and tenants, without their screening data |
| `anonymous` | anyone signed out: the organizations' id, name and city |

## Run it locally

Practise on your own copy, where you make the accounts. You need [Bun](https://bun.sh) 1.4 and Docker.

```sh
bun install
bun run db:up                     # Postgres 18 in Docker on port 55434; creates .env from .env.example
bun run db:migrate
bun run db:seed --scale small     # makes a new secret and prints it with its commitments
bun run protobase users create you@example.com --role admin --generate-password
bun run dev                       # http://localhost:5173
bun run test
```

Set your own `PROTOBASE_SECRET` in `.env` (`openssl rand -base64 32`). `SANDBOX_SECRET=<64 hex characters>
bun run db:seed` seeds the data of that secret instead. Check a change with `bun run typecheck`, `bun run test`,
`bun run build` and, once the database is migrated, `bun run protobase doctor`.

How we deploy and seed the live sandbox is in [docs/deploy.md](docs/deploy.md).

## Licence

[Apache License 2.0](LICENSE). This app started from the
[property-management](https://github.com/protobase-community/property-management) template.
