# Frontend Code Explanation

This file explains the frontend implementation in simple terms.

## Structure

- `frontend/src/index.html` - the HTML page containing the UI structure and client-side script references.
- `frontend/src/app.js` - the main JavaScript logic for authentication, session checks, and backend interaction.
- `frontend/src/styles.css` - the styles for the UI.
- `frontend/nginx.conf` - Nginx configuration that serves the frontend and proxies API and login-related requests to the backend.

## What the frontend does

1. Shows a UI with:
   - a greeting message
   - sign-in / sign-out buttons
   - a protected function form
2. Loads a greeting from the backend at `/api/greeting`.
3. Checks the current user session at `/api/me`.
4. Redirects to backend login when the user clicks "Sign In".
5. Sends a protected request to `/api/execute` after the user is authenticated.

## Important frontend behavior

### Authentication flow

- `signIn.addEventListener("click", ...)`: redirects the browser to `/oauth2/authorization/keycloak`.
- This backend route begins the OAuth2 authorization flow with Keycloak.
- After login, Keycloak returns the browser to the frontend through the backend.

### Proxying requests

In `nginx.conf`, these paths are forwarded to the backend:

- `/api/` -> `http://backend:8080/api/`
- `/oauth2/` -> `http://backend:8080/oauth2/`
- `/login` -> `http://backend:8080`
- `/logout` -> `http://backend:8080/logout`

This means the browser always talks to the frontend host, while the backend handles all REST and OAuth traffic.

## Key file: `frontend/src/app.js`

### `loadGreeting()`

- Fetches `/api/greeting`
- Updates the page with the response or an error message

### `loadSession()`

- Fetches `/api/me`
- If the user is not authenticated, it disables the protected function button
- If authenticated, it shows the user info

### `runBackendFunction(event)`

- Prevents default form submission
- Sends a POST request to `/api/execute`
- Displays the result from the backend

### Sign in/out

- `signIn` uses `window.location.href = "/oauth2/authorization/keycloak"`
- `signOut` uses `window.location.href = "/logout"`

This keeps the frontend lightweight and dependent on backend-managed login.

## Why this setup is useful

- The backend handles OAuth2 and session state securely.
- The frontend remains a static UI.
- Nginx proxies browser requests to the backend without exposing backend endpoints directly.

## When to change this code

- If the UI needs new pages, update `src/index.html` and `src/app.js`.
- If you need new backend API calls, add routes in `nginx.conf` and call them from `app.js`.
- If login should use a different OAuth client, update the backend Spring Boot configuration and Keycloak realm.
