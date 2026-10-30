# Shop backend

## Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env`.
3. Set `MONGO_URI` and replace `JWT_SECRET` with a unique random value of at least 32 characters.
4. Optionally set both `ADMIN_EMAIL` and `ADMIN_PASSWORD` to create the first administrator when the server starts.
5. Start the local server with `npm start`.

The `.env` file is ignored by Git. Do not commit credentials.

## Deploy to Vercel

1. Import this project into Vercel and deploy from the project root.
2. Add `MONGO_URI` (or `MONGODB_URI`) and a unique `JWT_SECRET` of at least 32 characters in the project's Environment Variables settings. Add `JWT_EXPIRES_IN` if needed.
3. Optionally add both `ADMIN_EMAIL` and `ADMIN_PASSWORD` to create the initial administrator on the first database-backed request.
4. Deploy. Vercel serves the Express application through `api/index.js`; MongoDB connects on demand through database middleware and reuses the connection for warm function instances.

The database must be reachable from Vercel (for example, allow the deployment's network access in MongoDB Atlas). Do not rely on `.env` being uploaded; configure production values in Vercel.

## Structure

- `src/models` defines the Mongoose data models.
- `src/controllers` contains request handling and business logic.
- `src/routes` maps API endpoints to controllers and middleware.
- `src/middleware` contains authentication and database connection checks.
- `src/config` loads validated environment settings and connects MongoDB.
- `api/index.js` exposes the Express app as a Vercel serverless function.

The API keeps the existing `/api/auth`, `/api/products`, `/api/users`, `/api/orders`, and `/api/health` endpoints.
