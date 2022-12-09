# Rest API
This API is written in Node.js using express.

## Run
### Option 1: Run npm project locally
Running the server locally requires an installation of [Node.js](https://nodejs.dev/en/). 
First, install all dependencies using:
```shell
npm i
```

Then run the server using:
```
npm run start
```

### Option 2: Run project using docker-compose
Requires installation of [Docker](https://docs.docker.com/). 
Simply run the following command to build and run the Node server and all dependencies:
```shell
docker-compose up
```

### Database migrations
A [migration tool](https://salsita.github.io/node-pg-migrate/#/) is used to setup the postgres database.
Run the following command to apply all migrations:
```shell
npm run migrate up
```
Migrations are defined in the `migrations/` directory.

## API Documentation
The API Documentation can be hosted to `localhost:8080` by running 
```shell
npm run apiDoc
```

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
    └─── /subscribers               # async event handlers
        │   ...
│   .dockerignore
│   .env                            # Environment variables
│   .eslintrc.json
│   docker-compose.yml
│   Dockerfile
│   package-lock.json
│   package.json
│   tsconfig.json
│   README.md
```

## Error handling
Event though Javascript/Typescript supports `try`/`catch` style error handling, it is not widely used in this project. Instead, optional error objects are returned from functions that might lead to an error. 
By doing this, it is always clear which function threw an error without wrapping each individual statement in a `try`/`catch` block. Furthermore, by explicitly returning errors from functions, they are represented in the type system. 
Typescript does not enforce handling of `throwing` functions, so it is very easy to miss a `try`/`catch block`.