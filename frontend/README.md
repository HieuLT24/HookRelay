# HookRelay frontend

React/Vite frontend for the HookRelay developer console.

## Structure

- `src/app/` — application shell and future route composition.
- `src/config/` — environment-backed frontend configuration.
- `src/lib/` — transport and cross-feature utilities.
- `src/features/auth/` — registration, login, JWT session bootstrap, and sign out.
- `src/styles.css` — current visual system and responsive auth layout.

Future product areas should become feature folders next to `auth/`: `api-keys/`,
`endpoints/`, `events/`, and `deliveries/`. Keep API calls inside each feature and
reuse `src/lib/apiClient.js`; add routing when the second real page exists.

## Local development

```bash
npm install
npm run dev
```

Set `VITE_API_URL` in `.env.local` when the API is not running at the default
`http://localhost:3000/api/v1`.
