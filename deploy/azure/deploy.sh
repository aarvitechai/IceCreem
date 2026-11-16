#!/usr/bin/env bash
# Deploys the whole platform to Azure Container Apps.
# Safe to run again: it creates what is missing and updates what exists.
#
# Run from the repository root, in Azure Cloud Shell (bash) or any shell with Azure CLI:
#   export SQL_ADMIN_PASSWORD='...' JWT_KEY='...' SEED_PASSWORD='...'
#   APP_ENV=staging bash deploy/azure/deploy.sh
#
# Full guide: docs/deploy-azure.md
set -euo pipefail

# ---------- Settings (change if you like) ----------
APP_ENV="${APP_ENV:-staging}"            # staging or production
LOCATION="${LOCATION:-centralindia}"     # Azure region close to your users
PREFIX="${PREFIX:-icecream}"             # lowercase letters only
TAG="${TAG:-$(git rev-parse --short HEAD 2>/dev/null || date +%Y%m%d%H%M)}"

# ---------- Required secrets (never commit these) ----------
: "${SQL_ADMIN_PASSWORD:?Set SQL_ADMIN_PASSWORD (12+ chars, upper, lower, number, symbol, no quotes)}"
: "${JWT_KEY:?Set JWT_KEY (32+ random chars). Example: export JWT_KEY=\$(openssl rand -base64 48)}"
: "${SEED_PASSWORD:?Set SEED_PASSWORD (first login password for the seeded admin users)}"

if [[ "$APP_ENV" != "staging" && "$APP_ENV" != "production" ]]; then
  echo "APP_ENV must be staging or production"; exit 1
fi
[[ -f backend/Dockerfile ]] || { echo "Run this from the repository root."; exit 1; }

# Test only conveniences are off in production.
if [[ "$APP_ENV" == "staging" ]]; then SHOW_DEMO_LOGINS=true; API_DOCS=true; else SHOW_DEMO_LOGINS=false; API_DOCS=false; fi

# ---------- Names ----------
# Some Azure names must be unique worldwide, so we add a short code from your subscription id.
SUFFIX=$(az account show --query id -o tsv | md5sum | cut -c1-5)
SHORT_ENV="${APP_ENV:0:4}"                       # stag or prod
RG="rg-${PREFIX}-${APP_ENV}"
ACR="${PREFIX}${SHORT_ENV}${SUFFIX}acr"          # letters and numbers only
SQL_SERVER="${PREFIX}-${SHORT_ENV}-${SUFFIX}-sql"
SQL_DB="IceCreamDb"
SQL_ADMIN="icecreamadmin"
STORAGE="${PREFIX}${SHORT_ENV}${SUFFIX}st"
ENV_NAME="${PREFIX}-${APP_ENV}-env"

step() { echo; echo "==> $*"; }
exists() { "$@" >/dev/null 2>&1; }

step "Using subscription: $(az account show --query name -o tsv)"
echo "Environment: $APP_ENV | Region: $LOCATION | Image tag: $TAG"

step "1/9 Preparing Azure CLI"
az extension add --name containerapp --upgrade --only-show-errors
az provider register -n Microsoft.App --wait
az provider register -n Microsoft.OperationalInsights --wait

step "2/9 Resource group $RG"
az group create -n "$RG" -l "$LOCATION" -o none

step "3/9 Container registry $ACR"
exists az acr show -n "$ACR" -g "$RG" || az acr create -n "$ACR" -g "$RG" --sku Basic --admin-enabled true -o none
ACR_SERVER=$(az acr show -n "$ACR" --query loginServer -o tsv)
ACR_USER=$(az acr credential show -n "$ACR" --query username -o tsv)
ACR_PASSWORD=$(az acr credential show -n "$ACR" --query "passwords[0].value" -o tsv)

step "4/9 Building images in Azure (no local Docker needed)"
az acr build -r "$ACR" -t "icecream-api:$TAG" backend --only-show-errors -o none
az acr build -r "$ACR" -t "icecream-web:$TAG" \
  --build-arg API_INTERNAL_URL=http://api \
  --build-arg NEXT_PUBLIC_SHOW_DEMO_LOGINS="$SHOW_DEMO_LOGINS" \
  frontend --only-show-errors -o none
az acr build -r "$ACR" -t "icecream-gateway:$TAG" -f deploy/azure/Dockerfile.gateway deploy/azure --only-show-errors -o none

step "5/9 Azure SQL database"
exists az sql server show -n "$SQL_SERVER" -g "$RG" || \
  az sql server create -n "$SQL_SERVER" -g "$RG" -l "$LOCATION" \
    --admin-user "$SQL_ADMIN" --admin-password "$SQL_ADMIN_PASSWORD" -o none
exists az sql db show -n "$SQL_DB" -s "$SQL_SERVER" -g "$RG" || \
  az sql db create -n "$SQL_DB" -s "$SQL_SERVER" -g "$RG" \
    --edition GeneralPurpose --compute-model Serverless --family Gen5 --capacity 1 \
    --auto-pause-delay 60 --backup-storage-redundancy Local -o none
# 0.0.0.0 is the special rule "allow Azure services", so Container Apps can connect.
az sql server firewall-rule create -s "$SQL_SERVER" -g "$RG" -n AllowAzureServices \
  --start-ip-address 0.0.0.0 --end-ip-address 0.0.0.0 -o none
DB_CONNECTION="Server=tcp:${SQL_SERVER}.database.windows.net,1433;Initial Catalog=${SQL_DB};User ID=${SQL_ADMIN};Password=${SQL_ADMIN_PASSWORD};Encrypt=True;TrustServerCertificate=False;Connection Timeout=60;"

step "6/9 Storage for uploaded images"
exists az storage account show -n "$STORAGE" -g "$RG" || \
  az storage account create -n "$STORAGE" -g "$RG" -l "$LOCATION" --sku Standard_LRS --kind StorageV2 --min-tls-version TLS1_2 -o none
STORAGE_KEY=$(az storage account keys list -n "$STORAGE" -g "$RG" --query "[0].value" -o tsv)
az storage share-rm create --storage-account "$STORAGE" -g "$RG" -n uploads --quota 5 -o none

step "7/9 Container Apps environment $ENV_NAME"
exists az containerapp env show -n "$ENV_NAME" -g "$RG" || \
  az containerapp env create -n "$ENV_NAME" -g "$RG" -l "$LOCATION" -o none
az containerapp env storage set -n "$ENV_NAME" -g "$RG" --storage-name uploads \
  --azure-file-account-name "$STORAGE" --azure-file-account-key "$STORAGE_KEY" \
  --azure-file-share-name uploads --access-mode ReadWrite -o none
ENV_ID=$(az containerapp env show -n "$ENV_NAME" -g "$RG" --query id -o tsv)

step "8/9 Apps: api, web, gateway"
# API comes from a YAML file because it needs the uploads volume.
export LOCATION ENV_ID ACR_SERVER ACR_USER ACR_PASSWORD DB_CONNECTION JWT_KEY SEED_PASSWORD TAG API_DOCS
API_SPEC=$(mktemp)
trap 'rm -f "$API_SPEC"' EXIT
envsubst '$LOCATION $ENV_ID $ACR_SERVER $ACR_USER $ACR_PASSWORD $DB_CONNECTION $JWT_KEY $SEED_PASSWORD $TAG $API_DOCS' \
  < deploy/azure/api.yaml > "$API_SPEC"
if exists az containerapp show -n api -g "$RG"; then
  az containerapp update -n api -g "$RG" --yaml "$API_SPEC" -o none
else
  az containerapp create -n api -g "$RG" --yaml "$API_SPEC" -o none
fi

create_or_update() {
  local name=$1 image=$2 port=$3 ingress=$4 min=$5 max=$6; shift 6
  if exists az containerapp show -n "$name" -g "$RG"; then
    az containerapp update -n "$name" -g "$RG" --image "$image" "$@" -o none
  else
    az containerapp create -n "$name" -g "$RG" --environment "$ENV_NAME" --image "$image" \
      --registry-server "$ACR_SERVER" --registry-username "$ACR_USER" --registry-password "$ACR_PASSWORD" \
      --target-port "$port" --ingress "$ingress" --min-replicas "$min" --max-replicas "$max" \
      --cpu 0.5 --memory 1.0Gi "$@" -o none
  fi
}

create_or_update web "$ACR_SERVER/icecream-web:$TAG" 3000 internal 1 3 --env-vars API_INTERNAL_URL=http://api
create_or_update gateway "$ACR_SERVER/icecream-gateway:$TAG" 80 external 1 2
# The gateway calls api and web over plain HTTP inside the private environment.
az containerapp ingress update -n web -g "$RG" --allow-insecure -o none

step "9/9 Done"
URL=$(az containerapp show -n gateway -g "$RG" --query properties.configuration.ingress.fqdn -o tsv)
echo "Website:  https://$URL"
echo "Admin:    https://$URL/admin"
if [[ "$API_DOCS" == "true" ]]; then echo "API docs: https://$URL/scalar/v1"; fi
echo "Health:   https://$URL/health/ready"
echo
echo "First start runs database migrations and can take 1 to 2 minutes."
