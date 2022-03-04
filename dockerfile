FROM node:16.13.2
WORKDIR /usr/src/app
COPY package*.json ./
RUN yarn install
COPY . .
RUN yarn build || echo "Build failed. Proceeding anyway."
EXPOSE 8080
VOLUME /usr/src/app/db
CMD [ "yarn", "start" ]