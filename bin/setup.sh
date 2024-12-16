#!/bin/bash

DIR="$(dirname "$(readlink -f "$0")")"

docker_setup() {
  # Uninstall unofficial Docker packages.
  for pkg in docker.io docker-doc docker-compose podman-docker containerd runc; do sudo apt-get remove $pkg; done

  sudo apt-get install -y curl ca-certificates

  # Add Docker's official GPG key.
  sudo install -m 0755 -d /etc/apt/keyrings
  sudo curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
  sudo chmod a+r /etc/apt/keyrings/docker.asc

  # Add the repository to apt sources.
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
    sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
  sudo apt-get update

  # Install Docker.
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
}

appuser_setup() {
  if ! id appuser &>/dev/null; then
    sudo useradd -r -s /bin/false -d /app appuser
  fi
  sudo usermod -aG docker appuser
  sudo chown -R appuser:appuser /app
  sudo chmod -R 755 /app
}

firewall_setup() {
  sudo apt-get install -y ufw
  sudo ufw allow 22
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp
  sudo ufw --force enable
}

tls_setup() {
  # Generate certificate.
  docker run -v "$DIR/../nginx/init.conf.template:/etc/../nginx/templates/default.conf.template" \
    -v "$DIR/../nginx/letsencrypt:/etc/letsencrypt" -v "$DIR/../nginx/certbot:/var/www/certbot" -p 80:80 \
    --name nginx -d nginx:latest
  docker compose up --no-deps certbot
  docker rm --force nginx
  
  # Configure Let's Encrypt.
  curl -L --create-dirs -o nginx/letsencrypt/options-ssl-nginx.conf https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf
  openssl dhparam -out nginx/letsencrypt/ssl-dhparams.pem 2048
}

service_setup() {
  sudo cp "$DIR/app.service" /etc/systemd/system/
  sudo systemctl enable --now app.service
}

crontab_setup() {
  sudo -u appuser crontab "$DIR/../nginx/crontab"
}

main() {
  docker_setup
  appuser_setup
  firewall_setup
}

main
