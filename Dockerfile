FROM node:10-alpine

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ARG NODE_ENV
ENV NODE_ENV $NODE_ENV
COPY package.json package-lock.json /usr/src/app/
RUN npm install && npm cache clean --force
COPY . /usr/src/app

EXPOSE 3000

CMD ["npm", "start"]