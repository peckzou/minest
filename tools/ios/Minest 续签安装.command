#!/bin/bash
# Double-click in Finder: renew Minest's iOS signing and install it on the connected iPhone / iPad.
"$(dirname "$0")/renew-install.sh" "$@"
echo
read -n 1 -s -r -p "按任意键关闭窗口…"
