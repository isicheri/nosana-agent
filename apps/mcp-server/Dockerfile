FROM node:20-alpine
WORKDIR /usr/src/app
COPY . .
RUN npm ci --omit=dev
CMD ["node", "dist/main.js"]

