# Rest API
This API is written in Node.js using express.

## Run
### Easy option (requires installation of [Docker](https://docs.docker.com/) and [npm](https://www.npmjs.com/)):
1. Start all required docker containers
```shell
npm run start
```
2. On first startup, apply database migrations 
```shell
bash migrate.sh
```
3. Shutdown using
```shell
npm run down
```

### Docker only (requires installation of [Docker](https://docs.docker.com/)):
1. Start all required docker containers
```shell
docker compose --env-file ./dev.env build
docker compose --env-file ./dev.env up -d
```
2. On first startup, apply database migrations 
```shell
bash migrate.sh
```
3. Shutdown using 
```shell
docker compose --env-file ./dev.env down
```

### Run API without docker (requires installation of [npm](https://www.npmjs.com/) & [node](https://nodejs.org/en/))
```shell
npm run dev
```
Requires a Postgres instance on port 5432

## API Documentation
The API Documentation can be hosted to `localhost:8080` by running
```shell
npm run apiDoc
```
If still online, the doc can also be viewed [here](https://mvsp-api.ncmg.eu/doc)

## File structure
```
api
└─── /migrations
│   │   <timestamp>_migration.js    # Migration step definition, create new using 'npm run migrate create <name>'
│   
└─── /src
    │   app.ts                      # Application entry point
    └─── /api                       # API routes
        │   ...
    └─── /service                   # Service layer contains business logic
        │   ...
    └─── /data                      # Data access layer
        │   ...
└─── /swagger
    │   swagger.yml                 # API definition in openAPI spec
│   .dockerignore
│   .env                            # Production environment variables
│   dev.env                         # Development environment variables
│   .eslintrc.json
│   docker-compose.yml
│   Dockerfile
│   package-lock.json
│   package.json
│   tsconfig.json
│   README.md
|   migrage.sh                      # Script for applying database migrations
```

## Error handling
Event though Javascript/Typescript supports `try`/`catch` style error handling, it is not widely used in this project. Instead, functional style error handling using the `Either` monad is used where applicable.
By doing this, it is always clear which function threw an error without wrapping each individual statement in a `try`/`catch` block. Furthermore, by explicitly returning errors from functions, they are represented in the type system. 
Typescript does not enforce handling of `throwing` functions, so it is very easy to miss a `try`/`catch block`.
However, `try`/`catch` might still be used with `Promise`s, though the `.then` and `.catch` methods are prefered.