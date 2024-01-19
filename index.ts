import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as eks from "@pulumi/eks";
import * as k8s from "@pulumi/kubernetes";

import {Networking} from "./Components/Networking"

const config = new pulumi.Config();

// interfaces
interface vpc {
  vpc_name: string;
  vpc_cidr: string;
  azs: string[];
  pub_sub_cidrs: string[];
  priv_sub_cidrs: string[];
}

interface yourDetails {
  yourIP: string;
  yourAccessKey: string;
}

interface clusterValues {
  instanceType: string;
  desiredCapacity: number;
  minSize: number;
  maxSize: number;
  namespaces: string[];
}

interface databaseValues {
  dbName: string;
    instanceClass: string;
    username: string;
    password: string;
}

interface privDatabaseValues {
    dbName: string;
    instanceClass: string;
    username: string;
}

// define objects from config file
const vpc = config.requireObject<vpc>("vpc");
const yourDetails = config.requireObject<yourDetails>("yourDetails");
const clusterValues = config.requireObject<clusterValues>("clusterValues");
const databaseValues = config.requireObject<databaseValues>("databaseValues")
const privDatabaseValues = config.requireObject<privDatabaseValues>("privDatabaseValues")

// ----NETWORKING----

const network = new Networking({
    vpc_name: vpc.vpc_name,
    vpc_cidr: vpc.vpc_cidr,
    azs: vpc.azs,
    pub_sub_cidrs: vpc.pub_sub_cidrs,
    priv_sub_cidrs: vpc.priv_sub_cidrs
})

// ----SECURITY----

// create security group - SSH IN
const sg_ssh = new aws.ec2.SecurityGroup("allow-ssh", {
  description: "Allows SSH connections from the provided IP address",
  vpcId: network.vpc.id,

  tags: {
    Name: `${pulumi.getProject()}-sg-allow-ssh`,
    ManagedBy: "Pulumi",
  },
});

const sg_ssh_ingress = new aws.vpc.SecurityGroupIngressRule("ssh-ingress", {
  securityGroupId: sg_ssh.id,
  cidrIpv4: yourDetails.yourIP,
  fromPort: 22,
  ipProtocol: "tcp",
  toPort: 22,
});

// create security group - HTTP (on 80 and 3000)
const sg_http = new aws.ec2.SecurityGroup("allow-http", {
  description: "Allow HTTP connections",
  vpcId: network.vpc.id,

  tags: {
    Name: `${pulumi.getProject()}-sg-allow-http`,
    ManagedBy: "Pulumi",
  },
});

const sg_http_ingress80 = new aws.vpc.SecurityGroupIngressRule(
  "http-80-ingress",
  {
    securityGroupId: sg_http.id,
    cidrIpv4: "0.0.0.0/0",
    fromPort: 80,
    ipProtocol: "tcp",
    toPort: 80,
  }
);

const sg_http_ingress3000 = new aws.vpc.SecurityGroupIngressRule(
  "http-3000-ingress",
  {
    securityGroupId: sg_http.id,
    cidrIpv4: "0.0.0.0/0",
    fromPort: 3000,
    ipProtocol: "tcp",
    toPort: 3000,
  }
);

const sg_http_ingress8084 = new aws.vpc.SecurityGroupIngressRule(
  "http-8084-ingress",
  {
    securityGroupId: sg_http.id,
    cidrIpv4: "0.0.0.0/0",
    fromPort: 8084,
    ipProtocol: "tcp",
    toPort: 8084,
  }
);

// create security group - egress
const sg_egress = new aws.ec2.SecurityGroup("allow-egress", {
  description: "Allow Egress connections",
  vpcId: network.vpc.id,

  tags: {
    Name: `${pulumi.getProject()}-sg-allow-egress`,
    ManagedBy: "Pulumi",
  },
});

const sg_egress_rule = new aws.vpc.SecurityGroupEgressRule("egress", {
  securityGroupId: sg_egress.id,
  cidrIpv4: "0.0.0.0/0",
  ipProtocol: "-1",
});


// create security group - allow pg ingress
const sg_rds = new aws.ec2.SecurityGroup("allow-postgres", {
  description: "Allow postgres connections",
  vpcId: network.vpc.id,

  tags: {
    Name: `${pulumi.getProject()}-sg-allow-pg`,
    ManagedBy: "Pulumi",
  },
});

const rds_ingress = new aws.vpc.SecurityGroupIngressRule("rds_ingress", {
  securityGroupId: sg_rds.id,
  cidrIpv4: "0.0.0.0/0",
  fromPort: 5432,
  ipProtocol: "tcp",
  toPort: 5432,
});

// ----EKS----

// create cluster
const cluster = new eks.Cluster("cluster", {
  vpcId: network.vpc.id,
  instanceType: clusterValues.instanceType,
  publicSubnetIds: network.pub_subs.map((sub) => sub.id),
  desiredCapacity: clusterValues.desiredCapacity,
  minSize: clusterValues.minSize,
  maxSize: clusterValues.maxSize,
  useDefaultVpcCni: true,
});

// create provider
const provider = new k8s.Provider("provider", {
  kubeconfig: cluster.kubeconfig,
});

// create namespaces
const cluster_namespaces = clusterValues.namespaces.map(namespace => {
  return new k8s.core.v1.Namespace(
    `${namespace}`, 
    {
      metadata: {
        name: namespace,
      },
    },
    { provider }
  )
})

// ----DATABASES----

// NOTE: the code as standard provisions a publicly accessible database for testing
// purposes. There is provision for a private database (a database in the 
// private subnets) which has the correct security group ingress rules to allowed
// access from cluster pods inside the VPC. This should be used for anything
// other than the testing Environment.

// ### PUBLIC DB ###

// create subnet group for database (public)
const db_subnet_group = new aws.rds.SubnetGroup("db_subnet_group", {
  subnetIds: network.pub_subs.map((sub) => sub.id),
  tags: {
    Name: `${pulumi.getProject()}-rd-subnet-group`,
    ManagedBy: "Pulumi",
  },
});

// NOTE: this should be uncommented, together with 
// "manageMasterUserPassword" in the database resource creation
// to force use of AWS secrets for added security and to avoid
// sensitive inforamtion being stored on gitHub

// const dbkey = new aws.kms.Key("dbkey", {description: "Example KMS Key"});

const nclearnerdb = new aws.rds.Instance("nclearnerdb", {
  allocatedStorage: 5,
  dbName: databaseValues.dbName,
  engine: "postgres",
  engineVersion: "14.10",
  instanceClass: databaseValues.instanceClass,
  //NOTE: uncomment following 2 lines for use of AWS Secrets
  //manageMasterUserPassword: true,
  //masterUserSecretKmsKeyId: dbkey.keyId,
  username: databaseValues.username,
  password: databaseValues.password,
  dbSubnetGroupName: db_subnet_group.name,
  vpcSecurityGroupIds: [sg_rds.id, sg_egress.id],
  publiclyAccessible: true,
  skipFinalSnapshot: true,
});

// ### PRIVATE DB ###

// create sg rule for private database
const rds_internal_ingress = new aws.vpc.SecurityGroupIngressRule(
  "rds_ingress_internal",
  {
    securityGroupId: sg_rds.id,
    referencedSecurityGroupId: cluster.nodeSecurityGroup.id,
    fromPort: 5432,
    ipProtocol: "tcp",
    toPort: 5432,
  }
);

// create subnet group for database (private)
const db_subnet_group_priv = new aws.rds.SubnetGroup("db_subnet_group_priv", {
  subnetIds: network.priv_subs.map((sub) => sub.id),
  tags: {
    Name: `${pulumi.getProject()}-rd-subnet-group-priv`,
    ManagedBy: "Pulumi",
  },
});

// create kms key for private database
const priv_dbkey = new aws.kms.Key("priv_dbkey", {
  description: "Private KMS Key",
});

// create private database
const priv_db = new aws.rds.Instance("privdb", {
  allocatedStorage: 5,
  dbName: privDatabaseValues.dbName,
  engine: "postgres",
  engineVersion: "14.10",
  instanceClass: privDatabaseValues.instanceClass,
  manageMasterUserPassword: true,
  masterUserSecretKmsKeyId: priv_dbkey.keyId,
  username: privDatabaseValues.username,
  dbSubnetGroupName: db_subnet_group.name,
  vpcSecurityGroupIds: [sg_rds.id, sg_egress.id],
  deletionProtection: false,
  skipFinalSnapshot: true,
});

// ----HELM CHARTS----

// NOTE: deploy helm charts AFTER the eks cluster and databases have been
// sucessfully built

// deploy argo helm chart behind alb service to allow public access
const argo_cd = new k8s.helm.v3.Chart(
  "argo-cd",
  {
    namespace: cluster_namespaces[0].metadata.name,
    chart: "argo-cd",
    fetchOpts: {
      repo: "https://argoproj.github.io/argo-helm",
    },
    values: {
      server: {
        service: {
          type: "LoadBalancer",
        },
      },
    },
  },
  { provider }
);

// deploy nginx ingress controller
const nginxIngressController = new k8s.helm.v3.Chart(
  "nginx-ingress",
  {
    namespace: cluster_namespaces[1].metadata.name,
    chart: "nginx-ingress",
    fetchOpts: { repo: "https://helm.nginx.com/stable" },
    values: {
      controller: {
        kind: "daemonset",
        service: {
          type: "LoadBalancer",
          annotations: {
            "service.beta.kubernetes.io/aws-load-balancer-type": "nlb",
          },
        },
      },
    },
  },
  { provider }
);

// export dns for ingress lb and argo lb to string
const ingress = {
  nginx_loadBalancer_pub_dns: nginxIngressController.getResource("v1/Service", "nginx/nginx-ingress-controller"
  ).status.loadBalancer.ingress[0].hostname,
  argo_loadBalancer_pub_dns: argo_cd.getResource("v1/Service",
    "argo-cd/argo-cd-argocd-server"
  ).status.loadBalancer.ingress[0].hostname
}

let ingressString = ingress.nginx_loadBalancer_pub_dns.apply(dns => "" + dns);

// export const typeingressstring = typeof ingressString.toString()

// deploy prometheus and grafana
const prometheus = new k8s.helm.v3.Chart(
  "prometheus",
  {
    namespace: cluster_namespaces[2].metadata.name,
    chart: "kube-prometheus-stack",
    fetchOpts: { repo: "https://prometheus-community.github.io/helm-charts" },
    values: {
      prometheus: {
      prometheusSpec: {
        additionalScrapeConfigs: [
          {
            job_name: "spring-scrape",
            metrics_path: "/actuator/prometheus",
            scrape_interval: "5s",
            static_configs: [
              {
                //add the dns of the network.vpc ingress load balancer here
                targets: [ingressString],
              },
                ],
              },
      ],
    }
  },
}
  },
  { provider }
);


// ----EXPORTS----

// dns address for public database
export const database = nclearnerdb.address;

// dns address for private database
export const priv_database = priv_db.address;

// kubeconfig for kubectl 
export const kubeconfig = cluster.kubeconfig;

// dns for albs
export const albs = ingress
