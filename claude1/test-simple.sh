#!/bin/bash

echo "Getting all characters..."
curl http://localhost:3000/api/characters | jq .