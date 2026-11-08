// Sincronización del estado personal con Supabase Auth + una fila protegida por RLS.
const SYNC_CONFIG_KEY = 'monai-gastos-sync-config-v1';
const SYNC_TABLE = 'monai_user_data';
let syncClient = null, syncUserId = null, syncInterval = null, syncLastUpdated = '';
let syncReady = false, syncApplyingRemote = false, syncBusy = false, syncTimer = null;
let syncPendingUpload = false, syncLocalDirty = false, syncStartingId = null;

function readSyncConfig() {
  try { return JSON.parse(localStorage.getItem(SYNC_CONFIG_KEY)) || {}; } catch (e) { return {}; }
}

function setSyncStatus(message, connected = false) {
  const e = $('#syncStatus');
  if (e) { e.textContent = message; e.classList.toggle('connected', connected); }
  const logout = $('#syncLogout');
  if (logout) logout.hidden = !syncUserId;
}

function syncData() {
  // La clave y el modelo de Gemini son ajustes locales y nunca se suben.
  return { tx: S.tx, tr: S.tr, accounts: S.accounts, cats: S.cats };
}

function hasLocalPersonalData() {
  const d = syncData();
  return d.tx.length > 0 || d.tr.length > 0 ||
    d.accounts.some(a => a.start) || d.accounts.length !== 2 || d.cats.length !== 7;
}

function applySyncData(d) {
  if (!d || !Array.isArray(d.tx) || !Array.isArray(d.tr) || !Array.isArray(d.accounts) || !Array.isArray(d.cats)) {
    throw new Error('Los datos de sincronización no tienen el formato esperado.');
  }
  syncApplyingRemote = true;
  S.tx = d.tx; S.tr = d.tr; S.accounts = d.accounts; S.cats = d.cats;
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
  syncApplyingRemote = false;
  render();
}

function mergeById(remoteItems, localItems) {
  const merged = new Map((remoteItems || []).map(x => [String(x.id), x]));
  (localItems || []).forEach(x => merged.set(String(x.id), x));
  return [...merged.values()];
}

function mergeSyncData(remote, local) {
  return {
    tx: mergeById(remote.tx, local.tx), tr: mergeById(remote.tr, local.tr),
    accounts: mergeById(remote.accounts, local.accounts), cats: mergeById(remote.cats, local.cats)
  };
}

async function fetchCloudRow() {
  const { data, error } = await syncClient.from(SYNC_TABLE).select('state, updated_at').eq('user_id', syncUserId).maybeSingle();
  if (error) throw error;
  return data;
}

async function uploadCloudState(data = syncData()) {
  const updatedAt = new Date().toISOString();
  const { error } = await syncClient.from(SYNC_TABLE).upsert(
    { user_id: syncUserId, state: data, updated_at: updatedAt }, { onConflict: 'user_id' }
  );
  if (error) throw error;
  syncLastUpdated = updatedAt;
  syncReady = true;
  syncPendingUpload = false; syncLocalDirty = false;
  setSyncStatus('Sincronizado · ' + new Date(updatedAt).toLocaleTimeString(), true);
}

async function startCloudSync(user) {
  if (!user || syncUserId === user.id && syncReady) return;
  if (syncStartingId === user.id) return;
  syncStartingId = user.id;
  syncUserId = user.id; syncReady = false;
  setSyncStatus('Conectando y cargando tus datos…');
  try {
    const row = await fetchCloudRow();
    if (!row) {
      // El primer dispositivo conectado inicializa la copia compartida.
      await uploadCloudState();
      toast('Este dispositivo inició la copia compartida');
    } else {
      const remote = row.state;
      if (hasLocalPersonalData()) {
        const merge = confirm('Ya hay datos en Supabase y este dispositivo también tiene datos.\n\nAceptar: combinar ambas copias.\nCancelar: usar la copia de Supabase y reemplazar la copia local.');
        if (merge) {
          const combined = mergeSyncData(remote, syncData());
          applySyncData(combined);
          await uploadCloudState(combined);
        } else {
          applySyncData(remote);
          syncLastUpdated = row.updated_at;
          setSyncStatus('Sincronizado · ' + new Date(row.updated_at).toLocaleTimeString(), true);
        }
      } else {
        applySyncData(remote);
        syncLastUpdated = row.updated_at;
        setSyncStatus('Sincronizado · ' + new Date(row.updated_at).toLocaleTimeString(), true);
      }
      toast('Datos cargados desde la nube');
    }
    if (syncInterval) clearInterval(syncInterval);
    syncInterval = setInterval(checkCloudChanges, 8000);
  } catch (e) {
    syncReady = false;
    setSyncStatus('No se pudo sincronizar: ' + (e.message || 'revisa la configuración'));
    toast('Error al sincronizar con Supabase');
  } finally { syncStartingId = null; }
}

async function checkCloudChanges() {
  if (!syncUserId || !syncReady || syncBusy || syncLocalDirty || !navigator.onLine || document.hidden) return;
  try {
    const row = await fetchCloudRow();
    if (row && row.updated_at && row.updated_at > syncLastUpdated) {
      applySyncData(row.state);
      syncLastUpdated = row.updated_at;
      setSyncStatus('Actualizado desde otro dispositivo · ' + new Date(row.updated_at).toLocaleTimeString(), true);
    }
  } catch (e) {
    setSyncStatus('Sin conexión a la nube; los cambios quedan guardados en este dispositivo.');
  }
}

scheduleCloudSync = () => {
  if (!syncUserId || !syncReady || syncApplyingRemote) return;
  syncLocalDirty = true;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(async () => {
    if (!navigator.onLine) { syncPendingUpload = true; setSyncStatus('Sin conexión; los cambios esperan para sincronizarse.'); return; }
    if (syncBusy) { scheduleCloudSync(); return; }
    syncBusy = true;
    try { await uploadCloudState(); }
    catch (e) { setSyncStatus('No se pudo guardar en la nube: ' + (e.message || 'error')); }
    finally { syncBusy = false; }
  }, 700);
};

async function resumeCloudSync() {
  if (!syncUserId || !syncReady || !navigator.onLine) return;
  if (!syncPendingUpload) { checkCloudChanges(); return; }
  try {
    const row = await fetchCloudRow();
    if (row && row.updated_at > syncLastUpdated) {
      const keepLocal = confirm('Mientras este dispositivo estaba sin conexión, llegaron cambios desde otro dispositivo.\n\nAceptar: conservar este dispositivo y reemplazar la copia en la nube.\nCancelar: descargar la copia de la nube y reemplazar la copia local.');
      if (!keepLocal) {
        applySyncData(row.state); syncLastUpdated = row.updated_at;
        syncPendingUpload = false; syncLocalDirty = false;
        setSyncStatus('Actualizado desde la nube · ' + new Date(row.updated_at).toLocaleTimeString(), true);
        return;
      }
    }
    await uploadCloudState();
  } catch (e) { setSyncStatus('No se pudo reanudar la sincronización: ' + (e.message || 'error')); }
}

function configureSyncClient() {
  const url = $('#syncUrl').value.trim().replace(/\/$/, '');
  const key = $('#syncKey').value.trim();
  if (!url || !key) throw new Error('Escribe la URL y la clave publicable del proyecto Supabase.');
  if (!window.supabase || !window.supabase.createClient) throw new Error('No se cargó la librería de Supabase; revisa tu conexión a internet.');
  const old = readSyncConfig();
  const cfg = { url, key };
  localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(cfg));
  if (!syncClient || old.url !== url || old.key !== key) {
    syncClient = window.supabase.createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
    syncClient.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) setTimeout(() => startCloudSync(session.user), 0);
      if (event === 'SIGNED_OUT') {
        syncUserId = null; syncReady = false;
        if (syncInterval) clearInterval(syncInterval);
        setSyncStatus('Sesión cerrada. Los datos de este dispositivo siguen guardados localmente.');
      }
    });
  }
  return syncClient;
}

async function syncAuth(action) {
  try {
    const client = configureSyncClient();
    const email = $('#syncEmail').value.trim(), password = $('#syncPassword').value;
    if (!email || !password) throw new Error('Escribe tu correo y contraseña.');
    setSyncStatus(action === 'signup' ? 'Creando la cuenta…' : 'Iniciando sesión…');
    const result = action === 'signup'
      ? await client.auth.signUp({ email, password, options: { emailRedirectTo: location.href.split('#')[0] } })
      : await client.auth.signInWithPassword({ email, password });
    if (result.error) throw result.error;
    $('#syncPassword').value = '';
    if (result.data.session) await startCloudSync(result.data.user);
    else setSyncStatus('Cuenta creada. Revisa tu correo para confirmar y luego inicia sesión.');
  } catch (e) {
    setSyncStatus(e.message || 'No se pudo iniciar sesión.');
    toast('No se pudo conectar la sincronización');
  }
}

function initSync() {
  const cfg = readSyncConfig();
  if ($('#syncUrl')) $('#syncUrl').value = cfg.url || '';
  if ($('#syncKey')) $('#syncKey').value = cfg.key || '';
  $('#syncLogin').onclick = () => syncAuth('login');
  $('#syncSignup').onclick = () => syncAuth('signup');
  $('#syncLogout').onclick = async () => { if (syncClient) await syncClient.auth.signOut(); };
  window.addEventListener('online', resumeCloudSync);
  if (cfg.url && cfg.key && window.supabase?.createClient) {
    try {
      configureSyncClient();
      syncClient.auth.getSession().then(({ data, error }) => {
        if (error) setSyncStatus('No se pudo restaurar la sesión: ' + error.message);
        else if (data.session) startCloudSync(data.session.user);
        else setSyncStatus('Proyecto configurado · inicia sesión para sincronizar');
      });
    } catch (e) { setSyncStatus(e.message); }
  }
}
