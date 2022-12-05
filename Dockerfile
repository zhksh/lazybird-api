# BUILD STAGE
FROM node:12-alpine as builder
WORKDIR /api
COPY package*.json ./
COPY tsconfig.json ./
# TODO: Only install typescript here?
RUN npm install 
COPY src ./src
RUN npm run build

# RUN STAGE
FROM node:12-alpine
WORKDIR /api
COPY package*.json ./
RUN npm install 
COPY --from=builder /api/dist ./dist
ENV PORT=6969
EXPOSE 6969
CMD [ "node", "dist/app.js" ]