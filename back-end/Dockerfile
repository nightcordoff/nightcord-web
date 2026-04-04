FROM node:22-alpine AS build

WORKDIR /app

COPY package.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

FROM node:22-alpine

WORKDIR /app

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/dist ./dist

ENV PORT=3001

EXPOSE 3001

CMD ["node", "dist/server.js"]
