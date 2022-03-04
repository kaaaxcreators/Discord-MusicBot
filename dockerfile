FROM node:16.7.0
WORKDIR /usr/src/app
COPY package*.json ./
RUN yarn install
COPY . .
RUN yarn build
EXPOSE 8080
VOLUME /usr/src/app/db
CMD [ "yarn", "start" ]