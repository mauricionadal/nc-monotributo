# NC · Monotributo Inteligente

Panel de seguimiento de Monotributo para clientes de NC Servicios Integrales.
React + Vite + Tailwind, base de datos y login con Firebase, IA vía función serverless de Vercel.

## Qué cambié respecto a la versión de Gemini

1. **Tabla de categorías**: actualizada a los valores oficiales de ARCA vigentes desde el
   1/08/2026, con el desglose real de impuesto integrado, SIPA y obra social por categoría
   (antes estaban aproximados). Se agregaron los límites de superficie, energía y alquiler
   por categoría, que antes no existían.
2. **Ingresos Brutos Mendoza (ATM)**: los valores que ya tenías eran correctos, los mantuve.
3. **Seguridad del login**: antes las contraseñas se guardaban en texto plano en Firestore y
   se validaban en el navegador (visible para cualquiera con las herramientas de desarrollador
   del navegador). Ahora se usa autenticación real de Firebase (email + contraseña), y las
   reglas de Firestore (`firestore.rules`) impiden que un cliente lea los datos de otro.
4. **Componentes del pago configurables**: impuesto integrado, jubilación, obra social
   (con cantidad de adherentes/hijos) e Ingresos Brutos, cada uno con su propio interruptor
   por cliente, más un monto "real declarado" para contrastar contra lo calculado.
5. **Parámetros de la categoría**: ahora se calculan dinámicamente según la categoría de
   cada cliente (antes eran valores fijos iguales para todos).
6. **IA**: conectada a través de una función serverless (`/api/recommend.js`) para no exponer
   ninguna clave en el código del sitio.
7. **Alertas**: el reporte del cliente ahora muestra automáticamente avisos cuando algún
   parámetro supera el 75%/100% del tope, cuando el monto real difiere del calculado, cuando
   hay una categoría proyectada distinta a la actual, y un recordatorio en los meses de
   recategorización (enero y julio).
8. **Simulador mensual**: reemplacé el simulador anterior por uno que responde directamente
   "¿qué pasa si factura $X por mes?" — indica si se mantiene, sube de categoría o queda
   excluido del régimen.
9. **Imagen para WhatsApp**: botón en la barra del administrador que genera una imagen del
   reporte (con `html2canvas`) y, en el celular, abre directamente el panel para compartir
   por WhatsApp; en la computadora, la descarga para adjuntarla a mano.

## Sobre el logo

Ya está cargado — usé el isotipo circular (`public/logo.png`) para el círculo dorado del
encabezado y el login, y también dejé el logo cuadrado con el nombre completo
(`public/logo-cuadrado.png`, lo redimensioné de 5,5 MB a un tamaño liviano para que no
ralentice la carga del sitio) por si más adelante lo querés usar en otra parte del reporte.
También quedó puesto como ícono de pestaña del navegador (favicon).

## 1. Requisitos antes de desplegar

### a) Reglas de Firestore
Andá a [Firebase Console](https://console.firebase.google.com/) → proyecto `nc-monotributo` →
Firestore Database → pestaña "Reglas" → pegá el contenido de `firestore.rules` → Publicar.

### b) Habilitar login por email/contraseña
Firebase Console → Authentication → Sign-in method → habilitá "Correo electrónico/contraseña".

### c) Crear tu usuario administrador
1. Authentication → Users → "Add user" → cargá tu email y una contraseña.
2. Copiá el UID que te genera.
3. Firestore Database → "Start collection" → nombre `admins` → ID del documento: pegá ese
   mismo UID → guardalo con cualquier campo (por ejemplo `email: "tu@mail.com"`) → Guardar.

Con eso, cuando entres al sitio con ese email/contraseña vas a ingresar como administrador.

### d) Logo
Poné tu logo en `public/logo.jpg` (se usa así en el código; si tu archivo tiene otro nombre,
cambialo en `src/App.jsx`, buscá `logo.jpg`).

## 2. Desarrollo local (opcional, para probar antes de subir)
```
npm install
npm run dev
```

## 3. Subir a Vercel

**Opción recomendada — con GitHub:**
1. Creá un repositorio nuevo en GitHub y subí esta carpeta.
2. En [vercel.com](https://vercel.com) → "Add New Project" → importá ese repositorio.
   Vercel detecta Vite automáticamente, no hace falta tocar la configuración de build.
3. Antes de darle "Deploy", andá a "Environment Variables" y agregá:
   - `ANTHROPIC_API_KEY` = tu clave de la API de Anthropic (se obtiene en
     console.anthropic.com → API Keys; es distinta de tu cuenta de Claude.ai).
4. Deploy.
5. En el proyecto ya existente `reporte-monotributo.vercel.app`, andá a Settings → Git y
   conectá este mismo repositorio — así el link que ya tenés en tu web sigue funcionando
   sin cambiar nada en el sitio principal.

**Alternativa — sin GitHub, con la Vercel CLI:**
```
npm install -g vercel
vercel login
vercel --prod
```
(te va a pedir asociarlo a un proyecto — elegí el existente `reporte-monotributo` si
recuperaste el acceso, o creá uno nuevo).

## 4. Después de publicar
- Entrá con tu usuario admin, das de alta a tus clientes desde el botón "+" (te va a pedir
  el email del cliente y genera una contraseña provisoria para pasarle).
- Revisá que la sección "Analizar con IA" funcione (si tira error, revisá que la variable
  `ANTHROPIC_API_KEY` esté bien cargada en Vercel).

## Notas de seguridad
Este proyecto quedó mucho más seguro que la versión anterior, pero antes de cargar datos
fiscales reales de clientes, valdría la pena que alguien con experiencia en desarrollo lo
revise una vez — en particular las reglas de Firestore y el flujo de alta de clientes.
