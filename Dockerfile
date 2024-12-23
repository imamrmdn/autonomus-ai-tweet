# Base image
FROM node:18 as development

# Create app directory
WORKDIR /app

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./
COPY yarn*.lock ./

#RUN npm install glob rimraf
RUN yarn global add rimraf --ignore-engines

#RUN npm install --only=development
RUN yarn install --production=false 

# Bundle app source
COPY . .

# Creates a "dist" folder with the production build
RUN yarn run build

FROM node:18 as production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

#
WORKDIR /app

COPY package*.json ./
COPY yarn*.lock ./

#RUN npm install --only=production
RUN yarn install --production=true

COPY . .

COPY --from=development /app/dist ./dist

# Expose the port on which the app will run
EXPOSE 8080

# Start the server using the production build
CMD ["node", "dist/main"]