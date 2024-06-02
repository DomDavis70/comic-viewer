TODO: Fix steps - put more detail

1. create front end with API call
2. Move the API call to the backend and have frontend get data from the backend
3. containerize frontend and backend
4. Create git hub workflow for frontend, backend, SAST and SCA scans, and container scans
5. Frontend:
    S3 creation: 
        Created a bucket called dom70-frontend-bucket
        Unchecked `Block All Access`
    
   Backend:
        EC2 Creation:
            created VPC, subnet, and security group
            after creation, I SSH into the EC2 instance by doing 
                `ssh -i key-file.pem ec2-user@<EC2-public-IP>`
                Once into the instance, I needed to test out commands to get the backend service running by running these commands:
                    ```sudo yum update -y
                    sudo yum install -y nodejs npm git
                    git clone https://github.com/DomDavis70/comic-viewer.git
                    cd comic-viewer
                    npm install
                    npm start```
                Now I can see the backend running!
            to automate this setup, I created a user scrpt on start up
   frontend:
        created a domain called comic-viewer.com
        create 2 a records. One for www.comic-viewer.com and comic-viewer.com
        Edit the front end to point to the EC2 IP address
        created 2 certificates for each a record
        setiing up cloudfront disribution - Redirect HTTP to HTTPS
    




