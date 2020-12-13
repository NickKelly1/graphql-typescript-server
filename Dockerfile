FROM node:14-alpine

WORKDIR /usr/src/app

# Install app dependencies
# Get both package.json & package-lock.json
COPY package*.json ./

# Install deps
RUN npm install

# Copy source
COPY . .

# Build in container
RUN npm run build

CMD npm run start
