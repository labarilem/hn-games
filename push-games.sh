#!/bin/bash

# Read fromDay from checkpoint.json
fromDay=$(jq -r '.fromDay' scripts/data/checkpoint.json)

# Create commit and push
git add .
git commit -m "add $fromDay games"
git push
