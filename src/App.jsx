import React, { useState, useEffect, useRef } from 'react';
import {
  Download, AlertTriangle, CheckCircle, TrendingUp, Calculator,
  Calendar, Sparkles, Bot, Loader, Briefcase, ShoppingBag,
  Users, CreditCard, BarChart3, Save, UserPlus, Trash2,
  Home, Eye, LayoutTemplate, LogOut, Lock, Mail, Cloud,
  Zap, Layout, KeyRound, MessageCircle, BellRing, Target,
  History, Gauge, SlidersHorizontal
} from 'lucide-react';
import html2canvas from 'html2canvas';

// --- FIREBASE ---
import { initializeApp, deleteApp } from 'firebase/app';
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut,
  createUserWithEmailAndPassword, sendPasswordResetEmail
} from 'firebase/auth';
import {
  getFirestore, collection, doc, setDoc, updateDoc, deleteDoc,
  getDoc, onSnapshot, query
} from 'firebase/firestore';

// ------------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyAJsg-2TA0oIlQnuBeTkyj8mKd0rfuKaW0",
  authDomain: "nc-monotributo.firebaseapp.com",
  projectId: "nc-monotributo",
  storageBucket: "nc-monotributo.firebasestorage.app",
  messagingSenderId: "718453380900",
  appId: "1:718453380900:web:752c999751ecda6773c5b1"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const DB_COLLECTION = "clientes_monotributo";

// --- LOGO ---
const BrandLogo = ({ className, size = "normal" }) => {
  const [imgError, setImgError] = useState(false);
  if (imgError) {
    return (
      <div className={`flex items-center justify-center bg-[#0f172a] text-[#C5A059] font-serif font-black tracking-tighter border-[#C5A059] ${className}`} style={{ borderWidth: size === 'large' ? '4px' : '2px' }}>
        {size === 'large' ? <span className="text-3xl">NC</span> : <span className="text-sm">NC</span>}
      </div>
    );
  }
  return (
    <img src="/logo.png" alt="NC Servicios Integrales" className={`object-contain bg-white ${className}`} onError={() => setImgError(true)} />
  );
};

/* =========================================================
   TABLA OFICIAL — ARCA vigente desde 1/08/2026
   + Ingresos Brutos Mendoza (ATM, Régimen Simplificado) vigente desde 1/02/2026
   Los límites de ingresos/superficie/energía/alquiler son comunes a
   servicios y venta de cosas muebles; el impuesto integrado difiere
   desde la categoría C. Editable a futuro: mover a Firestore si se
   quiere actualizar sin republicar el sitio.
   ========================================================= */
let CATEGORIAS = [
  { letra: 'A', ingresos: 12009410.45, superficie: 30, energia: 3330, alquiler: 2792886.15, impuestoServicios: 5585.77, impuestoBienes: 5585.77, sipa: 18246.86, obraSocial: 25694.55, iibbMendoza: 12176 },
  { letra: 'B', ingresos: 17595182.74, superficie: 45, energia: 5000, alquiler: 2792886.15, impuestoServicios: 10612.98, impuestoBienes: 10612.98, sipa: 20071.55, obraSocial: 25694.55, iibbMendoza: 19112 },
  { letra: 'C', ingresos: 24670494.31, superficie: 60, energia: 6700, alquiler: 3816944.41, impuestoServicios: 18246.86, impuestoBienes: 16757.32, sipa: 22078.71, obraSocial: 25694.55, iibbMendoza: 28586 },
  { letra: 'D', ingresos: 30628651.43, superficie: 85, energia: 10000, alquiler: 3816944.41, impuestoServicios: 29790.79, impuestoBienes: 27742.67, sipa: 24286.58, obraSocial: 30535.56, iibbMendoza: 37707 },
  { letra: 'E', ingresos: 36028231.33, superficie: 110, energia: 13000, alquiler: 4841002.66, impuestoServicios: 55857.73, impuestoBienes: 44313.79, sipa: 26715.24, obraSocial: 37238.48, iibbMendoza: 52183 },
  { letra: 'F', ingresos: 45151659.41, superficie: 150, energia: 16500, alquiler: 4841002.66, impuestoServicios: 78573.20, impuestoBienes: 57719.64, sipa: 29386.76, obraSocial: 42824.25, iibbMendoza: 65397 },
  { letra: 'G', ingresos: 53995798.87, superficie: 200, energia: 20000, alquiler: 5771964.69, impuestoServicios: 142995.76, impuestoBienes: 71497.87, sipa: 41141.46, obraSocial: 46175.72, iibbMendoza: 78206 },
  { letra: 'H', ingresos: 81924660.37, superficie: 200, energia: 20000, alquiler: 8378658.45, impuestoServicios: 409623.31, impuestoBienes: 204811.64, sipa: 57598.04, obraSocial: 55485.33, iibbMendoza: 118656 },
  { letra: 'I', ingresos: 91699761.90, superficie: 200, energia: 20000, alquiler: 8378658.45, impuestoServicios: 814591.79, impuestoBienes: 325836.71, sipa: 80637.26, obraSocial: 68518.81, iibbMendoza: 139456 },
  { letra: 'J', ingresos: 105012519.20, superficie: 200, energia: 20000, alquiler: 8378658.45, impuestoServicios: 977510.14, impuestoBienes: 391004.07, sipa: 112892.16, obraSocial: 76897.46, iibbMendoza: 167307 },
  { letra: 'K', ingresos: 126610838.75, superficie: 200, energia: 20000, alquiler: 8378658.45, impuestoServicios: 1368514.20, impuestoBienes: 456171.40, sipa: 158049.02, obraSocial: 87882.82, iibbMendoza: 229223 },
];
// Nota: "I-K" es una franja de costo muy elevado, no una exclusión automática del
// régimen. La exclusión real ocurre solo si se supera el tope de la categoría K.
const zonaDe = (idx) => (idx <= 5 ? 'conveniente' : idx <= 7 ? 'alto-costo' : 'analisis');

function catIndexFor(value, field) {
  for (let i = 0; i < CATEGORIAS.length; i++) { if (value <= CATEGORIAS[i][field]) return i; }
  return CATEGORIAS.length;
}
function determinarCategoria(ingresosAnual, superficie, energia, alquiler) {
  const idxs = {
    ingresos: catIndexFor(ingresosAnual, 'ingresos'),
    superficie: catIndexFor(superficie, 'superficie'),
    energia: catIndexFor(energia, 'energia'),
    alquiler: catIndexFor(alquiler, 'alquiler'),
  };
  const maxIdx = Math.max(...Object.values(idxs));
  const excluida = maxIdx >= CATEGORIAS.length;
  const determinante = Object.keys(idxs).find((k) => idxs[k] === maxIdx);
  return { idx: Math.min(maxIdx, CATEGORIAS.length - 1), letra: excluida ? 'EXCLUIDO' : CATEGORIAS[maxIdx].letra, excluida, determinante };
}

/* =========================================================
   RECATEGORIZACIÓN — ventanas de enero y julio.
   Nota: la fecha límite exacta puede variar según lo que publique
   ARCA cada semestre; por eso queda como dato editable por el
   administrador (vencimientoRecategorizacion), no hardcodeada.
   ========================================================= */
function periodoActual() {
  const d = new Date();
  const m = d.getMonth() + 1, y = d.getFullYear();
  return m >= 7 ? `${y}-jul` : `${y}-ene`;
}
function inicioSemestreEvaluado(periodo) {
  const [yearStr, tipo] = periodo.split('-');
  const year = parseInt(yearStr, 10);
  return tipo === 'jul' ? new Date(year, 0, 1) : new Date(year - 1, 6, 1);
}
function corresponderRecategorizar(fechaAltaStr, periodo) {
  if (!fechaAltaStr) return true; // sin fecha de alta cargada, se asume que sí corresponde (más seguro)
  const alta = new Date(fechaAltaStr + 'T00:00:00');
  return alta <= inicioSemestreEvaluado(periodo);
}
function proximaVentanaRecategorizacion() {
  const d = new Date();
  const m = d.getMonth() + 1, y = d.getFullYear();
  return m < 7 ? { mes: 'julio', anio: y } : { mes: 'enero', anio: y + 1 };
}
function labelPeriodo(periodo) {
  const [year, tipo] = periodo.split('-');
  return `${tipo === 'jul' ? 'julio' : 'enero'} ${year}`;
}

/* =========================================================
   HISTORIAL DE FACTURACIÓN — por mes/año, sin límite de tiempo hacia atrás.
   Cada cliente guarda un objeto { "2025-08": 150000, "2026-01": 180000, ... }.
   Se puede cargar cualquier mes, pasado o futuro (la proyección a futuro
   es solo visible para el administrador).
   ========================================================= */
const MESES_ABR = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
function claveMes(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; }
function labelDeClave(clave) { const [y, m] = clave.split('-'); return `${MESES_ABR[parseInt(m, 10) - 1]} ${y}`; }
function ultimosNMeses(n, offsetMeses = 0) {
  const out = []; const hoy = new Date();
  for (let i = n - 1; i >= 0; i--) out.push(claveMes(new Date(hoy.getFullYear(), hoy.getMonth() - i + offsetMeses, 1)));
  return out;
}
function mesesDeAnio(anio) { return Array.from({ length: 12 }, (_, i) => `${anio}-${String(i + 1).padStart(2, '0')}`); }
function sumaClaves(mapa, claves) { return claves.reduce((acc, k) => acc + Number((mapa && mapa[k]) || 0), 0); }
// Migración de la versión anterior (12 casilleros fijos) a facturacionMensual, por si el cliente ya tenía datos cargados.
function migrarPeriodosAntiguos(periodosArr) {
  if (!Array.isArray(periodosArr)) return {};
  const claves = ultimosNMeses(12);
  const out = {};
  periodosArr.forEach((p, i) => { if (claves[i]) out[claves[i]] = Number(p.amount || 0); });
  return out;
}

const defaultClient = {
  nombre: "Nuevo Cliente",
  cuit: "",
  email: "",
  categoriaActual: "A",
  categoriaObjetivo: "B",
  tipoActividad: "servicios",
  componentes: { impositivo: true, jubilacion: true, obraSocial: true, ingresosBrutos: true },
  cantidadAdherentes: 0,
  montoRealAbonado: null,
  alquilerAnual: 0,
  superficieM2: 0,
  energiaKwh: 0,
  fechaAlta: '',
  proximoVencimiento: '',
  recategorizaciones: {},
  facturacionMensual: {},
  facturacionProyectada: {},
};

function generarPassword() {
  return "Mt" + new Date().getFullYear() + "-" + Math.random().toString(36).slice(2, 8);
}

const App = () => {
  const [authUser, setAuthUser] = useState(undefined); // undefined = resolviendo, null = sin sesión
  const [currentUser, setCurrentUser] = useState(null); // { role: 'admin'|'client', uid }
  const [authChecking, setAuthChecking] = useState(true);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);

  const [clientsDB, setClientsDB] = useState([]);
  const [isLoadingDB, setIsLoadingDB] = useState(true);
  const [configDoc, setConfigDoc] = useState({ costoAdherente: 15000 });

  const [selectedClientId, setSelectedClientId] = useState(null);
  const [isClientView, setIsClientView] = useState(false);
  const [showTablas, setShowTablas] = useState(false);
  const [tablasVersion, setTablasVersion] = useState(0);
  const [vigenciaArca, setVigenciaArca] = useState('01/08/2026');
  const [vigenciaAtm, setVigenciaAtm] = useState('01/02/2026');
  const [catsForm, setCatsForm] = useState(null);
  const [vigArcaForm, setVigArcaForm] = useState('');
  const [vigAtmForm, setVigAtmForm] = useState('');

  const [cliente, setCliente] = useState(defaultClient);
  const [facturacionMensual, setFacturacionMensual] = useState({});
  const [facturacionProyectada, setFacturacionProyectada] = useState({});
  const [anioVista, setAnioVista] = useState('ultimos12');
  const [montoMensualSimulado, setMontoMensualSimulado] = useState(0);
  const [generandoImagen, setGenerandoImagen] = useState(false);

  const [aiAdvice, setAiAdvice] = useState("");
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [showSaveAlert, setShowSaveAlert] = useState(false);
  const [showImageAlert, setShowImageAlert] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [credOut, setCredOut] = useState(null);

  const reportRef = useRef(null);
  const resumenRef = useRef(null);

  // --- 1. ESTADO DE AUTENTICACIÓN REAL ---
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      if (!user) { setCurrentUser(null); setAuthChecking(false); return; }
      try {
        const adminSnap = await getDoc(doc(db, 'admins', user.uid));
        if (adminSnap.exists()) {
          setCurrentUser({ role: 'admin', uid: user.uid });
        } else {
          const clientSnap = await getDoc(doc(db, DB_COLLECTION, user.uid));
          if (clientSnap.exists()) {
            setCurrentUser({ role: 'client', uid: user.uid });
            setSelectedClientId(user.uid);
            setIsClientView(true);
          } else {
            setLoginError("Tu usuario no está vinculado a ningún cliente. Contactá al estudio.");
            await signOut(auth);
          }
        }
      } catch (e) {
        setLoginError("No se pudo verificar la cuenta. Probá de nuevo.");
      }
      setAuthChecking(false);
    });
    return () => unsub();
  }, []);

  // --- 2. LISTA DE CLIENTES (solo tiene datos si las reglas lo permiten, es decir: admin) ---
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') { setIsLoadingDB(false); return; }
    const q = query(collection(db, DB_COLLECTION));
    const unsub = onSnapshot(q, (snap) => {
      setClientsDB(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setIsLoadingDB(false);
    }, () => setIsLoadingDB(false));
    return () => unsub();
  }, [currentUser]);

  // --- config general (costo por adherente) ---
  useEffect(() => {
    if (!currentUser) return;
    const unsub = onSnapshot(doc(db, 'config', 'parametros'), (snap) => {
      if (snap.exists()) setConfigDoc(snap.data());
    });
    return () => unsub();
  }, [currentUser]);

  // --- tabla oficial ARCA + ATM (editable por el admin, con valores por defecto si nunca se guardó) ---
  useEffect(() => {
    if (!currentUser) return;
    const unsub = onSnapshot(doc(db, 'config', 'categorias'), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        if (Array.isArray(d.cats) && d.cats.length === 11) CATEGORIAS = d.cats;
        if (d.vigenciaArca) setVigenciaArca(d.vigenciaArca);
        if (d.vigenciaAtm) setVigenciaAtm(d.vigenciaAtm);
        setTablasVersion((v) => v + 1);
      }
    });
    return () => unsub();
  }, [currentUser]);

  useEffect(() => {
    if (showTablas) {
      setCatsForm(JSON.parse(JSON.stringify(CATEGORIAS)));
      setVigArcaForm(vigenciaArca);
      setVigAtmForm(vigenciaAtm);
    }
  }, [showTablas, tablasVersion, vigenciaArca, vigenciaAtm]);

  const handleGuardarTablas = async () => {
    await setDoc(doc(db, 'config', 'categorias'), { cats: catsForm, vigenciaArca: vigArcaForm, vigenciaAtm: vigAtmForm });
    alert("Tabla actualizada — se aplica a todos los clientes.");
    setShowTablas(false);
  };

  // --- 3. SINCRONIZAR CLIENTE SELECCIONADO ---
  useEffect(() => {
    const loadClient = async () => {
      if (currentUser?.role === 'client') {
        const snap = await getDoc(doc(db, DB_COLLECTION, currentUser.uid));
        if (snap.exists()) {
          const data = snap.data();
          setCliente({ ...defaultClient, ...data });
          setFacturacionMensual(data.facturacionMensual || migrarPeriodosAntiguos(data.periodos));
          setFacturacionProyectada({});
        }
        return;
      }
      if (clientsDB.length > 0 && selectedClientId) {
        const data = clientsDB.find((c) => c.id === selectedClientId);
        if (data) {
          setCliente({ ...defaultClient, ...data });
          setFacturacionMensual(data.facturacionMensual || migrarPeriodosAntiguos(data.periodos));
          setFacturacionProyectada(data.facturacionProyectada || {});
          setAnioVista('ultimos12');
          setMontoMensualSimulado(0);
          setAiAdvice("");
        }
      } else if (clientsDB.length > 0 && !selectedClientId && currentUser?.role === 'admin') {
        setSelectedClientId(clientsDB[0].id);
      }
    };
    loadClient();
  }, [selectedClientId, clientsDB, currentUser]);

  // --- LOGIN / LOGOUT ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError(""); setLoginBusy(true);
    try {
      await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPass);
    } catch (err) {
      setLoginError("Usuario o contraseña incorrectos.");
    } finally {
      setLoginBusy(false);
    }
  };
  const handleLogout = async () => {
    await signOut(auth);
    setCliente(defaultClient); setSelectedClientId(null); setIsClientView(false);
  };

  // --- ALTA DE CLIENTE (crea usuario de Firebase Auth sin cerrar la sesión del admin) ---
  const handleCreateClient = async () => {
    const email = window.prompt("Email del nuevo cliente (será su usuario de acceso):");
    if (!email) return;
    setIsSaving(true);
    const tempPass = generarPassword();
    const secondaryApp = initializeApp(firebaseConfig, 'Secondary-' + Date.now());
    const secondaryAuth = getAuth(secondaryApp);
    try {
      const cred = await createUserWithEmailAndPassword(secondaryAuth, email.trim(), tempPass);
      const uid = cred.user.uid;
      await signOut(secondaryAuth);
      await deleteApp(secondaryApp);

      const newClientData = { ...defaultClient, nombre: "Nuevo Cliente", email: email.trim() };
      await setDoc(doc(db, DB_COLLECTION, uid), newClientData);

      setSelectedClientId(uid);
      setIsClientView(false);
      setCredOut({ email: email.trim(), pass: tempPass });
    } catch (e) {
      alert("No se pudo crear el cliente: " + (e.message || e));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCurrentClient = async () => {
    if (!selectedClientId) return;
    setIsSaving(true);
    try {
      const { id, ...rest } = cliente;
      await updateDoc(doc(db, DB_COLLECTION, selectedClientId), { ...rest, facturacionMensual, facturacionProyectada });
      setShowSaveAlert(true);
      setTimeout(() => setShowSaveAlert(false), 2000);
    } catch (e) {
      alert("Error al guardar.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!selectedClientId) return;
    if (!window.confirm("¿Eliminar este cliente y su acceso permanentemente? (el usuario de Firebase Auth debe borrarse aparte, desde la consola de Firebase)")) return;
    setIsSaving(true);
    try {
      await deleteDoc(doc(db, DB_COLLECTION, selectedClientId));
      const other = clientsDB.find((c) => c.id !== selectedClientId);
      setSelectedClientId(other ? other.id : null);
    } catch (e) {
      alert("Error al eliminar.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!cliente.email) { alert("Este cliente no tiene email cargado."); return; }
    try {
      await sendPasswordResetEmail(auth, cliente.email);
      alert("Se envió un email a " + cliente.email + " para que elija una nueva contraseña.");
    } catch (e) {
      alert("No se pudo enviar el email: " + (e.message || e));
    }
  };

  const handleSaveCostoAdherente = async (valor) => {
    await setDoc(doc(db, 'config', 'parametros'), { costoAdherente: Number(valor) || 0 }, { merge: true });
  };

  // --- CÁLCULOS ---
  const claves12Meses = ultimosNMeses(12);
  const claves6Meses = ultimosNMeses(6);
  const facturacionAcumulada = sumaClaves(facturacionMensual, claves12Meses);
  const ultimos6 = sumaClaves(facturacionMensual, claves6Meses);
  const anioActualNum = new Date().getFullYear();
  const añosConDatos = Array.from(new Set(Object.keys(facturacionMensual).map((k) => k.split('-')[0])));
  const añosDisponibles = Array.from(new Set([...añosConDatos, ...Array.from({ length: 6 }, (_, i) => String(anioActualNum - i))])).sort((a, b) => b - a);
  const clavesAMostrar = anioVista === 'ultimos12' ? claves12Meses : mesesDeAnio(anioVista);
  const idxActual = CATEGORIAS.findIndex((c) => c.letra === cliente.categoriaActual);
  const catActualData = CATEGORIAS[idxActual] || CATEGORIAS[0];
  const catObjetivoData = CATEGORIAS.find((c) => c.letra === cliente.categoriaObjetivo) || CATEGORIAS[1];
  const margenObjetivo = catObjetivoData.ingresos - facturacionAcumulada;
  const promedioMensualReal = facturacionAcumulada / 12;
  const promedioMensualLimiteObjetivo = catObjetivoData.ingresos / 12;
  const promedioMensualDisponible = margenObjetivo / 12;

  // Simulador: "¿qué pasa si factura $X por mes de ahora en más?"
  const anualSimulado = Number(montoMensualSimulado || 0) * 12;
  const resultadoSimulador = determinarCategoria(anualSimulado, cliente.superficieM2 || 0, cliente.energiaKwh || 0, cliente.alquilerAnual || 0);
  const topeMensualCategoriaActual = catActualData.ingresos / 12;
  const proximos6MesesMax = Math.max(0, (catActualData.ingresos - ultimos6) / 6);

  const desglosePago = () => {
    const comp = cliente.componentes || defaultClient.componentes;
    const items = [];
    if (comp.impositivo) items.push({ label: "Impuesto integrado (ARCA)", value: cliente.tipoActividad === 'servicios' ? catActualData.impuestoServicios : catActualData.impuestoBienes });
    if (comp.jubilacion) items.push({ label: "Aporte jubilatorio (SIPA)", value: catActualData.sipa });
    if (comp.obraSocial) {
      items.push({ label: "Obra social", value: catActualData.obraSocial });
      const adh = Number(cliente.cantidadAdherentes || 0);
      if (adh > 0) items.push({ label: `Obra social — ${adh} adherente(s)/hijos`, value: adh * Number(configDoc.costoAdherente || 0) });
    }
    if (comp.ingresosBrutos) items.push({ label: "Ingresos Brutos Mendoza (ATM)", value: catActualData.iibbMendoza });
    return { items, total: items.reduce((a, b) => a + b.value, 0) };
  };
  const desglose = desglosePago();
  const diffReal = cliente.montoRealAbonado != null ? cliente.montoRealAbonado - desglose.total : null;

  const pctAlquiler = catActualData.alquiler ? Math.min(150, ((cliente.alquilerAnual || 0) / catActualData.alquiler) * 100) : 0;
  const pctSuperficie = catActualData.superficie ? Math.min(150, ((cliente.superficieM2 || 0) / catActualData.superficie) * 100) : 0;
  const pctEnergia = catActualData.energia ? Math.min(150, ((cliente.energiaKwh || 0) / catActualData.energia) * 100) : 0;
  const barColor = (p) => (p < 70 ? 'bg-emerald-500' : p < 90 ? 'bg-amber-500' : 'bg-red-500');

  // --- ALERTAS ---
  const alertas = [];
  if (pctAlquiler >= 100) alertas.push({ nivel: 'alta', texto: 'El alquiler ya superó el tope de la categoría actual.' });
  else if (pctAlquiler >= 75) alertas.push({ nivel: 'media', texto: 'El alquiler está por encima del 75% del tope de la categoría.' });
  if (pctEnergia >= 100) alertas.push({ nivel: 'alta', texto: 'El consumo eléctrico ya superó el tope de la categoría actual.' });
  else if (pctEnergia >= 75) alertas.push({ nivel: 'media', texto: 'El consumo eléctrico está por encima del 75% del tope de la categoría.' });
  if (pctSuperficie >= 100) alertas.push({ nivel: 'alta', texto: 'La superficie afectada ya superó el tope de la categoría actual.' });
  else if (pctSuperficie >= 75) alertas.push({ nivel: 'media', texto: 'La superficie afectada está por encima del 75% del tope de la categoría.' });
  if (diffReal != null && Math.abs(diffReal) >= 500) {
    alertas.push({ nivel: 'alta', texto: `El monto real declarado difiere del calculado en $${Math.abs(diffReal).toLocaleString('es-AR')} — revisar la causa.` });
  }
  if (promedioMensualReal > topeMensualCategoriaActual) {
    alertas.push({ nivel: 'alta', texto: 'El promedio de facturación de los últimos 12 meses ya supera el equivalente mensual del tope de la categoría actual.' });
  }
  if (cliente.categoriaObjetivo && cliente.categoriaObjetivo !== cliente.categoriaActual) {
    alertas.push({ nivel: 'info', texto: `Hay una categoría proyectada distinta a la actual (${cliente.categoriaActual} → ${cliente.categoriaObjetivo}) — confirmar si sigue vigente.` });
  }
  // --- RECATEGORIZACIÓN ---
  const periodoRecat = periodoActual();
  const correspondeRecat = corresponderRecategorizar(cliente.fechaAlta, periodoRecat);
  const confirmadaRecat = !!(cliente.recategorizaciones && cliente.recategorizaciones[periodoRecat]);
  const proxVentana = proximaVentanaRecategorizacion();
  const excl = CATEGORIAS[CATEGORIAS.length - 1];
  const mesReporteRaw = new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }).replace(' de ', ' ');
  const mesReporte = mesReporteRaw.charAt(0).toUpperCase() + mesReporteRaw.slice(1);
  const margenExclusion = Math.max(0, excl.ingresos - facturacionAcumulada);

  const mesActual = new Date().getMonth() + 1;
  const enVentanaRecat = mesActual === 1 || mesActual === 7;
  if (correspondeRecat && !confirmadaRecat) {
    alertas.push({ nivel: 'alta', texto: `La recategorización de ${labelPeriodo(periodoRecat)} todavía no fue confirmada por el estudio.` });
  } else if (enVentanaRecat && correspondeRecat && confirmadaRecat) {
    alertas.push({ nivel: 'info', texto: `Recategorización de ${labelPeriodo(periodoRecat)}: confirmada por el estudio.` });
  }


  const handleDownloadImage = async () => {
    if (!resumenRef.current) return;
    setGenerandoImagen(true);
    try {
      const canvas = await html2canvas(resumenRef.current, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
      canvas.toBlob((blob) => {
        setGenerandoImagen(false);
        if (!blob) return;
        const fileName = `monotributo-${(cliente.nombre || 'cliente').replace(/\s+/g, '-')}.png`;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = fileName; a.click();
        URL.revokeObjectURL(url);
        setShowImageAlert(true);
        setTimeout(() => setShowImageAlert(false), 3500);
      }, 'image/png');
    } catch (e) {
      setGenerandoImagen(false);
      alert("No se pudo generar la imagen: " + (e.message || e));
    }
  };

  const handleConsultarIA = async () => {
    setIsLoadingAi(true); setAiAdvice("");
    const alertas = [];
    if (pctAlquiler > 85) alertas.push("alquiler cerca del tope de categoría");
    if (pctEnergia > 85) alertas.push("consumo eléctrico cerca del tope de categoría");
    if (pctSuperficie > 85) alertas.push("superficie afectada cerca del tope de categoría");
    if (!cliente.componentes?.jubilacion) alertas.push("no realiza aportes jubilatorios dentro del monotributo");
    try {
      const resp = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: cliente.nombre, tipoActividad: cliente.tipoActividad,
          categoriaActual: cliente.categoriaActual, categoriaObjetivo: cliente.categoriaObjetivo,
          cuotaTotal: desglose.total, alertas
        })
      });
      const data = await resp.json();
      setAiAdvice(data.text || "No se pudo generar una respuesta en este momento.");
    } catch (e) {
      setAiAdvice("No se pudo conectar con el servicio de IA. Verificá que ANTHROPIC_API_KEY esté configurada en Vercel.");
    } finally {
      setIsLoadingAi(false);
    }
  };

  // --- VISTA DE LOGIN ---
  if (authChecking) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white"><Loader className="animate-spin" /></div>;
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#C5A059] opacity-10 rounded-full blur-3xl -mr-20 -mt-20 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600 opacity-10 rounded-full blur-3xl -ml-20 -mb-20 animate-pulse delay-700"></div>

        <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 relative z-10 animate-fade-in-up">
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 bg-white rounded-full p-1 border-4 border-[#C5A059] shadow-lg mb-4 flex items-center justify-center overflow-hidden">
              <BrandLogo className="w-full h-full rounded-full" size="large" />
            </div>
            <h1 className="text-2xl font-black text-slate-800">Bienvenido</h1>
            <p className="text-sm text-slate-500">Sistema de Gestión Monotributo</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-slate-800 focus:ring-2 focus:ring-[#C5A059] outline-none" placeholder="tu@email.com" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input type="password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-slate-800 focus:ring-2 focus:ring-[#C5A059] outline-none" placeholder="••••••••" />
              </div>
            </div>
            {loginError && <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-lg flex items-center gap-2"><AlertTriangle size={14} /> {loginError}</div>}
            <button disabled={loginBusy} type="submit" className="w-full bg-[#0f172a] hover:bg-slate-800 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex justify-center items-center gap-2 disabled:opacity-70">
              {loginBusy ? <Loader className="animate-spin" size={20} /> : "Ingresar"}
            </button>
          </form>
          <div className="mt-8 text-center"><p className="text-[10px] text-slate-400 font-medium">NC Servicios Integrales • 2026</p></div>
        </div>
      </div>
    );
  }

  // --- VISTA PRINCIPAL ---
  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 pb-20">
      <div className="bg-[#0f172a] text-white p-3 shadow-lg sticky top-0 z-50 border-b border-[#C5A059]/30">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full p-0.5 border-2 border-[#C5A059] shadow-md overflow-hidden">
              <BrandLogo className="w-full h-full rounded-full" />
            </div>
            <div className="hidden md:block">
              <h1 className="text-lg font-bold tracking-tight leading-none"><span className="text-[#C5A059]">NC</span> Servicios</h1>
              <p className="text-[10px] text-slate-400 font-medium">Panel de {currentUser.role === 'admin' ? 'Administrador' : 'Cliente'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            {currentUser.role === 'admin' && (
              <>
                <div className="flex items-center bg-slate-900 rounded-lg p-1 border border-slate-700">
                  <button onClick={() => setIsClientView(false)} className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 ${!isClientView ? 'bg-[#C5A059] text-slate-900' : 'text-slate-400 hover:text-white'}`}><LayoutTemplate size={14} /> Admin</button>
                  <button onClick={() => setIsClientView(true)} className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 ${isClientView ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}><Eye size={14} /> Vista</button>
                </div>
                <button onClick={handleDownloadImage} disabled={generandoImagen} className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg border border-slate-700 disabled:opacity-60" title="Generar imagen del reporte para enviar por WhatsApp">
                  {generandoImagen ? <Loader className="animate-spin" size={16} /> : <MessageCircle size={16} />} <span className="hidden sm:inline">Imagen p/WhatsApp</span>
                </button>
                <button onClick={() => setShowTablas(true)} className="flex items-center gap-2 text-xs font-bold text-[#C5A059] bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg border border-slate-700" title="Editar la tabla oficial de ARCA e Ingresos Brutos Mendoza">
                  <BarChart3 size={16} /> <span className="hidden sm:inline">Tablas oficiales</span>
                </button>
                {!isClientView && (
                  <div className="flex items-center gap-2">
                    <select value={selectedClientId || ""} onChange={(e) => { setSelectedClientId(e.target.value); setCredOut(null); }}
                      className="hidden sm:block bg-slate-800/80 text-sm border border-slate-600 rounded-lg px-3 py-2 w-40 focus:ring-2 focus:ring-[#C5A059] outline-none text-white font-medium">
                      <option value="" disabled>Seleccionar cliente</option>
                      {clientsDB.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                    <button onClick={handleCreateClient} disabled={isSaving} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 text-[#C5A059]" title="Nuevo cliente"><UserPlus size={18} /></button>
                    <button onClick={handleSaveCurrentClient} disabled={isSaving} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 text-emerald-400" title="Guardar">{isSaving ? <Loader className="animate-spin" size={18} /> : <Save size={18} />}</button>
                    <button onClick={handleDeleteClient} disabled={isSaving} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 text-red-400" title="Borrar"><Trash2 size={18} /></button>
                  </div>
                )}
              </>
            )}
            <div className="h-6 w-px bg-slate-700 mx-1"></div>
            <button onClick={handleLogout} className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg border border-slate-700"><LogOut size={16} /> <span className="hidden sm:inline">Salir</span></button>
          </div>
        </div>
      </div>

      {showSaveAlert && <div className="fixed top-20 right-5 bg-emerald-500 text-white px-4 py-2 rounded-lg shadow-xl z-50 flex items-center gap-2 font-bold"><CheckCircle size={16} /> Guardado</div>}
      {showImageAlert && <div className="fixed top-20 right-5 bg-emerald-500 text-white px-4 py-2 rounded-lg shadow-xl z-50 flex items-center gap-2 font-bold"><MessageCircle size={16} /> Imagen descargada — adjuntala en WhatsApp</div>}
      {credOut && (
        <div className="fixed top-20 right-5 bg-white border border-emerald-300 shadow-xl rounded-lg p-4 z-50 max-w-xs text-xs">
          <p className="font-bold text-emerald-700 mb-1">Cliente creado</p>
          <p>Enviale estos datos por un canal seguro (no por acá):</p>
          <p className="mt-2 font-mono">{credOut.email}<br />{credOut.pass}</p>
          <button onClick={() => setCredOut(null)} className="mt-2 text-slate-400 underline">Cerrar</button>
        </div>
      )}

      {showTablas ? (
        <div className="max-w-5xl mx-auto p-4 md:p-6">
          <button onClick={() => setShowTablas(false)} className="mb-4 text-sm font-bold text-slate-500 hover:text-slate-800">← Volver</button>
          <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-1">Tablas oficiales</h2>
            <p className="text-xs text-slate-500 mb-5">Ingresos, superficie, energía y alquiler son comunes a servicios y venta de cosas muebles. El impuesto integrado difiere desde la categoría C. Los cambios se aplican de inmediato a todos los clientes.</p>
            <div className="grid grid-cols-2 gap-4 mb-5 max-w-md">
              <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">ARCA vigente desde</label><input className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm" value={vigArcaForm} onChange={(e) => setVigArcaForm(e.target.value)} /></div>
              <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">ATM vigente desde</label><input className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm" value={vigAtmForm} onChange={(e) => setVigAtmForm(e.target.value)} /></div>
            </div>
            {catsForm && (
              <div className="overflow-x-auto">
                <table className="text-xs w-full">
                  <thead>
                    <tr className="text-left text-slate-400 uppercase text-[9px]">
                      <th className="p-1">Cat.</th><th className="p-1">Ingresos brutos anual</th><th className="p-1">Superficie m²</th><th className="p-1">Energía kWh</th><th className="p-1">Alquiler anual</th><th className="p-1">Imp. Servicios</th><th className="p-1">Imp. Bienes</th><th className="p-1">SIPA</th><th className="p-1">Obra social</th><th className="p-1">ATM Mendoza</th>
                    </tr>
                  </thead>
                  <tbody>
                    {catsForm.map((c, i) => (
                      <tr key={c.letra} className="border-t border-slate-100">
                        <td className="p-1 font-bold text-slate-700">{c.letra}</td>
                        {['ingresos', 'superficie', 'energia', 'alquiler', 'impuestoServicios', 'impuestoBienes', 'sipa', 'obraSocial', 'iibbMendoza'].map((field) => (
                          <td key={field} className="p-1">
                            <input type="number" value={c[field]} onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setCatsForm((prev) => prev.map((row, ri) => (ri === i ? { ...row, [field]: val } : row)));
                            }} className="w-24 border border-slate-200 rounded px-1.5 py-1 font-mono" />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <button onClick={handleGuardarTablas} className="mt-5 bg-[#0f172a] hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold">Guardar actualización</button>
          </div>
        </div>
      ) : (
      <div className={`max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 ${(!isClientView && currentUser.role === 'admin') ? 'lg:grid-cols-12' : 'lg:grid-cols-1'} gap-6 mt-4`}>

        {(!isClientView && currentUser.role === 'admin') && (
          <div className="lg:col-span-4 space-y-6 animate-fade-in-left">
            <div className="bg-white rounded-2xl shadow-lg border border-white p-5">
              <h3 className="text-slate-800 font-bold text-lg mb-4 flex items-center gap-2 border-b border-slate-100 pb-2"><Briefcase className="text-[#C5A059]" size={20} /> Perfil Cliente</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Razón Social</label>
                  <input type="text" value={cliente.nombre} onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#C5A059] outline-none font-semibold" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">CUIT</label>
                  <input type="text" value={cliente.cuit} onChange={(e) => setCliente({ ...cliente, cuit: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#C5A059] outline-none font-mono" placeholder="20-11222333-4" />
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1 uppercase"><KeyRound size={12} /> Acceso del cliente</h4>
                  <p className="text-xs text-slate-600 mb-2">Login: <span className="font-mono">{cliente.email || "—"}</span></p>
                  <button onClick={handleResetPassword} className="text-xs font-bold text-indigo-600 underline">Enviar email para cambiar contraseña</button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Cat. Actual</label>
                    <select value={cliente.categoriaActual} onChange={(e) => setCliente({ ...cliente, categoriaActual: e.target.value })} className="w-full bg-transparent font-bold text-slate-700 outline-none text-lg">
                      {CATEGORIAS.map((c) => <option key={c.letra} value={c.letra}>{c.letra}</option>)}
                    </select>
                  </div>
                  <div className="bg-[#0f172a] p-2 rounded-lg border border-slate-800">
                    <label className="text-[10px] font-bold text-[#C5A059] uppercase block mb-1">Cat. Proyectada</label>
                    <select value={cliente.categoriaObjetivo} onChange={(e) => setCliente({ ...cliente, categoriaObjetivo: e.target.value })} className="w-full bg-transparent font-bold text-white outline-none text-lg">
                      {CATEGORIAS.map((c) => <option key={c.letra} value={c.letra}>{c.letra}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
                  <button onClick={() => setCliente({ ...cliente, tipoActividad: 'servicios' })} className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 ${cliente.tipoActividad === 'servicios' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}><Briefcase size={14} /> Servicios</button>
                  <button onClick={() => setCliente({ ...cliente, tipoActividad: 'bienes' })} className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 ${cliente.tipoActividad === 'bienes' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}><ShoppingBag size={14} /> Bienes</button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Alquiler/año</label><input type="number" value={cliente.alquilerAnual} onChange={(e) => setCliente({ ...cliente, alquilerAnual: Number(e.target.value) })} className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs" /></div>
                  <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Superficie m²</label><input type="number" value={cliente.superficieM2} onChange={(e) => setCliente({ ...cliente, superficieM2: Number(e.target.value) })} className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs" /></div>
                  <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Energía kWh/año</label><input type="number" value={cliente.energiaKwh} onChange={(e) => setCliente({ ...cliente, energiaKwh: Number(e.target.value) })} className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs" /></div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-1">Componentes del pago</h4>
                  {[
                    ['impositivo', 'Impuesto integrado (ARCA)'],
                    ['jubilacion', 'Jubilación (SIPA)'],
                    ['obraSocial', 'Obra social'],
                    ['ingresosBrutos', 'Ingresos Brutos Mendoza (ATM)'],
                  ].map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 text-xs text-slate-700">
                      <input type="checkbox" checked={!!cliente.componentes?.[key]} onChange={(e) => setCliente({ ...cliente, componentes: { ...cliente.componentes, [key]: e.target.checked } })} className="accent-[#C5A059] w-4 h-4" />
                      {label}
                    </label>
                  ))}
                  {cliente.componentes?.obraSocial && (
                    <div className="pl-6 flex items-center gap-2">
                      <span className="text-xs text-slate-500">Adherentes/hijos:</span>
                      <input type="number" min="0" value={cliente.cantidadAdherentes} onChange={(e) => setCliente({ ...cliente, cantidadAdherentes: Number(e.target.value) })} className="w-16 bg-white border border-slate-300 rounded px-2 py-1 text-xs text-center" />
                      <span className="text-[10px] text-slate-400">× ${configDoc.costoAdherente?.toLocaleString('es-AR')}/u.</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Monto real que declara abonar</label>
                  <input type="number" value={cliente.montoRealAbonado ?? ''} onChange={(e) => setCliente({ ...cliente, montoRealAbonado: e.target.value === '' ? null : Number(e.target.value) })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Opcional, para contrastar" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Fecha de alta del monotributo</label><input type="date" value={cliente.fechaAlta || ''} onChange={(e) => setCliente({ ...cliente, fechaAlta: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs" /></div>
                  <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Próximo vencimiento de pago</label><input type="date" value={cliente.proximoVencimiento || ''} onChange={(e) => setCliente({ ...cliente, proximoVencimiento: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs" /></div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Recategorización — {labelPeriodo(periodoRecat)}</h4>
                  {!correspondeRecat ? (
                    <p className="text-xs text-slate-500">No corresponde: el alta es posterior al inicio del semestre evaluado.</p>
                  ) : confirmadaRecat ? (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><CheckCircle size={14} /> Confirmada</span>
                      <button onClick={() => setCliente({ ...cliente, recategorizaciones: { ...cliente.recategorizaciones, [periodoRecat]: false } })} className="text-[11px] text-slate-400 underline">Deshacer</button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-600 flex items-center gap-1"><AlertTriangle size={14} /> Pendiente</span>
                      <button onClick={() => setCliente({ ...cliente, recategorizaciones: { ...cliente.recategorizaciones, [periodoRecat]: true } })} className="text-[11px] font-bold text-white bg-[#0f172a] px-2 py-1 rounded">Marcar como realizada</button>
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400 mt-2">Próxima ventana: {proxVentana.mes} {proxVentana.anio}.</p>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Costo mensual por adherente (general, aplica a todos los clientes)</label>
                  <input type="number" defaultValue={configDoc.costoAdherente} onBlur={(e) => handleSaveCostoAdherente(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-white p-5">
              <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                <h3 className="text-slate-800 font-bold text-lg flex items-center gap-2"><Calendar className="text-[#C5A059]" size={20} /> Facturación</h3>
                <select value={anioVista} onChange={(e) => { if (e.target.value === 'otro') { const a = window.prompt('¿Qué año querés cargar/ver?'); if (a && /^\d{4}$/.test(a.trim())) setAnioVista(a.trim()); } else setAnioVista(e.target.value); }} className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 font-bold">
                  <option value="ultimos12">Últimos 12 meses</option>
                  {añosDisponibles.map((a) => <option key={a} value={a}>Año {a}</option>)}
                  <option value="otro">Otro año…</option>
                </select>
              </div>
              <div className="max-h-[350px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                {clavesAMostrar.map((clave) => (
                  <div key={clave} className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase w-20">{labelDeClave(clave)}</span>
                    <div className="relative flex-1">
                      <span className="absolute left-2 top-1.5 text-slate-400 text-xs">$</span>
                      <input type="number" value={facturacionMensual[clave] || ''} onChange={(e) => setFacturacionMensual({ ...facturacionMensual, [clave]: Number(e.target.value) || 0 })} placeholder="0" className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-right text-sm font-mono" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 text-right">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">{anioVista === 'ultimos12' ? 'Total acumulado (12 meses)' : `Total facturado en ${anioVista}`}</p>
                <p className="text-2xl font-black text-slate-800">$ {new Intl.NumberFormat('es-AR').format(anioVista === 'ultimos12' ? facturacionAcumulada : sumaClaves(facturacionMensual, mesesDeAnio(anioVista)))}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-dashed border-[#C5A059]/50 p-5">
              <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-2">
                <h3 className="text-slate-800 font-bold text-sm flex items-center gap-2"><TrendingUp className="text-[#C5A059]" size={18} /> Proyección a futuro</h3>
                <span className="text-[9px] bg-amber-50 text-amber-600 font-bold px-2 py-1 rounded-full uppercase">Solo vos la ves</span>
              </div>
              <p className="text-[10px] text-slate-400 mb-3">Simulá los próximos 6 meses para ver qué categoría le tocaría. El cliente nunca ve estos valores.</p>
              <div className="space-y-2">
                {ultimosNMeses(6, 1).map((clave) => (
                  <div key={clave} className="flex items-center justify-between bg-amber-50/40 p-2 rounded-lg border border-amber-100">
                    <span className="text-[10px] font-bold text-slate-500 uppercase w-20">{labelDeClave(clave)}</span>
                    <div className="relative flex-1">
                      <span className="absolute left-2 top-1.5 text-slate-400 text-xs">$</span>
                      <input type="number" value={facturacionProyectada[clave] || ''} onChange={(e) => setFacturacionProyectada({ ...facturacionProyectada, [clave]: Number(e.target.value) || 0 })} placeholder="0" className="w-full bg-white border border-amber-200 rounded px-2 py-1 text-right text-sm font-mono" />
                    </div>
                  </div>
                ))}
              </div>
              {(() => {
                const acumProyectado = facturacionAcumulada + Object.values(facturacionProyectada).reduce((a, b) => a + Number(b || 0), 0);
                const resProy = determinarCategoria(acumProyectado, cliente.superficieM2 || 0, cliente.energiaKwh || 0, cliente.alquilerAnual || 0);
                return (
                  <p className="text-xs text-slate-600 mt-3 pt-3 border-t border-amber-100">Con esta proyección sumada a lo ya facturado, quedaría en categoría <b>{resProy.letra}</b>.</p>
                );
              })()}
            </div>
          </div>
        )}

        <div className={`${(isClientView || currentUser.role === 'client') ? 'lg:col-span-12 max-w-4xl mx-auto w-full' : 'lg:col-span-8'} space-y-6`}>
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden relative" ref={reportRef}>
            <div className="h-1.5 w-full bg-gradient-to-r from-[#C5A059] via-[#e4c988] to-[#C5A059]"></div>
            <div ref={resumenRef}>
            <div className="bg-[#0f172a] p-8 relative overflow-hidden">
              <div className="relative z-10 w-full">
                <div className="mb-6 border-b border-slate-700/50 pb-4">
                  <h1 className="text-2xl font-bold text-white mb-1">{cliente.nombre}</h1>
                  <div className="flex items-center gap-3">
                    <span className="text-[#C5A059] font-mono text-sm font-bold">CUIT: {cliente.cuit || "Sin CUIT"}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${cliente.tipoActividad === 'servicios' ? 'bg-blue-900 text-blue-200' : 'bg-purple-900 text-purple-200'}`}>{cliente.tipoActividad}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 flex items-center gap-2.5">
                    <Calendar size={20} className="text-[#C5A059]" />
                    <span className="text-xl font-black text-white tracking-tight">{mesReporte}</span>
                  </div>
                  {cliente.proximoVencimiento && (
                    <div className="bg-[#C5A059] rounded-xl px-4 py-2.5 flex items-center gap-2.5">
                      <span className="text-[10px] font-bold text-[#0f172a] uppercase tracking-wide">Vencimiento del monotributo</span>
                      <span className="text-xl font-black text-[#0f172a]">{new Date(cliente.proximoVencimiento + 'T00:00:00').toLocaleDateString('es-AR')}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-3xl font-black text-white mb-2">Informe de Situación</h2>
                    <div className="flex items-center gap-2"><span className="bg-[#C5A059] text-[#0f172a] text-[10px] font-bold px-2 py-0.5 rounded">2026</span><p className="text-slate-400 font-medium text-sm">Planificación Fiscal Estratégica</p></div>
                  </div>
                  <div className="relative z-10 w-20 h-20 bg-white rounded-full p-1 shadow-2xl border-4 border-[#C5A059] flex items-center justify-center overflow-hidden"><BrandLogo className="w-full h-full rounded-full" size="large" /></div>
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mt-4 pt-3 border-t border-white/10 text-[11px] text-slate-300">
                  <span>Informe generado el {new Date().toLocaleDateString('es-AR')}</span>
                  <span>Monto a pagar: <b className="text-white">$ {new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(cliente.montoRealAbonado ?? desglose.total)}</b></span>
                  {correspondeRecat && (
                    <span className={`font-bold ${confirmadaRecat ? 'text-emerald-400' : 'text-amber-400'}`}>
                      Recategorización {labelPeriodo(periodoRecat)}: {confirmadaRecat ? 'Realizada' : 'Pendiente'}
                    </span>
                  )}
                </div>
              </div>
              <div className="absolute top-0 right-0 w-96 h-96 bg-[#C5A059] opacity-10 rounded-full blur-3xl -mr-20 -mt-20"></div>
            </div>

            <div className="p-8 space-y-8 bg-gradient-to-b from-white to-slate-50">
              {alertas.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <h4 className="text-sm font-bold text-slate-700 uppercase mb-3 flex items-center gap-2"><span className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600"><BellRing size={16} /></span> Alertas</h4>
                  <div className="space-y-2">
                    {alertas.map((a, i) => (
                      <div key={i} className={`text-xs font-medium px-3 py-2 rounded-lg border-l-4 ${
                        a.nivel === 'alta' ? 'bg-red-50 border-red-500 text-red-700' :
                        a.nivel === 'media' ? 'bg-amber-50 border-amber-500 text-amber-700' :
                        'bg-blue-50 border-blue-500 text-blue-700'
                      }`}>{a.texto}</div>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#C5A059]"></div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-8 tracking-widest text-center flex items-center justify-center gap-2"><Target size={13} className="text-[#C5A059]" /> Trayectoria hacia Categoría {cliente.categoriaObjetivo}</h4>
                  <div className="relative h-3 bg-slate-100 rounded-full mb-10 mx-2">
                    <div className="absolute top-0 left-0 w-full h-full rounded-full flex overflow-hidden opacity-20">
                      <div className="bg-emerald-500" style={{ width: '55%' }}></div>
                      <div className="bg-amber-500" style={{ width: '18%' }}></div>
                      <div className="bg-red-500" style={{ width: '27%' }}></div>
                    </div>
                    <div className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${margenObjetivo < 0 ? 'bg-red-500' : 'bg-gradient-to-r from-[#C5A059] to-amber-300'}`} style={{ width: `${Math.min((facturacionAcumulada / (catObjetivoData.ingresos || 1)) * 100, 100)}%` }}></div>
                  </div>
                  <div className="flex justify-between items-center px-1 mt-2">
                    {CATEGORIAS.map((cat, idx) => {
                      const isActual = cat.letra === cliente.categoriaActual;
                      const isTarget = cat.letra === cliente.categoriaObjetivo;
                      let styles = "w-6 h-6 text-[10px] text-slate-300 bg-slate-50 border border-slate-100";
                      if (isActual) styles = "w-8 h-8 text-xs text-slate-600 bg-white border-2 border-slate-300 font-bold shadow-sm scale-110";
                      if (isTarget) styles = "w-10 h-10 text-sm text-white bg-[#0f172a] border-2 border-[#C5A059] font-bold shadow-lg scale-125 z-10";
                      return <div key={cat.letra} className={`rounded-full flex items-center justify-center transition-all ${styles}`}>{cat.letra}</div>;
                    })}
                  </div>
                  <div className="flex justify-between text-[9px] font-bold uppercase mt-3 pt-2 border-t border-slate-100">
                    <span className="text-emerald-600">A–F · Conveniente</span><span className="text-amber-600">G–H · Alto costo</span><span className="text-red-600">I–K · Análisis puntual</span>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1 text-center">La franja I–K es de costo muy elevado, no implica exclusión automática del régimen.</p>
                </div>

                <div className="space-y-4">
                  <div className={`p-6 rounded-2xl border flex items-center justify-between shadow-sm ${margenObjetivo < 0 ? 'bg-red-50/50 border-red-100' : 'bg-emerald-50/50 border-emerald-100'}`}>
                    <div>
                      <p className={`text-[10px] font-bold uppercase mb-1 ${margenObjetivo < 0 ? 'text-red-600' : 'text-emerald-600'}`}>{margenObjetivo < 0 ? 'Exceso sobre objetivo' : 'Cupo disponible'}</p>
                      <p className={`text-3xl font-black ${margenObjetivo < 0 ? 'text-red-700' : 'text-emerald-700'}`}>$ {new Intl.NumberFormat('es-AR', { notation: "compact", maximumFractionDigits: 1 }).format(Math.abs(margenObjetivo))}</p>
                    </div>
                    <div className={`p-3 rounded-full ${margenObjetivo < 0 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>{margenObjetivo < 0 ? <AlertTriangle size={28} /> : <CheckCircle size={28} />}</div>
                  </div>
                  <div className="p-6 rounded-2xl border border-slate-100 bg-white shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase mb-1 text-slate-400">Facturación acumulada (12 meses)</p>
                      <p className="text-3xl font-black text-slate-800">$ {new Intl.NumberFormat('es-AR', { notation: "compact", maximumFractionDigits: 1 }).format(facturacionAcumulada)}</p>
                      <p className="text-xs mt-1 text-slate-400">Categoría {cliente.categoriaActual} — {zonaDe(idxActual) === 'conveniente' ? 'zona conveniente' : zonaDe(idxActual) === 'alto-costo' ? 'zona de alto costo' : 'costo elevado, a evaluar'}</p>
                    </div>
                    <div className="p-3 rounded-full bg-blue-50 text-blue-600"><TrendingUp size={28} /></div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                <div className="bg-blue-700 text-white px-5 py-3.5 flex items-center justify-between gap-4">
                  <span className="text-xs font-semibold flex items-center gap-2"><Target size={14} className="opacity-80" /> El tope de facturación para la categoría {cliente.categoriaActual} es</span>
                  <span className="text-lg font-black whitespace-nowrap">$ {new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(catActualData.ingresos)}</span>
                </div>
                <div className="bg-emerald-700 text-white px-5 py-3.5 flex items-center justify-between gap-4 border-t border-white/10">
                  <span className="text-xs font-semibold flex items-center gap-2"><History size={14} className="opacity-80" /> Su facturación acumulada en los últimos 6 meses es</span>
                  <span className="text-lg font-black whitespace-nowrap">$ {new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(ultimos6)}</span>
                </div>
                <div className="bg-red-700 text-white px-5 py-3.5 flex items-center justify-between gap-4 border-t border-white/10">
                  <span className="text-xs font-semibold flex items-center gap-2"><TrendingUp size={14} className="opacity-80" /> Para mantener la categoría, en los próximos 6 meses debería facturar hasta</span>
                  <span className="text-lg font-black whitespace-nowrap">$ {new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(proximos6MesesMax)}/mes</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-slate-50 rounded-xl border border-slate-100 p-3"><p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Tope del régimen (Cat. K)</p><p className="text-sm font-bold text-slate-800">$ {new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(excl.ingresos)}</p></div>
                <div className="bg-slate-50 rounded-xl border border-slate-100 p-3"><p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Facturación acumulada (12 meses)</p><p className="text-sm font-bold text-slate-800">$ {new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(facturacionAcumulada)}</p></div>
                <div className={`rounded-xl border p-3 ${margenExclusion < excl.ingresos * 0.1 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}><p className={`text-[9px] font-bold uppercase mb-1 ${margenExclusion < excl.ingresos * 0.1 ? 'text-red-600' : 'text-emerald-600'}`}>Margen antes de excluirse</p><p className={`text-sm font-bold ${margenExclusion < excl.ingresos * 0.1 ? 'text-red-700' : 'text-emerald-700'}`}>$ {new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(margenExclusion)}</p></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-slate-50 rounded-xl border border-slate-100 p-3"><p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Promedio mensual real</p><p className="text-sm font-bold text-slate-800">$ {new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(promedioMensualReal)}</p></div>
                <div className="bg-slate-50 rounded-xl border border-slate-100 p-3"><p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Límite mensual objetivo</p><p className="text-sm font-bold text-[#C5A059]">$ {new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(promedioMensualLimiteObjetivo)}</p></div>
                <div className="bg-slate-50 rounded-xl border border-slate-100 p-3"><p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Disponible mensual</p><p className={`text-sm font-bold ${promedioMensualDisponible < 0 ? 'text-red-700' : 'text-emerald-700'}`}>$ {new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(Math.abs(promedioMensualDisponible))}</p></div>
              </div>

              <div className="bg-[#0f172a] rounded-xl p-4 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase flex items-center gap-2"><CreditCard size={14} className="text-[#C5A059]" /> Cuota mensual — Categoría {cliente.categoriaActual}</span>
                <span className="text-xl font-black text-white">$ {new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(desglose.total)}</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Alquileres', pct: pctAlquiler, Icon: Home },
                  { label: 'Energía', pct: pctEnergia, Icon: Zap },
                  { label: 'Superficie', pct: pctSuperficie, Icon: Layout },
                ].map(({ label, pct, Icon }) => (
                  <div key={label} className={`rounded-xl border p-3 text-center ${pct < 70 ? 'bg-emerald-50 border-emerald-100' : pct < 90 ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100'}`}>
                    <Icon size={16} className={`mx-auto mb-1 ${pct < 70 ? 'text-emerald-600' : pct < 90 ? 'text-amber-600' : 'text-red-600'}`} />
                    <p className="text-[10px] font-bold text-slate-500">{label}</p>
                    <p className={`text-xs font-bold ${pct < 70 ? 'text-emerald-700' : pct < 90 ? 'text-amber-700' : 'text-red-700'}`}>{pct < 70 ? 'Normal' : pct < 90 ? 'Atención' : 'Superado'} ({Math.round(pct)}%)</p>
                  </div>
                ))}
              </div>
            </div>
            </div>

            <div className="px-8 pb-8 space-y-8 bg-gradient-to-b from-white to-slate-50">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-2"><span className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600"><Gauge size={16} /></span><h4 className="text-sm font-bold text-slate-700 uppercase">Velocidad de facturación</h4></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100"><p className="text-[10px] text-slate-400 font-bold uppercase mb-2">Promedio real actual</p><p className="text-xl font-bold text-slate-800">$ {new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(promedioMensualReal)}</p></div>
                  <div className="bg-[#fffbeb] p-4 rounded-xl border border-[#fef3c7]"><p className="text-[10px] text-amber-600/70 font-bold uppercase mb-2">Límite mensual objetivo</p><p className="text-xl font-bold text-[#C5A059]">$ {new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(promedioMensualLimiteObjetivo)}</p></div>
                  <div className={`p-4 rounded-xl border ${promedioMensualDisponible < 0 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}><p className={`text-[10px] font-bold uppercase mb-2 ${promedioMensualDisponible < 0 ? 'text-red-600' : 'text-emerald-600'}`}>Disponible mensual</p><p className={`text-xl font-bold ${promedioMensualDisponible < 0 ? 'text-red-700' : 'text-emerald-700'}`}>$ {new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(Math.abs(promedioMensualDisponible))}</p></div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-2 border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2"><span className="w-8 h-8 rounded-full bg-violet-50 flex items-center justify-center text-violet-600"><BarChart3 size={16} /></span><h4 className="text-sm font-bold text-slate-700 uppercase">Evolución de facturación</h4></div>
                  <select value={anioVista} onChange={(e) => { if (e.target.value === 'otro') { const a = window.prompt('¿Qué año querés consultar?'); if (a && /^\d{4}$/.test(a.trim())) setAnioVista(a.trim()); } else setAnioVista(e.target.value); }} className="text-[11px] border border-slate-200 rounded-lg px-2 py-1 bg-slate-50 font-bold text-slate-600">
                    <option value="ultimos12">Últimos 12 meses</option>
                    {añosDisponibles.map((a) => <option key={a} value={a}>Año {a}</option>)}
                    <option value="otro">Otro año…</option>
                  </select>
                </div>
                {(() => {
                  const chartW = 600, chartH = 170, padL = 8, padR = 8, padT = 12, padB = 22;
                  const plotW = chartW - padL - padR, plotH = chartH - padT - padB;
                  const valores = clavesAMostrar.map((c) => Number(facturacionMensual[c] || 0));
                  const maxVal = Math.max(1, ...valores, topeMensualCategoriaActual);
                  const slot = plotW / clavesAMostrar.length;
                  const barW = Math.max(4, slot - 8);
                  const refY = padT + (plotH - (topeMensualCategoriaActual / maxVal) * plotH);
                  return (
                    <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-40 mt-3">
                      <line x1={padL} x2={chartW - padR} y1={refY} y2={refY} stroke="#0f172a" strokeDasharray="4 3" strokeWidth="1" />
                      <text x={chartW - padR} y={refY - 4} fontSize="8" textAnchor="end" fill="#0f172a">Tope mensual cat. {cliente.categoriaActual}</text>
                      {clavesAMostrar.map((clave, i) => {
                        const val = Number(facturacionMensual[clave] || 0);
                        const h = (val / maxVal) * plotH;
                        const x = padL + i * slot + (slot - barW) / 2;
                        const y = padT + (plotH - h);
                        const over = val > topeMensualCategoriaActual;
                        return (
                          <g key={clave}>
                            <rect x={x} y={y} width={barW} height={Math.max(h, 1)} rx="2.5" fill={over ? '#b91c1c' : '#C5A059'}>
                              <title>{labelDeClave(clave)}: $ {new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(val)}</title>
                            </rect>
                            <text x={x + barW / 2} y={chartH - 8} fontSize="7.5" textAnchor="middle" fill="#94a3b8">{labelDeClave(clave).split(' ')[0]}</text>
                          </g>
                        );
                      })}
                    </svg>
                  );
                })()}
                <p className="text-[10px] text-slate-400 mt-1">En rojo, los meses que superaron el tope mensual equivalente de la categoría actual. Pasá el mouse sobre una barra para ver el monto exacto.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="bg-[#0f172a] px-6 py-4 flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white uppercase flex items-center gap-2"><span className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[#C5A059]"><CreditCard size={14} /></span> Cuota mensual</h4>
                    <span className="bg-[#C5A059] text-[10px] font-bold px-2 py-1 rounded text-slate-900">CAT {cliente.categoriaActual}</span>
                  </div>
                  <div className="p-6 space-y-3 text-sm">
                    {desglose.items.map((it, i) => (
                      <div key={i} className="flex justify-between border-b border-slate-100 pb-2"><span className="text-slate-500">{it.label}</span><span className="font-bold text-slate-700">$ {new Intl.NumberFormat('es-AR').format(it.value)}</span></div>
                    ))}
                    <div className="flex justify-between pt-2 items-center"><span className="font-bold text-slate-800 uppercase text-xs">Total calculado</span><span className="text-2xl font-black text-[#0f172a]">$ {new Intl.NumberFormat('es-AR').format(desglose.total)}</span></div>
                    <div className="pt-3 border-t border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Monto real declarado</p>
                      {cliente.montoRealAbonado != null ? (
                        <>
                          <p className="text-lg font-bold text-slate-700">$ {new Intl.NumberFormat('es-AR').format(cliente.montoRealAbonado)}</p>
                          {Math.abs(diffReal) < 100
                            ? <p className="text-xs text-emerald-600 font-bold mt-1">Coincide con lo calculado</p>
                            : <p className="text-xs text-red-600 font-bold mt-1">Diferencia de $ {new Intl.NumberFormat('es-AR').format(Math.abs(diffReal))} {diffReal > 0 ? 'por encima' : 'por debajo'} — revisar</p>}
                        </>
                      ) : <p className="text-xs text-slate-400">No cargado</p>}
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-900 to-slate-900 border border-indigo-800 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-center text-white shadow-xl">
                  <div className="absolute top-0 right-0 p-4 opacity-20"><Bot className="text-indigo-400 w-32 h-32" /></div>
                  <div className="relative z-10">
                    <h4 className="text-sm font-bold text-indigo-300 uppercase mb-4 flex items-center gap-2"><span className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[#C5A059]"><Sparkles size={14} /></span> NC Smart Assistant</h4>
                    {!aiAdvice ? (
                      <>
                        <p className="text-xs text-indigo-100/80 mb-6 leading-relaxed">Análisis instantáneo, generado por IA, orientativo y sin intervención de un profesional.</p>
                        <button onClick={handleConsultarIA} disabled={isLoadingAi} className="w-full bg-[#C5A059] hover:bg-[#b08d4a] text-slate-900 py-3 rounded-xl font-bold text-sm shadow-lg flex justify-center items-center gap-2 disabled:opacity-70">
                          {isLoadingAi ? <Loader className="animate-spin" size={18} /> : <Sparkles size={18} />} {isLoadingAi ? "Procesando..." : "Analizar con IA"}
                        </button>
                      </>
                    ) : (
                      <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 animate-fade-in">
                        <p className="text-sm text-indigo-50 leading-relaxed">{aiAdvice}</p>
                        <p className="text-[10px] text-indigo-300 mt-3">Sugerencia automática — no reemplaza el asesoramiento del estudio.</p>
                        <button onClick={() => setAiAdvice("")} className="mt-3 text-xs text-[#C5A059] font-bold underline">Nueva consulta</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-4 text-white shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10"><AlertTriangle size={80} /></div>
                <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                  <div className="bg-black/20 p-3 rounded-lg text-center min-w-[150px]"><h4 className="text-sm font-bold uppercase mb-1 flex items-center justify-center gap-1.5"><SlidersHorizontal size={13} /> Parámetros de</h4><h3 className="text-xl font-black uppercase leading-tight">Categoría {cliente.categoriaActual}</h3></div>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                    <div className="flex flex-col items-center text-center">
                      <Home className="mb-2" size={24} /><h5 className="font-bold text-sm mb-1">Alquileres</h5>
                      <p className="text-xs">Tope: <b>$ {new Intl.NumberFormat('es-AR').format(catActualData.alquiler)}</b>/año</p>
                      <div className="w-full bg-white/20 h-1.5 rounded-full mt-2 overflow-hidden"><div className={`h-full ${barColor(pctAlquiler)}`} style={{ width: `${pctAlquiler}%` }}></div></div>
                    </div>
                    <div className="flex flex-col items-center text-center border-t md:border-t-0 md:border-l border-white/20 pt-4 md:pt-0 md:pl-6">
                      <Zap className="mb-2" size={24} /><h5 className="font-bold text-sm mb-1">Energía eléctrica</h5>
                      <p className="text-xs">Tope: <b>{catActualData.energia.toLocaleString('es-AR')} kW</b>/año</p>
                      <div className="w-full bg-white/20 h-1.5 rounded-full mt-2 overflow-hidden"><div className={`h-full ${barColor(pctEnergia)}`} style={{ width: `${pctEnergia}%` }}></div></div>
                    </div>
                    <div className="flex flex-col items-center text-center border-t md:border-t-0 md:border-l border-white/20 pt-4 md:pt-0 md:pl-6">
                      <Layout className="mb-2" size={24} /><h5 className="font-bold text-sm mb-1">Superficie afectada</h5>
                      <p className="text-xs">Tope: <b>{catActualData.superficie} m²</b></p>
                      <div className="w-full bg-white/20 h-1.5 rounded-full mt-2 overflow-hidden"><div className={`h-full ${barColor(pctSuperficie)}`} style={{ width: `${pctSuperficie}%` }}></div></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 p-4 text-center border-t border-slate-200"><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center justify-center gap-2"><span className="w-2 h-2 rounded-full bg-[#C5A059]"></span>NC Servicios Integrales • {new Date().getFullYear()}</p></div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100 mt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><Calculator size={20} /></div>
              <div><h3 className="font-bold text-slate-800">¿Qué pasa si factura este monto por mes?</h3><p className="text-xs text-slate-500">Simulá un monto mensual y mirá si se mantiene, sube de categoría o queda excluido</p></div>
            </div>
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1 relative w-full">
                <span className="absolute left-3 top-3 text-slate-400 font-bold">$</span>
                <input type="number" value={montoMensualSimulado === 0 ? '' : montoMensualSimulado} onChange={(e) => setMontoMensualSimulado(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-8 pr-4 text-slate-800 font-bold focus:ring-2 focus:ring-blue-500 outline-none" placeholder={`Ej: ${Math.round(promedioMensualReal)}`} />
              </div>
              <span className="text-xs text-slate-400 whitespace-nowrap">× 12 meses = $ {new Intl.NumberFormat('es-AR').format(anualSimulado)}</span>
            </div>

            {montoMensualSimulado > 0 && (
              <div className={`mt-5 rounded-xl p-4 border-l-4 ${
                resultadoSimulador.excluida ? 'bg-red-50 border-red-500' :
                resultadoSimulador.idx > idxActual ? 'bg-amber-50 border-amber-500' :
                resultadoSimulador.idx < idxActual ? 'bg-blue-50 border-blue-500' :
                'bg-emerald-50 border-emerald-500'
              }`}>
                {resultadoSimulador.excluida ? (
                  <p className="text-sm font-bold text-red-700">Superaría el tope del régimen: quedaría excluido del Monotributo y pasaría a Responsable Inscripto.</p>
                ) : resultadoSimulador.idx > idxActual ? (
                  <p className="text-sm font-bold text-amber-700">Pasaría de categoría {cliente.categoriaActual} a categoría {resultadoSimulador.letra} (determinado por {resultadoSimulador.determinante === 'ingresos' ? 'la facturación' : resultadoSimulador.determinante === 'alquiler' ? 'el alquiler' : resultadoSimulador.determinante === 'superficie' ? 'la superficie' : 'el consumo eléctrico'}).</p>
                ) : resultadoSimulador.idx < idxActual ? (
                  <p className="text-sm font-bold text-blue-700">Bajaría de categoría {cliente.categoriaActual} a categoría {resultadoSimulador.letra}.</p>
                ) : (
                  <p className="text-sm font-bold text-emerald-700">Se mantiene en la categoría {cliente.categoriaActual}.</p>
                )}
                <p className="text-xs text-slate-500 mt-1">
                  El tope mensual equivalente de la categoría {cliente.categoriaActual} es $ {new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(topeMensualCategoriaActual)}.
                  {' '}{montoMensualSimulado <= topeMensualCategoriaActual
                    ? `Todavía tiene margen de $ ${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(topeMensualCategoriaActual - montoMensualSimulado)} por mes.`
                    : `Se pasó por $ ${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(montoMensualSimulado - topeMensualCategoriaActual)} por mes.`}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default App;
