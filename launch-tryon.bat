@echo off
cd /d C:\Users\HP\Desktop\stich
start "Kinetic Muse Server" cmd /k ""C:\Program Files\nodejs\node.exe" "C:\Users\HP\Desktop\stich\serve-local.cjs""
timeout /t 2 /nobreak >nul
start "" http://127.0.0.1:8000/try-on.html
