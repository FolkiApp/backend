echo -e "Running build\n"
npm run build

echo -e "Store puppeteer executable in cache\n"
mkdir -p ./.cache
mv /app/.cache/puppeteer ./.cache || true