export $(grep -v '^#' .env | xargs)

docker run -e "DATABASE_URL=$DATABASE_URL" --network $NETWORK_NAME --rm -it $(docker build -q -f Dockerfile.migrate .)
