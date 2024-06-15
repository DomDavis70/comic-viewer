This is a project that was meant to try out deployment options of a basic full-stack application. It's a single page website that outputs some comic books on the page with a few tabs to scroll through. I used this project to get a better understanding of some AWS services (EC2, Cloudfront, ECS, S3), CI/CD using Git Actions (with security scanners and IaC), Docker, basic networking.

## Deployment Options
- [EC2/ S3 + Cloudfront](#ec2-s3--cloudfront)
- [ECS](#ecs)

<h1 id="ec2-s3--cloudfront"> EC2/ S3 + Cloudfront </h1>

<h2 id="full-stack"> 1. Creating Simple Frontend and Backend </h1>
To start off, I created the frontend and backend with Node.js and are in separate folders (for easier CI/CD and management). The backend fetches data from the [ComicVine API](https://comicvine.gamespot.com/api/documentation) and retrieves a list of comic book volumes from a single endpoint and runs on port 8000. The frontend makes a call to the backend, extracts certain fields like name, a jpg address, and the publisher, and outputs that on a page within a react card component. It also includes pagination so you can click through tabs.
<img width="1373" alt="image" src="https://github.com/DomDavis70/comic-viewer/assets/42983767/93a32eca-5651-44af-8fbb-b8746d7cc87c">


<h2> 2. CI with Github Actions </h1>
During the creation of the website, I wanted to create a CI process to build and test the code every single time a commit was merged in the repo. There were a couple of workflows added.

The simplest section of the workflows is the building and testing steps in the [frontend and backend](https://github.com/DomDavis70/comic-viewer/blob/main/.github/workflows/frontend.yml). There are separate workflows for each for easier management.

Ex.
```
steps:
- uses: actions/checkout@v4

- name: Use Node.js ${{ matrix.node-version }}
  uses: actions/setup-node@v3
  with:
    node-version: ${{ matrix.node-version }}
    cache: 'npm'
    cache-dependency-path: './frontend/package-lock.json'

- run: npm ci
- run: npm run build --if-present
- run: npm test
```

The next workflow I wanted to configure is SAST and SCA scanning, although this would run in parallel to the 2 build/test workflows. The primary purpose of SAST and SCA scanners is to scan your source code for vulnerabilities. SAST (Static Application Security Scanning) is a white box testing method to scan your source code for an array of vulnerabilities such as, cross site scripting, SQL injection, buffer overflows etc. SCA (Software Composition Analysis) is a similar process, but scans for third party libraries and dependencies.  
Deciding on a security scanner was a little difficult, since there are a wide array of options. Some popular ones include SonarQube, Checkmarx, Veracode, Semgrep, Snyk, Whitesource etc. After doing some research and trial and error, I settled on Semgrep due to the free tier being easy to use. I needed to make an account and grab a security key to be able to integrate it into my pipeline. 

Integration (Had to add the token to my repo as a secret):

```
  push:
    branches:
      - main
    paths:
      - .github/workflows/semgrep.yml
  schedule:
    # random HH:MM to avoid a load spike on GitHub Actions at 00:00
    - cron: '12 15 * * *'
jobs:
  semgrep:
    name: semgrep/ci
    runs-on: ubuntu-20.04
    env:
      SEMGREP_APP_TOKEN: ${{ secrets.SEMGREP_APP_TOKEN }}
    container:
      image: semgrep/semgrep
    if: (github.actor != 'dependabot[bot]')
    steps:
      - uses: actions/checkout@v3
      - run: semgrep ci
```
Everytime code is merged, a security report is sent to the Semgrep site for me to view. For example, here it caught 2 CVEs (Common Vunerabilities and Exposures) in my dependencies.
<img width="1200" alt="image" src="https://github.com/DomDavis70/comic-viewer/assets/42983767/398ca7b2-934c-402c-99e6-d81fd2062e1e">

<h2> 3. Setting Up Infrastructure </h1>

Next was to try and deploy this using EC2 for the backend and S3 + cloudfront for the frontend.
While creating the EC2, these are the basic settings I configured to make it as cheap as possible. For this small app, anything more is over kill, since our backend just does a single fetch call.
<img width="1191" alt="image" src="https://github.com/DomDavis70/comic-viewer/assets/42983767/a7146363-b077-4dc9-a7f3-6c0b9f92a257">

I also added a userscript containing a simple script to run the backend on startup. But first I added an entry in AWS Parameter Store since I had an API key env that needed to be set.
```
aws ssm put-parameter --name "/MyApp/COMICVINE_API_KEY" --value "<API_KEY>" --type "SecureString"
```
Userscript:
```
          #!/bin/bash
          sudo yum update -y
          sudo yum install -y nodejs npm git
          git clone https://github.com/DomDavis70/comic-viewer.git
          cd comic-viewer/backend
          npm install
          # Retrieve the API key from Parameter Store
          COMICVINE_API_KEY=$(aws ssm get-parameter --name "/MyApp/COMICVINE_API_KEY" --query "Parameter.Value" --output text)
          echo "COMICVINE_API_KEY=$COMICVINE_API_KEY" > .env
          npm start
```
And we can see the backend is up when the instance launches!

<img width="602" alt="image" src="https://github.com/DomDavis70/comic-viewer/assets/42983767/e2d8326e-0db5-40c2-af2f-9632d441ee5d">


Since the backend was up, the next goal was to create an S3 bucket  to host our static build files. My website would be dubbed `www.comic-viewer.com`, that is what I called the bucket. During creation, I allowed read access and enabled static hosting. Within my local repo setup, I then ran `npm run build` to generate the build files from the frontend and uploaded them into S3. 

<img width="1349" alt="image" src="https://github.com/DomDavis70/comic-viewer/assets/42983767/9f5da7d0-aa36-40ec-a40b-90cae60d8ad0">

Creating a Hosted Zone was next and necessary to register a domain and configure our DNS (Domain Name System) settings. After creating a zone, and registering the domain `comic-viewer.com`, I created an A record `www.comic-viewer.com`, so that traffic will be routed to the different IPs when users hit that A record. 

<img width="789" alt="image" src="https://github.com/DomDavis70/comic-viewer/assets/42983767/d62f0ab1-47ab-4097-8926-3cb1282b57d6">

Since we now have our A record to route traffic from our domain to another resource, we can test this out with the S3 address we were given when we enabled static hosting on our bucket. and we can now see that our domain is mapped to the s3 bucket, but you'll see the comics aren't populating since it's not connected to the backend!

<img width="363" alt="image" src="https://github.com/DomDavis70/comic-viewer/assets/42983767/342a2163-1ad8-4876-b867-4bbcab3e728f">
<img width="1141" alt="image" src="https://github.com/DomDavis70/comic-viewer/assets/42983767/588a20e4-b41d-49f8-9e20-21826b75e9d3">

Next, I created a certificate for my hosted zone using ACM. This is so we can enable the use of HTTPS with SSL/TLS.
And after that I needed to create a Cloudfront distribution to point to the bucket, and have the domain point to the Cloudfront distribution. In cloudfront we need to choose it to point to the s3 bucket. During creation, it's also important to use the same cert tied to your domain! 

<img width="739" alt="image" src="https://github.com/DomDavis70/comic-viewer/assets/42983767/7da73b40-1a3a-465f-8003-6f2ee94c8bf5">
 
And after changing the A record to point to the cloudfront distribution like we did earlier, we now have them linked and we're dealing with HTTPS now!

<img width="767" alt="image" src="https://github.com/DomDavis70/comic-viewer/assets/42983767/2977f347-277e-4171-8134-6ab072282b32">
<img width="926" alt="image" src="https://github.com/DomDavis70/comic-viewer/assets/42983767/396051b9-9813-4b82-8cf0-f54ea993d16e">


**Problem**: If I try to put the EC2 instance URL as the fetch address for the frontend, we get this error:
```
Mixed Content: The page at 'https://dksk7j59neyeu.cloudfront.net/' was loaded over
main. 6dbf17a7 js:2
HTTPS, but requested an insecure resource 'http://18.226.181.31:8000/api/volumes'. This request has been blocked; the content must be served over HTTPS. 
```
This is due to the traffic being converted to HTTPS by Cloudfront, but the EC2 is operating over HTTP. I used a load balancer to convert this traffic from HTTPS to HTTP, so we can avoid this issue. The load balancer will be a second origin behind Cloudfront and the S3 will point to Cloudfront to route the traffic to the load balancer. 

Creating the load balancer isn't difficult since I used the same VPC and security groups as the EC2. We needed a listener on port `HTTPS:443` and a target group that routes to port `8000` (which the EC2 runs on). After it's deployed, I can see this from the load balancer URL with this message from earlier `Backend server is running!`.  

Network flow:
<img width="1353" alt="image" src="https://github.com/DomDavis70/comic-viewer/assets/42983767/dcfc79a5-058b-4583-844b-b9ccb7dcb0db">

And now when we visit `www.comic-viewer.com`, we see the final product deployed with comics back on the page.

<img width="1331" alt="image" src="https://github.com/DomDavis70/comic-viewer/assets/42983767/c2784fa1-7d93-49eb-be54-09f7a81f33ec">

**Final Product:**

<img width="746" alt="image" src="https://github.com/DomDavis70/comic-viewer/assets/42983767/c967dddf-2ff0-4a09-b5da-49c2cd58dabb">




<h1>ECS</h1>

<h2> 1. Using Docker to Containerize the App</h2>

In order to deploy this using ECS, I wanted to containerize this application using Docker. Docker is an open-source platform that automates the deployment, scaling, and management of applications using containerization technology. In my case Docker is providing isolation, which ensures solid security and consistency across multiple environments due to the dependencies being the same no matter the container. The main intention behind splitting up the frontend and backend in this project was so that it would be simpler to containerize. 

I touched on the creation of the frontend and backend [here](#full-stack), so the next step was to create dockerfiles for both parts. The docker files for these 2 are almost identical, but for example, here is the backend. 

```
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

# Copy the rest of the files
COPY . ./

# Exposing the port
EXPOSE 8000

# Command to run the application
CMD ["sh", "-c", "COMICVINE_API_KEY=$COMICVINE_API_KEY npm start"]
```
When testing the building of these images I originally copied over the `package-lock.json` file and had `npm install` in the Dockerfile, but I had trouble with mismatched dependencies when testing locally directly in the source code and running this within a container over the course of a week. I ended up just doing `COPY package-lock.json .` to remove the inconsistencies. So now, the containers will use exactly the same dependencies that were originally pushed up.

After creating the docker file I was able to build them by doing these commands. 
```
docker build -t domdavis70/comic-backend:latest .
docker build -t domdavis70/comic-frontend:latest .
```
And after the build was successful I wanted to create the containers and run the instances. 
```
docker run -dp 3000:3000 -e REACT_APP_API_URL=http://localhost:8000 --name test-frontend domdavis70/comic-frontend:latest
docker run -dp 8000:8000 -e COMICVINE_API_KEY=<API_KEY> --name test-backend domdavis70/comic-backend:latest
```
After noticing both containers are running, I opened up Port 3000 to see the applicaton running!
```
CONTAINER ID   IMAGE                              COMMAND                  CREATED      STATUS          PORTS                    NAMES
e8974bbbcf19   domdavis70/comic-backend:latest    "docker-entrypoint.s…"   3 days ago   Up 13 seconds   0.0.0.0:8000->8000/tcp   test-backend
b361cdd8012e   domdavis70/comic-frontend:latest   "docker-entrypoint.s…"   3 days ago   Up 6 seconds    0.0.0.0:3000->3000/tcp   test-frontend
```
<img width="1331" alt="image" src="https://github.com/DomDavis70/comic-viewer/assets/42983767/86e17abd-8420-411a-93c4-cb3714f5b6e2">

And lastly, I can push these images to Docker Hub.
```
docker push domdavis70/comic-backend:latest
```

<h2> 2. Building images through CI/CD and incorporating AWS ECR</h2>
After the images are built, I wanted to automate this process by adding it in the pipeline. Instead of creating another Github workflow for the building of images, I added the process in after the building and testing stage.

```
- name: Log in to Docker Hub
  uses: docker/login-action@v2
  with:
    username: ${{ secrets.DOCKER_HUB_USERNAME }}
    password: ${{ secrets.DOCKER_HUB_PASSWORD }}

- name: Build the Docker image
  run: docker build -t domdavis70/comic-backend:latest .
  env: # Define environment variables here
    COMICVINE_API_KEY: ${{ secrets.COMICVINE_API_KEY }}

- name: Push the Docker image
  run: docker push domdavis70/comic-backend:latest
```
Even though I'm pushing these images to Docker Hub, I want to use ECR for this project, mainly due to the seamless integration with ECS and for learning purposes. The cost for holding these 2 images should be relatively low as well, since we're not even going to be storing more than 300MB in our ECR repo.

Since this process is going in our CI stage, I needed to create a private repo in ECR. 
<img width="1110" alt="image" src="https://github.com/DomDavis70/comic-viewer/assets/42983767/7d941e30-56fa-44f2-871b-147ec9932b76">

Next I needed to login to ECR and push the images I have built. I can now see the images pushed to the repo.
```
    - run: aws ecr get-login-password --region us-east-2 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-2.amazonaws.com
    - run: docker tag domdavis70/comic-backend:latest <account>.dkr.ecr.us-east-2.amazonaws.com/comic-viewer:backend
    - run: docker push <account>.dkr.ecr.us-east-2.amazonaws.com/comic-viewer:backend
```

<img width="1117" alt="image" src="https://github.com/DomDavis70/comic-viewer/assets/42983767/c5356561-419b-4971-a504-7368a038d6ad">


To make things a bit simple, I decided to go with Fargate instead of EC2+Linux. This is due to me not exaclty needing anything specific when configuring the instances these containers run on.

<img width="821" alt="image" src="https://github.com/DomDavis70/comic-viewer/assets/42983767/a9a2c08d-3fc6-4347-b329-22ddce8965a9">

Next, I set up the task definition. I had 2 containers being ran in this task. I also created log groups for both containers. Ex. Frontend. 
<img width="1099" alt="Pasted Graphic" src="https://github.com/DomDavis70/comic-viewer/assets/42983767/d0bac764-bfe7-478c-a19c-22ad4c4e2bcf">

I had a choice to run a task or a service. A task would just be a single instance of the task with the specified defintion. 
A service would be necessary for running a fleet of tasks, but since we just need a single frontend and backend container at all times, I just ran a single standalone task.

Problem: After starting the task, I knew my services were running correctly due to the health checks and my cloudwatch logs logging as expected, but I still couldn't access the public IP of my Task. THe problem turned out to be the security group not allowing inbound traffic to port 3000 and 8000. 

After fixing this issue, I was able to see the backend and frontend running!

Problem: I couldn't see the contents on the frontend because it wasn't correctly calling to the backend. The error in the console.log stated `Access to fetch at 'http://localhost:8000/api/volumes' from origin 'http://3.142.164.73:3000' has been blocked by CORS policy: The request client is not a secure context and the resource is in more-private address space local.` This was apparently due to a chrome issue that I briefly turned off. [Link](chrome://flags/#block-insecure-private-network-requests). 

I couldn't link the comic-viewer DNS to the ECS without a load balancer, so I went ahead and created one to listen to port 80 and point to a target group with the ecs as the target.

<img width="834" alt="image" src="https://github.com/DomDavis70/comic-viewer/assets/42983767/21c86071-4f86-4650-abeb-4dc31a0feb7e">

After this, I just needed to point the Route 53 DNS record to the load balancer and I can view the site!

<img width="1329" alt="image" src="https://github.com/DomDavis70/comic-viewer/assets/42983767/1f13a491-f522-4d2d-b295-dbc86af66d0a">


