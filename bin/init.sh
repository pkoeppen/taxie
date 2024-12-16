#!/bin/bash

# ANSI escape codes.
RESET="\e[0m"
BOLD="\e[1m"

# Colors.
RED="\e[31m"
GREEN="\e[32m"
YELLOW="\e[33m"
BLUE="\e[34m"
MAGENTA="\e[35m"
CYAN="\e[36m"
WHITE="\e[37m"

# === Functions ===

show_help() {
  echo -e "${CYAN}
▗▖  ▗▖█  ▐▌█ █  ▄▄▄   ▗▄▄▖▗▞▀▚▖▄▄▄▄  
▐▛▚▖▐▌▀▄▄▞▘█ █ █   █ ▐▌   ▐▛▀▀▘█   █ 
▐▌ ▝▜▌     █ █ ▀▄▄▄▀ ▐▌▝▜▌▝▚▄▄▖█   █ 
▐▌  ▐▌     █ █       ▝▚▄▞▘     
                                v0.1
${RESET}${BOLD}Usage:${RESET} init.sh [OPTIONS]

This script generates a boilerplate web application using NextJS, Postgres, Redis and NGINX.
It is containerized with Docker to be vendor-independent and deployable anywhere with minimal configuration.

${BOLD}Options:${RESET}
  ${YELLOW}--app-name <name>${RESET}               Specify the application name (required).
  ${YELLOW}--nextjs-port <port>${RESET}            Specify the Next.js server port (default: ${GREEN}3000${RESET}).
  ${YELLOW}--node-env <env>${RESET}                Set the Node.js environment (default: ${GREEN}development${RESET}).
  ${YELLOW}--postgres-host <host>${RESET}          Set the PostgreSQL host (default: ${GREEN}127.0.0.1${RESET}).
  ${YELLOW}--postgres-port <port>${RESET}          Set the PostgreSQL port (default: ${GREEN}5432${RESET}).
  ${YELLOW}--postgres-user <user>${RESET}          Set the PostgreSQL user (default: value of ${YELLOW}--app-name${RESET}).
  ${YELLOW}--postgres-password <password>${RESET}  Set the PostgreSQL password (default: value of ${YELLOW}--app-name${RESET}).
  ${YELLOW}--postgres-db <database>${RESET}        Set the PostgreSQL database name (default: value of ${YELLOW}--app-name${RESET}).
  ${YELLOW}--redis-port <port>${RESET}             Set the Redis port (default: ${GREEN}6379${RESET}).
  ${YELLOW}--help${RESET}                          Display this help message and exit.

${BOLD}Examples:${RESET}
  ${GREEN}./init.sh --app-name myapp --node-env production${RESET}
      Generate boilerplate files for the app "myapp" in a production environment.

  ${GREEN}./init.sh --app-name myapp --nextjs-port 8080${RESET}
      Generate boilerplate files for "myapp" with Next.js running on port 8080.

  ${GREEN}./init.sh --app-name myapp --postgres-host db.myapp.com --postgres-port 5433${RESET}
      Configure PostgreSQL for "myapp" with a custom host and port.

${BOLD}Notes:${RESET}
  - The ${YELLOW}--app-name${RESET} option is required. All other options are optional and have default values.
  - The script processes the following template files:
    - ${CYAN}.env.template${RESET}
    - ${CYAN}package.json.template${RESET}
    - ${CYAN}docker/Dockerfile.template${RESET}
    - ${CYAN}docker/docker-compose.yml.template${RESET}
  - Each template file is processed to replace placeholders such as ${YELLOW}%APP_NAME%${RESET}, ${YELLOW}%POSTGRES_HOST%${RESET}, and ${YELLOW}%REDIS_PORT%${RESET} with their corresponding values.
  - Ensure the required tools like sed and Docker are installed on your system before running this script.
"
}

error() {
  echo -e "\e[31m$1\e[0m"
}

# === Flags ===

while [[ "$#" -gt 0 ]]; do
  case $1 in
    --app-name)
      APP_NAME="$2"
      shift
      ;;
    --nextjs-port)
      NODE_ENV="$2"
      shift
      ;;
    --node-env)
      NODE_ENV="$2"
      shift
      ;;
    --postgres-host)
      POSTGRES_HOST="$2"
      shift
      ;;
    --postgres-port)
      POSTGRES_PORT="$2"
      shift
      ;;
    --postgres-user)
      POSTGRES_USER="$2"
      shift
      ;;
    --postgres-password)
      POSTGRES_PORT="$2"
      shift
      ;;
    --postgres-db)
      POSTGRES_DB="$2"
      shift
      ;;
    --redis-port)
      REDIS_PORT="$2"
      shift
      ;;
    --help)
      show_help
      exit 0
      ;;
    *)
      error "Error: Unknown option $1" >&2
      exit 1
      ;;
  esac
  shift
done

if [[ -z "$APP_NAME" ]]; then
  error "Error: The --app-name flag is required" >&2
  exit 1
fi

# === Defaults ===

NEXTJS_PORT="${NODE_ENV:-3000}"
NODE_ENV="${NODE_ENV:-development}"
POSTGRES_HOST="${POSTGRES_HOST:-127.0.0.1}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-$APP_NAME}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-$APP_NAME}"
POSTGRES_DB="${POSTGRES_DB:-$APP_NAME}"
REDIS_PORT="${REDIS_PORT:-6379}"

declare -A PLACEHOLDERS=(
  ["%APP_NAME%"]="$APP_NAME"
  ["%NEXTJS_PORT%"]="$NEXTJS_PORT"
  ["%NODE_ENV%"]="$NODE_ENV"
  ["%POSTGRES_HOST%"]="$POSTGRES_HOST"
  ["%POSTGRES_PORT%"]="$POSTGRES_PORT"
  ["%POSTGRES_USER%"]="$POSTGRES_USER"
  ["%POSTGRES_PASSWORD%"]="$POSTGRES_PASSWORD"
  ["%POSTGRES_DB%"]="$POSTGRES_DB"
  ["%REDIS_PORT%"]="$REDIS_PORT"
)

FILES=(
  ".env.template"
  "package.json.template"
  "docker/Dockerfile.template"
  "docker/docker-compose.yml.template"
)

for FILE in "${FILES[@]}"; do
  echo "Processing $FILE..."

  # Check if the file exists.
  if [[ -f "$FILE" ]]; then
    # Define the new file name by removing the `.template` suffix, then
    # copy the original content to the new file for initial processing.
    NEW_FILE="${FILE%.template}"
    cp "$FILE" "$NEW_FILE"

    # Iterate through each placeholder and replace it in the new file.
    # Use a temporary intermediate file in case SHTF.
    for PLACEHOLDER in "${!PLACEHOLDERS[@]}"; do 
      REPLACEMENT="${PLACEHOLDERS[$PLACEHOLDER]}"
      sed "s|$PLACEHOLDER|$REPLACEMENT|g" "$NEW_FILE" > "$NEW_FILE.tmp" && mv "$NEW_FILE.tmp" "$NEW_FILE"
      echo -e "\e[34mReplaced $PLACEHOLDER with \e[36m$REPLACEMENT\e[34m in $NEW_FILE.\e[0m"
    done

  else
    error "File $FILE does not exist. Skipping."
  fi
done

echo -e "\e[32mAll replacements completed."
