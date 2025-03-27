#!/bin/bash

if [ -z "$1" ]; then
  echo "Usage: $0 <version>"
  exit 1
fi

VERSION=$1

TARBALL="gleam-v$VERSION-x86_64-unknown-linux-musl.tar.gz"
TARBALL_URL="https://github.com/gleam-lang/gleam/releases/download/v$VERSION/$TARBALL"

curl -L -o $TARBALL $TARBALL_URL

tar -xf $TARBALL

rm -rf gleam-*
echo "Done."
