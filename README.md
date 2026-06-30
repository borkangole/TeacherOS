=====================================================
  TEACHER RECORDS SYSTEM — SETUP GUIDE
  DepEd Personnel Database (Windows)
=====================================================

WHAT YOU NEED FIRST
---------------------
1. Node.js (LTS version) — download from:
   https://nodejs.org/en/download

   Choose "Windows Installer (.msi)" — LTS version.
   Install with default settings. Just click Next > Next > Install.

2. That's it. You don't need anything else.


SETUP STEPS (do this only ONCE)
---------------------------------
1. Extract this folder anywhere on your PC
   (e.g., Desktop or C:\Projects\teacher-records-app)

2. Open a Command Prompt in that folder:
   - Hold Shift + Right-click inside the folder
   - Click "Open PowerShell window here"
     OR "Open Command window here"

3. Type these commands one by one and press Enter after each:

   npm install

   (This downloads all required packages — may take 1-3 minutes)

   npm run rebuild

   (This compiles the database driver for your PC — takes about 1 minute)


RUN THE APP (for testing during development)
----------------------------------------------
   npm start

   The app window will open. You can use it right away!


BUILD THE WINDOWS INSTALLER (to install on her PC)
----------------------------------------------------
   npm run build

   This creates the installer inside the "dist" folder:
     dist\Teacher Records System Setup 1.0.0.exe

   Copy that .exe to her PC and double-click to install.
   After installation, she'll have a shortcut on her Desktop.


WHERE IS HER DATA SAVED?
--------------------------
The database file is stored at:
  C:\Users\[username]\AppData\Roaming\teacher-records-system\teacher_records.db

It is a REAL file on her PC. It will NOT be deleted by:
- Clearing browser history
- Updating the app
- Restarting the PC

To back it up, just copy that .db file somewhere safe (USB, Google Drive, etc.)


TROUBLESHOOTING
----------------
If "npm run rebuild" fails:
  - You may need Visual Studio Build Tools. Download from:
    https://visualstudio.microsoft.com/visual-cpp-build-tools/
  - Install "Desktop development with C++" workload
  - Then run: npm run rebuild again

If the app opens but shows a blank screen:
  - Try: npm start -- --inspect
  - Then open Chrome and go to: chrome://inspect

If you need help, share the error message and we can fix it.


FOLDER STRUCTURE EXPLAINED
----------------------------
teacher-records-app/
├── main.js          ← Electron main process (opens window, handles database)
├── preload.js       ← Security bridge between app and database
├── package.json     ← Project config and dependencies
├── renderer/
│   └── index.html   ← The actual UI your mom sees and uses
└── dist/            ← Created after "npm run build" — contains the installer
