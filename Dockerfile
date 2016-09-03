FROM node:6

# Create app directory
RUN mkdir -p /usr/app
WORKDIR /usr/app

# Bundle app source
COPY . /usr/app/
RUN npm install

ENV NODE_ENV="production"

EXPOSE 4001
CMD [ "npm", "start" ]
