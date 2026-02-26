#!/bin/bash
# Build script for Job Scrabber Chrome Extension
# Creates two builds: production (Railway) and development (localhost)

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROD_URL="https://aware-endurance-production-13b8.up.railway.app"
DEV_URL="http://localhost:3000"

# Files to include in the extension package
FILES=(
  "manifest.json"
  "popup.html"
  "popup.js"
  "background.js"
  "content.js"
  "config.js"
  "styles.css"
)

build() {
  local env=$1
  local url=$2
  local out_dir="${SCRIPT_DIR}/dist/extension-${env}"

  echo "🔨 Building ${env} extension..."

  # Clean and create output directory
  rm -rf "$out_dir"
  mkdir -p "$out_dir/icons"

  # Copy extension files
  for file in "${FILES[@]}"; do
    cp "${SCRIPT_DIR}/${file}" "${out_dir}/${file}"
  done

  # Copy icons
  cp "${SCRIPT_DIR}/icons/"* "${out_dir}/icons/"

  # Configure backend URL and IS_DEV flag in config.js based on env
  if [[ "$OSTYPE" == "darwin"* ]]; then
    if [ "$env" = "prod" ]; then
        sed -i '' "s|http://localhost:3000|${url}|g" "${out_dir}/config.js"
        sed -i '' "s|IS_DEV: true|IS_DEV: false|" "${out_dir}/config.js"
    fi
  else
    if [ "$env" = "prod" ]; then
        sed -i "s|http://localhost:3000|${url}|g" "${out_dir}/config.js"
        sed -i "s|IS_DEV: true|IS_DEV: false|" "${out_dir}/config.js"
    fi
  fi

  # For production, keep only production domains in host_permissions
  if [ "$env" = "prod" ]; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' 's|"http://localhost:3000/\*",||' "${out_dir}/manifest.json"
    else
      sed -i 's|"http://localhost:3000/\*",||' "${out_dir}/manifest.json"
    fi
  fi

  # For dev, restrict host_permissions to only localhost
  if [ "$env" = "dev" ]; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' '/aware-endurance-production-13b8.up.railway.app/d' "${out_dir}/manifest.json"
      sed -i '' '/huntiq.work/d' "${out_dir}/manifest.json"
      # Clean up trailing comma on the remaining localhost entry
      sed -i '' 's|"http://localhost:3000/\*",|"http://localhost:3000/*"|' "${out_dir}/manifest.json"
    else
      sed -i '/aware-endurance-production-13b8.up.railway.app/d' "${out_dir}/manifest.json"
      sed -i '/huntiq.work/d' "${out_dir}/manifest.json"
      sed -i 's|"http://localhost:3000/\*",|"http://localhost:3000/*"|' "${out_dir}/manifest.json"
    fi
  fi

  # Create zip for Chrome Web Store upload (prod only)
  if [ "$env" = "prod" ]; then
    cd "$out_dir"
    zip -r "${SCRIPT_DIR}/dist/job-scrabber-v2.0.0.zip" . -x ".*"
    mkdir -p "${SCRIPT_DIR}/../public/assets"
    cp "${SCRIPT_DIR}/dist/job-scrabber-v2.0.0.zip" "${SCRIPT_DIR}/../public/assets/job-scrabber-extension.zip"
    cd "$SCRIPT_DIR"
    echo "📦 Created job-scrabber-v2.0.0.zip and copied to public/assets/"
  fi

  echo "✅ ${env} build ready at: dist/extension-${env}/"
}

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   Job Scrabber Extension Builder v2.0    ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Create dist directory
mkdir -p "${SCRIPT_DIR}/dist"

# Build both variants
build "prod" "$PROD_URL"
build "dev" "$DEV_URL"

echo ""
echo "🎉 All builds complete!"
echo ""
echo "  Production: dist/extension-prod/  (+ .zip for Chrome Web Store)"
echo "  Developer:  dist/extension-dev/   (for local testing)"
echo ""
echo "To load in Chrome:"
echo "  1. Go to chrome://extensions"
echo "  2. Enable Developer Mode"
echo "  3. Click 'Load unpacked'"
echo "  4. Select the appropriate dist/ folder"
echo ""
