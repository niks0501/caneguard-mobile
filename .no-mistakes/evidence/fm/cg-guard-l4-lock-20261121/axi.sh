#!/bin/bash
# isolated chrome-devtools-axi session for this validation run
export CHROME_DEVTOOLS_AXI_SESSION=cg-l4-guard-lock
export CHROME_DEVTOOLS_AXI_USER_DATA_DIR=/tmp/cg-l4-chrome-profile
export CHROME_DEVTOOLS_AXI_HEADED=1
exec npx -y chrome-devtools-axi "$@"
