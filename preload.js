const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // ── Auth ─────────────────────────────────────────────────────
  authStatus:         ()              => ipcRenderer.invoke('auth-status'),
  authSetup:          (pw)            => ipcRenderer.invoke('auth-setup', pw),
  authLogin:          (pw)            => ipcRenderer.invoke('auth-login', pw),
  authNavigate:       (page)          => ipcRenderer.invoke('auth-navigate', page),
  authLogout:         ()              => ipcRenderer.invoke('auth-logout'),
  authChangePassword: (old, nw)       => ipcRenderer.invoke('auth-change-password', old, nw),
  authReset:          (key, pw)       => ipcRenderer.invoke('auth-reset', key, pw),

  // ── Teacher Records ──────────────────────────────────────────
  getAll:             ()              => ipcRenderer.invoke('db-get-all'),
  add:                (data)          => ipcRenderer.invoke('db-add', data),
  update:             (id, data)      => ipcRenderer.invoke('db-update', id, data),
  delete:             (id)            => ipcRenderer.invoke('db-delete', id),
  exportCSV:          ()              => ipcRenderer.invoke('db-export-csv'),
  getDbPath:          ()              => ipcRenderer.invoke('db-get-path'),
  openDbFolder:       ()              => ipcRenderer.invoke('db-open-folder'),

  // ── File Import ──────────────────────────────────────────────
  importOpenFile:     ()              => ipcRenderer.invoke('import-open-file'),
  importGetSheet:     (fp, sn)        => ipcRenderer.invoke('import-get-sheet', fp, sn),

  // ── Enrollment ───────────────────────────────────────────────
  enrollmentGetAll:    ()             => ipcRenderer.invoke('enrollment-get-all'),
  enrollmentAdd:       (data)         => ipcRenderer.invoke('enrollment-add', data),
  enrollmentUpdate:    (id, data)     => ipcRenderer.invoke('enrollment-update', id, data),
  enrollmentDelete:    (id)           => ipcRenderer.invoke('enrollment-delete', id),
  enrollmentExportCSV: ()             => ipcRenderer.invoke('enrollment-export-csv'),
});