#!/bin/bash
cd ../src
eval $(minikube docker-env)
docker image prune -f
docker build -t aws-ar-auth:latest  .
kubectl rollout restart deployment/auth-app-deployment
