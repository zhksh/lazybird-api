# BUILD STAGE
FROM node:19-alpine3.16 as builder
WORKDIR /api
COPY package*.json ./
COPY tsconfig.json ./
# TODO: Only install typescript here?
RUN npm install 
COPY src ./src
RUN npm run build

# RUN STAGE
FROM node:19-alpine3.16
WORKDIR /api
COPY package*.json ./
RUN npm install 
COPY --from=builder /api/dist ./dist
ENV PORT=6969
EXPOSE 6969
CMD [ "node", "dist/app.js" ]