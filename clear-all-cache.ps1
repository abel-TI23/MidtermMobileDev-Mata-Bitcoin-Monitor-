# Script untuk membersihkan semua cache React Native
Write-Host "🧹 Membersihkan semua cache..." -ForegroundColor Cyan

# 1. Stop Metro bundler jika running
Write-Host "`n1️⃣ Stopping Metro bundler..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# 2. Hapus node_modules
Write-Host "`n2️⃣ Removing node_modules..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules"
}

# 3. Hapus package-lock.json
Write-Host "`n3️⃣ Removing package-lock.json..." -ForegroundColor Yellow
if (Test-Path "package-lock.json") {
    Remove-Item -Force "package-lock.json"
}

# 4. Hapus Android build cache
Write-Host "`n4️⃣ Removing Android build cache..." -ForegroundColor Yellow
if (Test-Path "android\app\build") {
    Remove-Item -Recurse -Force "android\app\build"
}
if (Test-Path "android\build") {
    Remove-Item -Recurse -Force "android\build"
}
if (Test-Path "android\.gradle") {
    Remove-Item -Recurse -Force "android\.gradle"
}

# 5. Hapus Metro cache
Write-Host "`n5️⃣ Removing Metro cache..." -ForegroundColor Yellow
if (Test-Path "$env:TEMP\metro-*") {
    Remove-Item -Recurse -Force "$env:TEMP\metro-*"
}
if (Test-Path "$env:TEMP\react-*") {
    Remove-Item -Recurse -Force "$env:TEMP\react-*"
}

# 6. Hapus Watchman cache (jika ada)
Write-Host "`n6️⃣ Clearing Watchman cache..." -ForegroundColor Yellow
watchman watch-del-all 2>$null

# 7. Install dependencies lagi
Write-Host "`n7️⃣ Installing dependencies..." -ForegroundColor Yellow
npm install

Write-Host "`n✅ Cache cleared successfully!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Run: npx react-native start --reset-cache" -ForegroundColor White
Write-Host "2. In new terminal, run: npx react-native run-android" -ForegroundColor White
