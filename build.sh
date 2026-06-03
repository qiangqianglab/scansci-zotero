#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

VERSION="$(tr -d '[:space:]' < VERSION)"
ADDON_ID="scansci-pdf@zhuzhiqiang.local"
UPDATE_LINK="https://github.com/qiangqianglab/scansci-zotero/releases/download/v${VERSION}/scansci.xpi"

perl -0pi -e "s/\"version\":\\s*\"[^\"]+\"/\"version\": \"$VERSION\"/" manifest.json

printf '%s\n' \
  '{' \
  '  "addons": {' \
  "    \"$ADDON_ID\": {" \
  '      "updates": [' \
  '        {' \
  "          \"version\": \"$VERSION\"," \
  "          \"update_link\": \"$UPDATE_LINK\"," \
  '          "applications": {' \
  '            "zotero": {' \
  '              "strict_min_version": "6.999",' \
  '              "strict_max_version": "9.*"' \
  '            }' \
  '          }' \
  '        }' \
  '      ]' \
  '    }' \
  '  }' \
  '}' > update.json

rm -f scansci.xpi
zip -r scansci.xpi manifest.json bootstrap.js prefs.js chrome/content/preferences.xhtml locale README.md VERSION CHANGELOG.md update.json

echo "Built scansci.xpi version $VERSION"
