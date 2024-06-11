# Using Node.js base image for version 22
FROM node:22-alpine

# Set a build-time argument
ARG COMICVINE_API_KEY

# Set the REACT_APP_API_KEY environment variable
ENV COMICVINE_API_KEY=$COMICVINE_API_KEY

# Set the working directory in the container
WORKDIR /app

# Copy package.json to the container
COPY package-lock.json .
# RUN npm install --silent

# Copy the rest of the files
# COPY public/ /frontend/public
# COPY src/ /frontend/src
# COPY package.json /frontend/
COPY . ./

# Expose the port
EXPOSE 8000

# Command to run the application
CMD ["sh", "-c", "COMICVINE_API_KEY=$COMICVINE_API_KEY npm start"]