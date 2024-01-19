import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

interface NetworkingArgs {
    vpc_name: string;
    vpc_cidr: string;
    azs: string[];
    pub_sub_cidrs: string[];
    priv_sub_cidrs: string[];
}

export class Networking extends pulumi.ComponentResource {
    public readonly vpc: aws.ec2.Vpc;
    public readonly pub_subs: aws.ec2.Subnet[];
    public readonly priv_subs: aws.ec2.Subnet[];
    public readonly ig: aws.ec2.InternetGateway;
    public readonly pub_rt: aws.ec2.RouteTable;
    public readonly rt_associates: aws.ec2.RouteTableAssociation[];
    
    constructor(vpc: NetworkingArgs, opts?: pulumi.ComponentResourceOptions) {
        super("components:Networking", vpc.vpc_name, opts);
        
            this.vpc = new aws.ec2.Vpc("main-vpc", {
            cidrBlock: vpc.vpc_cidr,
            enableDnsHostnames: true,
            enableDnsSupport: true,
            tags: {
              Name: `${pulumi.getProject()}-${vpc.vpc_name}`,
              ManagedBy: "Pulumi",
            },
          })
        
          this.pub_subs = vpc.pub_sub_cidrs.map((subnet, index) => {
            return new aws.ec2.Subnet(`pub_sub${index + 1}`, {
              cidrBlock: vpc.pub_sub_cidrs[index],
              vpcId: this.vpc.id,
              availabilityZone: vpc.azs[index],
              mapPublicIpOnLaunch: true,
              tags: {
                Name: `${pulumi.getProject()}-pub-sub${index + 1}`,
                ManagedBy: "Pulumi",
              },
            });
          });

          this.priv_subs = vpc.priv_sub_cidrs.map((subnet, index) => {
            return new aws.ec2.Subnet(`priv_sub${index + 1}`, {
              cidrBlock: vpc.priv_sub_cidrs[index],
              vpcId: this.vpc.id,
              availabilityZone: vpc.azs[index],
              mapPublicIpOnLaunch: false,
              tags: {
                Name: `${pulumi.getProject()}-priv-sub${index + 1}`,
                ManagedBy: "Pulumi",
              },
            });
          });

          this.ig = new aws.ec2.InternetGateway("main-ig", {
            vpcId: this.vpc.id,
            tags: {
              Name: `${pulumi.getProject()}-ig`,
              ManagedBy: "Pulumi",
            },
          });

          this.pub_rt = new aws.ec2.RouteTable("pub_rt", {
            vpcId: this.vpc.id,
            routes: [
              {
                cidrBlock: "0.0.0.0/0",
                gatewayId: this.ig.id,
              },
            ],
            tags: {
              Name: `${pulumi.getProject()}-rt`,
              ManagedBy: "Pulumi",
            },
          });

          this.rt_associates = this.pub_subs.map((subnet, index) => {
            return new aws.ec2.RouteTableAssociation(`rt_associate-${index + 1}`, {
              subnetId: subnet.id,
              routeTableId: this.pub_rt.id,
            });
          });
    }
}