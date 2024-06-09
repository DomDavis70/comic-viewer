# Using Node.js base image for version 22
FROM node:22-alpine

# Set a build-time argument
ARG REACT_APP_API_URL

# Set the REACT_APP_API_KEY environment variable
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Set the working directory in the container
WORKDIR /app

# Copy package.json to the container
COPY package.json .
RUN npm install --silent

# Copy the rest of the files
# COPY public/ /frontend/public
# COPY src/ /frontend/src
# COPY package.json /frontend/
COPY . ./

# Expose the port
EXPOSE 3000

# Command to run the application
CMD ["sh", "-c", "REACT_APP_API_URL=$REACT_APP_API_URL npm start"]