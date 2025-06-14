#!/bin/bash

echo "🔄 Replacing 'Task Manager' with 'Task Manager' throughout the project..."

# Find and replace in all text files, excluding binary files and directories
find . -type f \
    -not -path "./node_modules/*" \
    -not -path "./dist/*" \
    -not -path "./.git/*" \
    -not -path "./coverage/*" \
    -not -name "*.png" \
    -not -name "*.jpg" \
    -not -name "*.jpeg" \
    -not -name "*.gif" \
    -not -name "*.ico" \
    -not -name "*.svg" \
    -not -name "*.woff" \
    -not -name "*.woff2" \
    -not -name "*.ttf" \
    -not -name "*.eot" \
    -not -name "*.map" \
    -not -name "*.lock" \
    -not -name "*.log" \
    -exec grep -l "Task Manager" {} \; | while read -r file; do
    echo "Updating: $file"
    # Use sed to replace, creating a backup with .bak extension
    sed -i.bak 's/Task Manager/Task Manager/g' "$file"
    # Remove the backup file
    rm "${file}.bak"
done

# Also check for lowercase variations
find . -type f \
    -not -path "./node_modules/*" \
    -not -path "./dist/*" \
    -not -path "./.git/*" \
    -not -path "./coverage/*" \
    -not -name "*.png" \
    -not -name "*.jpg" \
    -not -name "*.jpeg" \
    -not -name "*.gif" \
    -not -name "*.ico" \
    -not -name "*.svg" \
    -not -name "*.woff" \
    -not -name "*.woff2" \
    -not -name "*.ttf" \
    -not -name "*.eot" \
    -not -name "*.map" \
    -not -name "*.lock" \
    -not -name "*.log" \
    -exec grep -l "task manager" {} \; | while read -r file; do
    echo "Updating lowercase in: $file"
    sed -i.bak 's/task manager/task manager/g' "$file"
    rm "${file}.bak"
done

# Check for any remaining occurrences
echo ""
echo "✅ Replacement complete!"
echo ""
echo "Checking for any remaining occurrences..."
remaining=$(grep -r "Task Manager\|task manager" . --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git 2>/dev/null | wc -l)

if [ "$remaining" -eq 0 ]; then
    echo "✅ No remaining occurrences of 'Task Manager' found!"
else
    echo "⚠️  Found $remaining remaining occurrences:"
    grep -r "Task Manager\|task manager" . --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git | head -10
fi