#!/bin/sh

pulumi stack output kubeconfig > kubeconfig.yml &&
echo -e "kubeconfig output SUCCESSFUL\n" >> outputs.txt &&
echo -e "Check node status:\n" >> outputs.txt &&
KUBECONFIG=./kubeconfig.yml kubectl get nodes >> outputs.txt &&
status=$(KUBECONFIG=./kubeconfig.yml kubectl get nodes | grep -o Ready) &&
if [[ -n $status ]]
then
echo -e "\n--CLUSTER READY--\n" >> outputs.txt
else
echo -e "--CLUSTER NOT READY--\n" >> outputs.txt
exit
fi
echo -e "Outputs:\n" >> outputs.txt &&
echo -e "DNS addresses:" >> outputs.txt &&
pulumi stack output albs >> outputs.txt &&
echo -e "\nPublic RDS address:" >> outputs.txt &&
pulumi stack output database >> outputs.txt &&
echo -e "\nPrometheus is now available on your localhost:9090" >> outputs.txt
KUBECONFIG=./kubeconfig.yml kubectl -n monitoring port-forward svc/prometheus-operated 9090:9090 &&

