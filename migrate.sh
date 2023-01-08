if test -f "dev.env"; then
    export $(grep -v '^#' dev.env | xargs)
fi

if test -f ".env"; then
    export $(grep -v '^#' .env | xargs)
fi

docker run -e "DATABASE_URL=$DATABASE_URL" --network $NETWORK_NAME --rm -it $(docker build -q -f Dockerfile.migrate .)
