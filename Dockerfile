# Set the Base Image: Start with a base image that has Node.js installed.
# Set the Working Directory: Define the working directory inside the container.
# Copy Application Files: Copy your application files into the container.
# Install Dependencies: Install the dependencies defined in package.json.
# Expose Port: Specify the port your application will run on.
# Define the Start Command: Specify the command to run your application.




# Use an official Node.js runtime as the base image
FROM node:latest

# Set the working directory inside the container
WORKDIR /home/app/


# Copy package.json and package-lock.json files
COPY  package.json /home/app/package.json
COPY package-lock.json /home/app/package-lock.json
# COPY .env /home/app/.env


# Install the application dependencies
RUN npm install


# Copy the rest of the application files
COPY . .


# Expose the port your app runs on
EXPOSE 3000


# Command to run the application using nodemon
CMD ["npm", "start"]