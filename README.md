# NC final project

## CICD Pipeline with Jenkins

The Continuous Implementation and Continuous Development part of the process utilised a Pipeline as Code approach, using Jenkins as a tool.

The pipeline watches the gitHub repos for changes to the code and does the following:

1. Builds the Docker image
2. Runs the tests
3. Pushes the new image to DockerHub

In each app repo there is a Dockerfile and a Jenkinsfile with the code required to run the pipeline and build the images.

### Dependencies

Jenkins needs to be installed and set up locally on your system. In this build the pipeline has been built and tested using a local install of Jenkins. If you wish to install Jenkins in a Docker container, ensure that you enable access to the host Docker daemon in order to allow Jenkins to build on Docker.



## Environment installation via Pulumi

The following resources are created with the insfrastructure code:

### Networking:

VPC, 3 private subnets, 3 public subnets



### Dependencies

1. node
2. pulumi
3. npm
4. aws account

For Pulumi, it is recommended to follow the set-up guide (here)[https://www.pulumi.com/docs/clouds/aws/get-started/begin/]
   
### Set-up

1. Clone the repository and navigate to the folder / open with IDE

2. Authenticate with AWS

3. Run `npm i` - this will install the packages and dependencies for the Pulumi project

4. To build the infrastructure, run `pulumi up`. Choose the stack required. It is recommended to test the infrastructure build using the `dev` stack first.

5. Check build via Pulumi console and/or AWS console.