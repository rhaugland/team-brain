#!/bin/bash
set -e

COMPANION_DIR="$(cd "$(dirname "$0")" && pwd)"
PLIST_NAME="com.team-brain.companion"
PLIST_PATH="$HOME/Library/LaunchAgents/$PLIST_NAME.plist"

echo "Installing Team Brain companion..."

# Install dependencies
cd "$COMPANION_DIR"
npm install --production

# Create launchd plist
cat > "$PLIST_PATH" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>$PLIST_NAME</string>
  <key>ProgramArguments</key>
  <array>
    <string>$(which node)</string>
    <string>$COMPANION_DIR/server.js</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>$HOME/.team-brain-companion.log</string>
  <key>StandardErrorPath</key>
  <string>$HOME/.team-brain-companion.log</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/usr/local/bin:/usr/bin:/bin:$(dirname $(which node))</string>
    <key>ANTHROPIC_API_KEY</key>
    <string>${ANTHROPIC_API_KEY:-SET_YOUR_KEY_HERE}</string>
  </dict>
</dict>
</plist>
EOF

# Load the service
launchctl unload "$PLIST_PATH" 2>/dev/null || true
launchctl load "$PLIST_PATH"

echo "Companion installed and running."
echo "Logs: ~/.team-brain-companion.log"
echo ""
echo "IMPORTANT: If you see SET_YOUR_KEY_HERE in the plist, edit it:"
echo "  nano $PLIST_PATH"
echo "  Then: launchctl unload $PLIST_PATH && launchctl load $PLIST_PATH"
