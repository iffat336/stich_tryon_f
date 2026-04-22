@echo off
cd /d C:\Users\HP\Desktop\stich
start "Kinetic Muse Server" cmd /k ""C:\Users\HP\Desktop\stich\run-local-site.bat""
timeout /t 3 /nobreak >nul
start "" http://127.0.0.1:8000/try-on.html
