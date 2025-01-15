#!/bin/bash

while inotifywait -r -e modify,create,delete src; do
  echo "Changes detected, stopping gleam run..."
  pid=$(ps -ef | grep "gleam" | awk '{print $1}')
  if [ -n "$pid" ]; then
    kill $pid
  fi
  echo "Waiting for port 8000 to be available..."
  while lsof -i :8000 | grep -q "LISTEN"; do
    sleep 1
  done
  echo "Rebuilding and running..."
  gleam run &
done