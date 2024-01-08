import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as eks from "@pulumi/eks";
import * as k8s from "@pulumi/kubernetes";
import { SecurityGroup } from "@pulumi/aws/ec2";

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

interface namespaces {
  argo: string;
  nginx: string;
}

// define objects from config file
const vpc = config.requireObject<vpc>("vpc");
const yourDetails = config.requireObject<yourDetails>("yourDetails");
const namespaces = config.requireObject<namespaces>("namespaces");

// ----NETWORKING----
// create VPC
const main = new aws.ec2.Vpc("main-vpc", {
  cidrBlock: vpc.vpc_cidr,
  enableDnsHostnames: true,
  enableDnsSupport: true,
  tags: {
    Name: `${pulumi.getProject()}-${vpc.vpc_name}`,
    ManagedBy: "Pulumi",
  },
});

// create pub subs
const pub_sub = vpc.pub_sub_cidrs.map((subnet, index) => {
  return new aws.ec2.Subnet(`pub_sub${index + 1}`, {
    cidrBlock: vpc.pub_sub_cidrs[index],
    vpcId: main.id,
    availabilityZone: vpc.azs[index],
    mapPublicIpOnLaunch: true,
    tags: {
      Name: `${pulumi.getProject()}-pub-sub${index + 1}`,
      ManagedBy: "Pulumi",
    },
  });
});

// create priv subs
const priv_sub = vpc.priv_sub_cidrs.map((subnet, index) => {
  return new aws.ec2.Subnet(`priv_sub${index + 1}`, {
    cidrBlock: vpc.priv_sub_cidrs[index],
    vpcId: main.id,
    availabilityZone: vpc.azs[index],
    mapPublicIpOnLaunch: false,
    tags: {
      Name: `${pulumi.getProject()}-priv-sub${index + 1}`,
      ManagedBy: "Pulumi",
    },
  });
});

// create ig
const ig = new aws.ec2.InternetGateway("main-ig", {
  vpcId: main.id,
  tags: {
    Name: `${pulumi.getProject()}-ig`,
    ManagedBy: "Pulumi",
  },
});

// create rt
const pub_rt = new aws.ec2.RouteTable("pub_rt", {
  vpcId: main.id,
  routes: [
    {
      cidrBlock: "0.0.0.0/0",
      gatewayId: ig.id,
    },
  ],
  tags: {
    Name: `${pulumi.getProject()}-rt`,
    ManagedBy: "Pulumi",
  },
});

// rt associations
const rt_associate = pub_sub.map((subnet, index) => {
  return new aws.ec2.RouteTableAssociation(`rt_associate-${index + 1}`, {
    subnetId: subnet.id,
    routeTableId: pub_rt.id,
  });
});

// ----SECURITY----

// create security group - SSH IN
const sg_ssh = new aws.ec2.SecurityGroup("allow-ssh", {
  description: "Allows SSH connections from the provided IP address",
  vpcId: main.id,

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

// create security group - HTTP
const sg_http = new aws.ec2.SecurityGroup("allow-http", {
  description: "Allow HTTP connections",
  vpcId: main.id,

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
    // need to figure out which port the app is listening on
    fromPort: 3000,
    ipProtocol: "tcp",
    toPort: 3000,
  }
);

const sg_egress = new aws.ec2.SecurityGroup("allow-egress", {
  description: "Allow Egress connections",
  vpcId: main.id,

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

// ALLOW PG INGRESS / EGRESS

const sg_rds = new aws.ec2.SecurityGroup("allow-postgres", {
  description: "Allow postgres connections",
  vpcId: main.id,

  tags: {
    Name: `${pulumi.getProject()}-sg-allow-pg`,
    ManagedBy: "Pulumi",
  },
});

const rds_ingress = new aws.vpc.SecurityGroupIngressRule(
  "rds_ingress",
  {
    securityGroupId: sg_rds.id,
    cidrIpv4: "185.205.174.138/32",
    fromPort: 5432,
    ipProtocol: "tcp",
    toPort: 5432,
  }
);

// ----EKS----

const cluster = new eks.Cluster("cluster", {
  vpcId: main.id,
  instanceType: "t2.medium",
  publicSubnetIds: pub_sub.map((sub) => sub.id),
  desiredCapacity: 2,
  minSize: 1,
  maxSize: 2,
  useDefaultVpcCni: true,
});

const provider = new k8s.Provider("provider", {
  kubeconfig: cluster.kubeconfig,
});

const argo_cd_ns = new k8s.core.v1.Namespace(
  "argocd-ns",
  {
    metadata: {
      name: namespaces.argo,
    },
  },
  { provider }
);

const argo = new k8s.helm.v3.Chart(
  "argo",
  {
    namespace: argo_cd_ns.metadata.name,
    chart: "argo-cd",
    // version: "2.4.9",
    fetchOpts: {
      repo: "https://argoproj.github.io/argo-helm",
    },
  },
  { provider }
);

const nginx_ns = new k8s.core.v1.Namespace(
  "nginx-ns",
  {
    metadata: {
      name: namespaces.nginx,
    },
  },
  { provider }
);

const nginxIngressController = new k8s.helm.v3.Chart(
  "nginx-ingress",
  {
    chart: "nginx-ingress",
    fetchOpts: { repo: "https://helm.nginx.com/stable" },
    // Override the default configuration
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

// CREATE SUBNET GROUP FOR DATABASE (PUBLIC)

const db_subnet_group = new aws.rds.SubnetGroup("db_subnet_group", {
  subnetIds: pub_sub.map((sub) => sub.id),
  tags: {
    Name: `${pulumi.getProject()}-rd-subnet-group`,
    ManagedBy: "Pulumi",
  },
});

// FOR SECRETS
// const dbkey = new aws.kms.Key("dbkey", {description: "Example KMS Key"});

const _default = new aws.rds.Instance("default", {
    allocatedStorage: 5,
    dbName: "mydb",
    engine: "postgres",
    engineVersion: "14.10",
    instanceClass: "db.t3.micro",
    //manageMasterUserPassword: true,
    //masterUserSecretKmsKeyId: dbkey.keyId,
    username: "nclearner",
    password: "password",
    dbSubnetGroupName: db_subnet_group.name,
    vpcSecurityGroupIds: [sg_rds.id, sg_egress.id],
    publiclyAccessible: true,
    // parameterGroupName: "default.mysql5.7",
});

// CREATE SUBNET GROUP FOR DATABASE (PRIVATE)

const db_subnet_group_priv = new aws.rds.SubnetGroup("db_subnet_group_priv", {
  subnetIds: priv_sub.map((sub) => sub.id),
  tags: {
    Name: `${pulumi.getProject()}-rd-subnet-group-priv`,
    ManagedBy: "Pulumi",
  },
});

// FOR SECRETS
const priv_dbkey = new aws.kms.Key("priv_dbkey", {description: "Private KMS Key"});

const priv_db = new aws.rds.Instance("priv_db", {
  allocatedStorage: 5,
  dbName: "mydb",
  engine: "postgres",
  engineVersion: "14.10",
  instanceClass: "db.t3.micro",
  manageMasterUserPassword: true,
  masterUserSecretKmsKeyId: priv_dbkey.keyId,
  username: "nclearnerpriv",
  dbSubnetGroupName: db_subnet_group.name,
  vpcSecurityGroupIds: [sg_rds.id, sg_egress.id],
  publiclyAccessible: true,
  // parameterGroupName: "default.mysql5.7",
});

export const database = _default.address

export const kubeconfig = cluster.kubeconfig;
