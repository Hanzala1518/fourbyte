@echo off
echo.
echo ================================
echo 🔧 FOURBYTE - Fix CI Issues
echo ================================
echo.

echo 📦 Step 1: Generating package-lock.json files...
echo.

cd server
echo Installing server dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install server dependencies
    pause
    exit /b 1
)
cd ..

cd client
echo Installing client dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install client dependencies
    pause
    exit /b 1
)
cd ..

echo.
echo ✅ package-lock.json files generated
echo.

echo 📋 Step 2: Checking git status...
git status

echo.
echo 📤 Step 3: Committing fixes...
git add .
git commit -m "Fix CI workflow and add package-lock.json files - Remove npm cache from CI (was causing path resolution errors) - Add package-lock.json files for reproducible builds - Update .gitignore to allow lock files"

echo.
echo 🚀 Step 4: Pushing to GitHub...
git push

echo.
echo ================================
echo ✅ Done!
echo ================================
echo.
echo Check your CI status at:
echo https://github.com/YOUR_USERNAME/fourbyte/actions
echo.
echo The CI workflow should now pass successfully!
echo.
pause
