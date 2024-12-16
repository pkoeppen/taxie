#!/bin/bash
# Clean up exited docker containers.
EXITED_CONTAINERS=$(docker ps -a | grep Exited | awk '{ print $1 }')
if [ -z "$EXITED_CONTAINERS" ]
then
  echo "No exited containers to clean"
else
  docker rm $EXITED_CONTAINERS
fi
 
# Renew certbot certificate.
docker-compose -f /app/docker-compose.yaml run --rm certbot
docker-compose -f /app/docker-compose.yaml exec nginx nginx -s reload