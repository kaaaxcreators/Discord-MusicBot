FROM node:16.7.0
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 8080
VOLUME /usr/src/app/db
CMD [ "npm", "start" ]