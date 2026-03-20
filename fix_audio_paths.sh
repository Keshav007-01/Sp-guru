#!/bin/bash

# Replace all audio paths in storage.ts
sed -i 's|"/public/audio/|"/audio/|g' server/storage.ts

echo "Fixed audio paths in storage.ts"