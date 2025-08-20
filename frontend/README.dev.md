Development notes

Windows users: if you see an esbuild platform binary error, run the following in PowerShell from the `frontend` folder:

Remove-Item -Recurse -Force .\node_modules
if (Test-Path .\package-lock.json) { npm ci } else { npm install }
npm rebuild esbuild --update-binary
npm run dev

This ensures esbuild installs the correct native binary for Windows.
