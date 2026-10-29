#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

VERSION="$(tr -d '[:space:]' < VERSION)"
ADDON_ID="scansci-pdf@zhuzhiqiang.local"
MIN_VERSION="7.0"
MAX_VERSION="10.0.*"
UPDATE_LINK="https://github.com/qiangqianglab/scansci-zotero/releases/download/v${VERSION}/scansci.xpi"

perl -0pi -e "s/\"version\":\\s*\"[^\"]+\"/\"version\": \"$VERSION\"/" manifest.json
perl -0pi -e "s/\"strict_min_version\":\\s*\"[^\"]+\"/\"strict_min_version\": \"$MIN_VERSION\"/" manifest.json
perl -0pi -e "s/\"strict_max_version\":\\s*\"[^\"]+\"/\"strict_max_version\": \"$MAX_VERSION\"/" manifest.json

rm -f scansci.xpi
zip -r scansci.xpi manifest.json bootstrap.js prefs.js chrome/content/preferences.xhtml locale README.md VERSION CHANGELOG.md COMPATIBILITY.md

XPI_HASH="$(shasum -a 256 scansci.xpi | awk '{print $1}')"

printf '%s\n' \
  '{' \
  '  "addons": {' \
  "    \"$ADDON_ID\": {" \
  '      "updates": [' \
  '        {' \
  "          \"version\": \"$VERSION\"," \
  "          \"update_link\": \"$UPDATE_LINK\"," \
  "          \"update_hash\": \"sha256:$XPI_HASH\"," \
  '          "applications": {' \
  '            "zotero": {' \
  "              \"strict_min_version\": \"$MIN_VERSION\"," \
  "              \"strict_max_version\": \"$MAX_VERSION\"" \
  '            }' \
  '          }' \
  '        }' \
  '      ]' \
  '    }' \
  '  }' \
  '}' > update.json

echo "Built scansci.xpi version $VERSION"
echo "SHA-256: $XPI_HASH"
