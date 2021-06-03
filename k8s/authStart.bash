#!/bin/bash
cd ../src
eval $(minikube docker-env)
docker image prune -f
docker build -t aws-ar-auth:latest  .
kubectl rollout restart deployment/auth-app-deployment
kubectl port-forward deployment/auth-app-deployment 8080:8080
