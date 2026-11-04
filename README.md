# Baskonia Mendi Taldea · Web Oficial & Backoffice (1913tik mendian)

Proyecto web oficial y panel de gestión (**Backoffice**) de **Baskonia Mendi Taldea (Basauri)**, construido con **Astro** y **Supabase** (con modo de sincronización en vivo en local para demos sin necesidad de base de datos externa).

## 🚀 Cómo arrancarlo en local (para la demo de hoy)

> **Nota sobre PowerShell en Windows:** Si tu sistema tiene bloqueada la ejecución de scripts `npm.ps1`, usa `npm.cmd`:

```powershell
npm.cmd run dev
```

Esto levantará el servidor de desarrollo en:
- **Web pública:** [http://localhost:4321/](http://localhost:4321/)
- **Backoffice de gestión:** [http://localhost:4321/admin](http://localhost:4321/admin)

### Guion recomendado para la demo en vivo con la directiva del club

1. Abre en la mitad izquierda de tu pantalla la **Web Pública** (`http://localhost:4321/`) y en la mitad derecha el **Backoffice** (`http://localhost:4321/admin`).
2. **Prueba 1 (Plazas en tiempo real):** En el Backoffice, busca la salida **Bardeak / Las Bardenas** y pulsa el botón **`+1 ocupada`** o cambia el selector de estado a **`🔴 Betea / Completo`**. Verás cómo en la web pública la etiqueta de plazas cambia **al instante** sin recargar la página.
3. **Prueba 2 (Abrir una salida que estaba en "Laster / Próximamente"):** Busca **Castrovalnera**, cámbiala de `🕒 Laster / Próximamente` a `🟢 Inscripción abierta` y marca `Botón Inscribirse`. Al instante aparecerá el contador de plazas y el botón de inscripción en la tarjeta.
4. **Prueba 3 (Inscripción en vivo + Excel):** En la web pública, haz clic en el botón **`Izena eman / Inscribirse`** de cualquier salida, rellena un nombre y envíalo. Verás cómo:
   - Se descuenta automáticamente 1 plaza libre en la tarjeta de la actividad.
   - Aparece la inscripción en la pestaña **2 · Izen-emateak (Inscripciones)** del Backoffice.
   - Pulsando **`📥 Exportar a Excel / CSV`** se descarga el listado listo para abrir en Excel.
5. **Prueba 4 (Stock de material de invierno y tienda):** En la pestaña **3 · Materiala, Denda eta Bulegoa**, resta unidades de *Kranpoiak* o márcalos como agotados, o cambia el horario de oficina del club.

---

## 📁 Estructura del proyecto desempaquetado

El archivo monolítico original (`index-desired.html`, 10,2 MB con 66 imágenes incrustadas en Base64) se ha desempaquetado y modularizado en:

```text
baskoniamt/
├── .github/workflows/deploy.yml   # CI/CD automático con GitHub Actions
├── public/
│   ├── img/                       # 65 imágenes extraídas de Base64 (logo, hero, aterpea, galeria 2025/2026, material, docs)
│   ├── manifest.json              # Manifiesto PWA para instalar la app en móvil/PC
│   └── sw.js                      # Service Worker offline
├── src/
│   ├── components/
│   │   └── Modals.astro           # Modales estáticos (Historia 1913-2026, Escudo, Aterpea, Simuladores PDF, Inscripción)
│   ├── data/
│   │   ├── bmtDefaultData.ts      # Datos estructurados bilingües (EU/ES) de salidas, cursos, material y Wikiloc
│   │   └── i18n.ts                # Diccionario de traducción Euskera <-> Castellano
│   ├── lib/
│   │   └── bmtStore.ts            # Capa de datos híbrida (Supabase Cloud + LocalStorage/BroadcastChannel en vivo)
│   ├── scripts/
│   │   ├── homeClient.ts          # Lógica cliente de la web pública
│   │   └── adminClient.ts         # Lógica cliente del Backoffice (/admin)
│   ├── styles/
│   │   └── bmt.css                # Hoja de estilos limpia (sin Base64 incrustado)
│   └── pages/
│       ├── index.astro            # Web pública principal (/)
│       └── admin.astro            # Panel de administración (/admin)
└── supabase/
    └── schema.sql                 # Esquema SQL + Políticas RLS listo para ejecutar en Supabase
```
