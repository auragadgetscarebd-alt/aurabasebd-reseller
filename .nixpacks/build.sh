#!/bin/bash
set -e
export BASE_PATH="/__mockup"
pnpm --filter @workspace/mockup-sandbox run build
pnpm --filter @workspace/api-server run build
