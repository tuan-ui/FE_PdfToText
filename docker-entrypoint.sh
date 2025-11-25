#!/bin/sh

echo "Injecting env variables..."
cat <<EOF > /usr/share/nginx/html/env/env.js
window.REACT_APP_API_URL="${REACT_APP_API_URL}";
window.REACT_APP_MODE="${REACT_APP_MODE}";
window.URL_SOCKET="${URL_SOCKET}";
window.DESKTOP_APP="${DESKTOP_APP}";
EOF

exec "$@"