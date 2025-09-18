
#!/bin/bash

# Check for exactly one argument
if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <input_filename>"
  exit 1
fi

infile="$1"
# Remove extension for base name
base="${infile%.*}"
outfile="${base}.json"
logfile="${base}.log"

yarn ts packages/nvmedit/src/cli.ts nvm2json --in "$infile" --out "$outfile" --verbose > "$logfile"

