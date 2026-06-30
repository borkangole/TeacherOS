const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path   = require('path');
const fs     = require('fs');
const crypto = require('crypto');

let mainWindow;
let DATA_FILE;
let ENROLLMENT_FILE;
let AUTH_FILE;
let isAuthenticated = false;

// ─── CRYPTO HELPERS ───────────────────────────────────────────
function randomSalt()     { return crypto.randomBytes(16).toString('hex'); }
function hashPw(pw, salt) { return crypto.createHash('sha256').update(pw + salt).digest('hex'); }

// Admin reset key — change this before giving to her
const RESET_KEY = 'DepEd@Cuartero2024';

// ─── FILE HELPERS ──────────────────────────────────────────────
function loadJSON(filePath) {
  try {
    if (fs.existsSync(filePath))
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch(e) { console.error('Load error:', e); }
  return null;
}

function saveJSON(filePath, data) {
  const tmp = filePath + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmp, filePath);
}

// ─── INIT DATA FILES ───────────────────────────────────────────
// On first install on a new PC, copy bundled data files from
// the installer's resources into the user's AppData folder.
// If data already exists in AppData, it is NEVER overwritten.

function initDataFiles(userData) {
  // Where bundled data lives inside the installer
  const resourcesPath = app.isPackaged
    ? process.resourcesPath
    : path.join(__dirname); // dev: look in project root

  const bundledDir = path.join(resourcesPath, 'data');

  const files = [
    { src: 'teacher_records.json',    dest: path.join(userData, 'teacher_records.json'),    fallback: { records: [], nextId: 1 } },
    { src: 'enrollment_records.json', dest: path.join(userData, 'enrollment_records.json'), fallback: { records: [], nextId: 1 } },
  ];

  files.forEach(({ src, dest, fallback }) => {
    if (fs.existsSync(dest)) {
      console.log(`✓ Found existing: ${path.basename(dest)}`);
      return; // never overwrite existing data
    }

    const bundled = path.join(bundledDir, src);
    if (fs.existsSync(bundled)) {
      fs.copyFileSync(bundled, dest);
      console.log(`✓ Copied bundled data: ${src}`);
    } else {
      // No bundled file — create empty
      saveJSON(dest, fallback);
      console.log(`✓ Created empty: ${src}`);
    }
  });
}

// ─── WINDOW ────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280, height: 800,
    minWidth: 960, minHeight: 620,
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: 'TeacherOS',
    show: false,
    autoHideMenuBar: true,
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'login.html'));
  mainWindow.once('ready-to-show', () => mainWindow.show());
}

// ─── APP LIFECYCLE ─────────────────────────────────────────────
app.whenReady().then(() => {
  const userData  = app.getPath('userData');
  DATA_FILE       = path.join(userData, 'teacher_records.json');
  ENROLLMENT_FILE = path.join(userData, 'enrollment_records.json');
  AUTH_FILE       = path.join(userData, 'auth.json');

  // Copy bundled data on first run (safe — won't overwrite)
  initDataFiles(userData);

  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ─── AUTH IPC ──────────────────────────────────────────────────
ipcMain.handle('auth-status', () => {
  const auth = loadJSON(AUTH_FILE);
  return { needsSetup: !auth || !auth.hash };
});

ipcMain.handle('auth-setup', (_, password) => {
  try {
    const salt = randomSalt();
    const hash = hashPw(password, salt);
    saveJSON(AUTH_FILE, { salt, hash });
    isAuthenticated = true;
    return { success: true };
  } catch(e) { return { success: false, error: e.message }; }
});

ipcMain.handle('auth-login', (_, password) => {
  try {
    const auth = loadJSON(AUTH_FILE);
    if (!auth || !auth.hash) return { success: false, error: 'No password set. Please restart.' };
    if (hashPw(password, auth.salt) === auth.hash) {
      isAuthenticated = true;
      return { success: true };
    }
    return { success: false, error: 'Incorrect password. Please try again.' };
  } catch(e) { return { success: false, error: e.message }; }
});

ipcMain.handle('auth-navigate', (_, page) => {
  if (!isAuthenticated && page !== 'login.html') {
    mainWindow.loadFile(path.join(__dirname, 'renderer', 'login.html'));
    return;
  }
  mainWindow.loadFile(path.join(__dirname, 'renderer', page));
});

ipcMain.handle('auth-logout', () => {
  isAuthenticated = false;
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'login.html'));
  return { success: true };
});

ipcMain.handle('auth-change-password', (_, oldPassword, newPassword) => {
  try {
    const auth = loadJSON(AUTH_FILE);
    if (!auth) return { success: false, error: 'Auth file not found.' };
    if (hashPw(oldPassword, auth.salt) !== auth.hash)
      return { success: false, error: 'Incorrect current password.' };
    const salt = randomSalt();
    saveJSON(AUTH_FILE, { salt, hash: hashPw(newPassword, salt) });
    return { success: true };
  } catch(e) { return { success: false, error: e.message }; }
});

ipcMain.handle('auth-reset', (_, key, newPassword) => {
  try {
    if (key !== RESET_KEY) return { success: false, error: 'Invalid reset key.' };
    const salt = randomSalt();
    saveJSON(AUTH_FILE, { salt, hash: hashPw(newPassword, salt) });
    return { success: true };
  } catch(e) { return { success: false, error: e.message }; }
});

// ─── TEACHER RECORDS IPC ───────────────────────────────────────
const TEACHER_FIELDS = [
  'nameOfTeacher','nameOfSchool','birthday','employeeNo','itemNo','bpNo',
  'gsisNo','umidNo','philHealthNo','tinNo','appointmentOriginal','appointmentLatest',
  'presentPosition','pagibigMidNo','accountNo','remarks'
];

ipcMain.handle('db-get-all', () => {
  if (!isAuthenticated) return [];
  return (loadJSON(DATA_FILE) || { records:[] }).records
    .sort((a,b) => (a.nameOfTeacher||'').localeCompare(b.nameOfTeacher||''));
});

ipcMain.handle('db-add', (_, record) => {
  if (!isAuthenticated) return { error: 'Not authenticated' };
  const data = loadJSON(DATA_FILE) || { records:[], nextId:1 };
  const id = data.nextId++;
  const now = new Date().toISOString();
  data.records.push({ id, ...record, createdAt: now, updatedAt: now });
  saveJSON(DATA_FILE, data);
  return { id };
});

ipcMain.handle('db-update', (_, id, record) => {
  if (!isAuthenticated) return { error: 'Not authenticated' };
  const data = loadJSON(DATA_FILE) || { records:[], nextId:1 };
  const idx = data.records.findIndex(r => r.id === id);
  if (idx !== -1)
    data.records[idx] = { ...data.records[idx], ...record, id, updatedAt: new Date().toISOString() };
  saveJSON(DATA_FILE, data);
  return { success: true };
});

ipcMain.handle('db-delete', (_, id) => {
  if (!isAuthenticated) return { error: 'Not authenticated' };
  const data = loadJSON(DATA_FILE) || { records:[], nextId:1 };
  data.records = data.records.filter(r => r.id !== id);
  saveJSON(DATA_FILE, data);
  return { success: true };
});

ipcMain.handle('db-export-csv', async () => {
  if (!isAuthenticated) return { error: 'Not authenticated' };
  const data = loadJSON(DATA_FILE) || { records:[] };
  const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
    title: 'Export Teacher Records to CSV',
    defaultPath: 'teacher_records_' + new Date().toISOString().slice(0,10) + '.csv',
    filters: [{ name: 'CSV Files', extensions: ['csv'] }]
  });
  if (canceled || !filePath) return { cancelled: true };
  const HEADERS = [
    'Name of Teacher','Name of School','Birthday','Employee No.','Item No.','BP No.',
    'GSIS No.','UMID No.','PhilHealth No.','TIN No.','Appointment (Original)',
    'Appointment (Latest)','Present Position','PAGIBIG MID No.','Account Number','Remarks'
  ];
  const csv = '\uFEFF' + [
    HEADERS.map(h=>'"'+h+'"').join(','),
    ...data.records.map(r => TEACHER_FIELDS.map(f=>'"'+(r[f]||'').replace(/"/g,'""')+'"').join(','))
  ].join('\r\n');
  fs.writeFileSync(filePath, csv, 'utf8');
  shell.showItemInFolder(filePath);
  return { success: true };
});

ipcMain.handle('db-get-path',    () => DATA_FILE);
ipcMain.handle('db-open-folder', () => shell.openPath(app.getPath('userData')));

// ─── FILE IMPORT IPC ───────────────────────────────────────────
ipcMain.handle('import-open-file', async () => {
  if (!isAuthenticated) return { error: 'Not authenticated' };
  const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow, {
    title: 'Import Teacher Records',
    filters: [{ name: 'Excel & CSV Files', extensions: ['xlsx','xls','csv'] }],
    properties: ['openFile'],
  });
  if (canceled || !filePaths.length) return { cancelled: true };
  const filePath = filePaths[0];
  const fileName = path.basename(filePath);
  const ext = path.extname(filePath).toLowerCase();
  try {
    if (ext === '.csv') {
      const text = fs.readFileSync(filePath, 'utf8');
      return { type:'csv', text, fileName };
    } else {
      const XLSX = require('xlsx');
      const workbook = XLSX.readFile(filePath, { cellDates:true, raw:false });
      const sheetNames = workbook.SheetNames;
      if (sheetNames.length === 1) {
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNames[0]], { header:1, defval:'' })
          .map(r => r.map(c => String(c===null||c===undefined?'':c)));
        return { type:'excel', rows, fileName, sheetName:sheetNames[0], sheetNames };
      }
      return { type:'excel-pick-sheet', fileName, sheetNames, filePath };
    }
  } catch(err) { return { error: err.message, fileName }; }
});

ipcMain.handle('import-get-sheet', async (_, filePath, sheetName) => {
  try {
    const XLSX = require('xlsx');
    const workbook = XLSX.readFile(filePath, { cellDates:true, raw:false });
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header:1, defval:'' })
      .map(r => r.map(c => String(c===null||c===undefined?'':c)));
    return { rows, sheetName };
  } catch(err) { return { error: err.message }; }
});

// ─── ENROLLMENT IPC ────────────────────────────────────────────
const GRADE_KEYS = ['kinder','grade1','grade2','grade3','grade4','grade5','grade6','sped'];

ipcMain.handle('enrollment-get-all', () => {
  if (!isAuthenticated) return [];
  return (loadJSON(ENROLLMENT_FILE) || { records:[] }).records
    .sort((a,b) => {
      const sy = (b.schoolYear||'').localeCompare(a.schoolYear||'');
      return sy !== 0 ? sy : (a.schoolName||'').localeCompare(b.schoolName||'');
    });
});

ipcMain.handle('enrollment-add', (_, record) => {
  if (!isAuthenticated) return { error: 'Not authenticated' };
  const data = loadJSON(ENROLLMENT_FILE) || { records:[], nextId:1 };
  const id = data.nextId++;
  const now = new Date().toISOString();
  data.records.push({ id, ...record, createdAt: now, updatedAt: now });
  saveJSON(ENROLLMENT_FILE, data);
  return { id };
});

ipcMain.handle('enrollment-update', (_, id, record) => {
  if (!isAuthenticated) return { error: 'Not authenticated' };
  const data = loadJSON(ENROLLMENT_FILE) || { records:[], nextId:1 };
  const idx = data.records.findIndex(r => r.id === id);
  if (idx !== -1)
    data.records[idx] = { ...data.records[idx], ...record, id, updatedAt: new Date().toISOString() };
  saveJSON(ENROLLMENT_FILE, data);
  return { success: true };
});

ipcMain.handle('enrollment-delete', (_, id) => {
  if (!isAuthenticated) return { error: 'Not authenticated' };
  const data = loadJSON(ENROLLMENT_FILE) || { records:[], nextId:1 };
  data.records = data.records.filter(r => r.id !== id);
  saveJSON(ENROLLMENT_FILE, data);
  return { success: true };
});

ipcMain.handle('enrollment-export-csv', async () => {
  if (!isAuthenticated) return { error: 'Not authenticated' };
  const data = loadJSON(ENROLLMENT_FILE) || { records:[] };
  const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
    title: 'Export Enrollment Records to CSV',
    defaultPath: 'enrollment_records_' + new Date().toISOString().slice(0,10) + '.csv',
    filters: [{ name: 'CSV Files', extensions: ['csv'] }]
  });
  if (canceled || !filePath) return { cancelled: true };
  const gradeLabels = ['Kinder','Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','SPED'];
  const HEADERS = ['School Name','School Year',
    ...gradeLabels.flatMap(l=>[l+' Male',l+' Female',l+' Total']),
    'Total Male','Total Female','Grand Total'];
  const rows = data.records.map(r => {
    let totalM=0, totalF=0;
    const cells = GRADE_KEYS.flatMap(g => {
      const m=r[g+'_male']||0, f=r[g+'_female']||0;
      totalM+=m; totalF+=f; return [m,f,m+f];
    });
    return [r.schoolName||'',r.schoolYear||'',...cells,totalM,totalF,totalM+totalF]
      .map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',');
  });
  const csv = '\uFEFF'+[HEADERS.map(h=>'"'+h+'"').join(','),...rows].join('\r\n');
  fs.writeFileSync(filePath, csv, 'utf8');
  shell.showItemInFolder(filePath);
  return { success: true };
});