# Learner Management System

Welcome to our learner management system repository! This collaborative effort by our team aims to deploy a learner management system to the AWS cloud. This repository houses code, documentation, and guides for a smooth deployment process. By harnessing AWS capabilities, our aim was to create a highly efficient and scalable system.
<br> <br>

View all the tools and languages that were used at the bottom of the page!

<br>

## Table of Contents

1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Getting Started](#getting-started)
    - [Clone the Repository](#clone-the-repository)
    - [Setting up AWS](#setting-up-aws)
4. [Usage](#usage)
    - [Application Setup](#application-setup)
    - [Accessing the Learner UI](#accessing-the-learner-ui)
5. [System Infrastructure](#system-infrastructure)
6. [Languages and Tools](#languages-and-tools)
7. [Contributing](#contributing)
9. [License](#license)

## Introduction

Our learner management system allows users to access a Northcoders UI, sign up as a new user, or sign in as a pre-existing user. This README provides comprehensive guidance on setting up and running the system.

## Prerequisites

Before you start, ensure you have the following prerequisites:

- [AWS Account](https://aws.amazon.com/)
- [Node.js](https://nodejs.org/) installed
- [Java](https://www.java.com/) installed
- [Docker](https://www.docker.com/) installed
- [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/) installed

## Getting Started

### Clone the Repository

```bash
git clone https://github.com/your-username/learner-management-system.git
cd learner-management-system
```

### Setting up AWS

Ensure you have an AWS account and configure your credentials.

```bash
aws configure
```

## Aplication Setup:
In order to create and deploy the infrastructure, simply run the following commands:
<br> <br>

```bash
pulumi init
```
<br>

```bash
pulumi up
```
<br> 

### Accessing the Learner UI

Open your browser and navigate to [http://localhost:3000](http://localhost:3000) to access the Learner UI.
<br> <br> OR <br> <br>
Open your browser and navigate to the created ingress DNS to access the Learner UI.

<br> 

## System Infrastructure
Our infrastructure was created using the popular IaC tool Pulumi. <br>
Through the use of Pulumi, We successfully created an infrastructure which consists of the following:
<br> <br>

|  IaC Networking | IaC Security |
| ------------- | --------------- |
| Ec2 Provisioning | SSH Security Group |
| 3 Public Subnets | Ingress Security Groups |
| 3 Private Subnets | Egress Security Groups |
| Internet Gateway | HTTP Security Groups |
| Public Route Table | Security Group Rules |


<br>

## Languages and Tools

Throught the creation on this project, many tools and languages were used. However, luckly for you we have completed the hard lifting. Therefore, you will not need to worry about having to use all the tools and languages that we did, in order to get this system up and running. 
<br> <br>
Here is a list of the tools and languages that were used:
<br> <br>

| Tool/Language  | Used For |
| ------------- | ------------- |
| Amazon AWS | Cloud Computing Provider |
| Pulumi  | Infrastructure as Code (IaC)  |
| Argo CD  | Workflow Automation |
| Jenkins | Continuous Integration / Continuous Deployment Pipeline |
| Circle CI  | Continuous Integration / Continuous Deployment Backup Pipeline|
| Docker | Containerization |
| Kubernetes | Container Orchestration Platform |
| Java | Object-Oriented Programming Language |
| Helm | Package Manager |
| Prometheus | Metrics Scraping |
| Grafana  | Metrics Visualization |
| PostgreSQL | Database  |
| React | Frontend JavaScript Library |
| HTML | Hyper Text Markup Language |
| Javascript | Object Oriented Programming Language |
| GitHub | Source Management Control |

<br> <br>
<p align="left"> <a href="https://aws.amazon.com" target="_blank" rel="noreferrer"> <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/amazonwebservices/amazonwebservices-original-wordmark.svg" alt="aws" width="40" height="40"/> </a> <a href="https://circleci.com" target="_blank" rel="noreferrer"> <img src="https://www.vectorlogo.zone/logos/circleci/circleci-icon.svg" alt="circleci" width="40" height="40"/> </a> <a href="https://www.docker.com/" target="_blank" rel="noreferrer"> <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/docker/docker-original-wordmark.svg" alt="docker" width="40" height="40"/> </a> <a href="https://grafana.com" target="_blank" rel="noreferrer"> <img src="https://www.vectorlogo.zone/logos/grafana/grafana-icon.svg" alt="grafana" width="40" height="40"/> </a> <a href="https://www.java.com" target="_blank" rel="noreferrer"> <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/java/java-original.svg" alt="java" width="40" height="40"/> </a> <a href="https://www.jenkins.io" target="_blank" rel="noreferrer"> <img src="https://www.vectorlogo.zone/logos/jenkins/jenkins-icon.svg" alt="jenkins" width="40" height="40"/> </a> <a href="https://kubernetes.io" target="_blank" rel="noreferrer"> <img src="https://www.vectorlogo.zone/logos/kubernetes/kubernetes-icon.svg" alt="kubernetes" width="40" height="40"/> </a> <a href="https://www.nginx.com" target="_blank" rel="noreferrer"> <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/nginx/nginx-original.svg" alt="nginx" width="40" height="40"/> </a> <a href="https://www.postgresql.org" target="_blank" rel="noreferrer"> <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/postgresql/postgresql-original-wordmark.svg" alt="postgresql" width="40" height="40"/> </a> <a href="https://reactjs.org/" target="_blank" rel="noreferrer"> <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/react/react-original-wordmark.svg" alt="react" width="40" height="40"/> </a> <a href="https://spring.io/" target="_blank" rel="noreferrer"> <img src="https://www.vectorlogo.zone/logos/springio/springio-icon.svg" alt="spring" width="40" height="40"/> </a> <a href="https://www.typescriptlang.org/" target="_blank" rel="noreferrer"> <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/typescript/typescript-original.svg" alt="typescript" width="40" height="40"/> </a> </p>

<br> <br> 

## Contributing
Feel free to modify any parts of this template according to the specific details of your project.

<br> <br>

## License

This project is licensed under the MIT License. 
<br> <br>
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)








# Another Version of readme:


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