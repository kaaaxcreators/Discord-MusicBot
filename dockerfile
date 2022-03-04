FROM node:16.13.2
WORKDIR /usr/src/app
COPY package*.json ./
RUN yarn install
COPY . .
RUN yarn build
EXPOSE 8080
VOLUME /usr/src/app/db
CMD [ "yarn", "start" ]