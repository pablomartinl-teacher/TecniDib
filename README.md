# VektorCAD — Dibujo Técnico & Geometría Métrica

Aplicación CAD de precisión profesional para dibujo técnico normalizado (UNE / ISO) y educación plástica y visual, con simulación de instrumentos clásicos (regla milimetrada, escuadra a 45º, cartabón a 30º/60º, compás), perspectiva isométrica y diédrica, y exportación a DXF, SVG, PDF (vectorial) y JSON.

---

## 🚀 Requisitos Previos

Para ejecutar la aplicación en tu ordenador necesitas tener instalado:
* **Node.js** (versión 18, 20 o 22 LTS recomendada): [Descargar Node.js](https://nodejs.org/)
* Un gestor de paquetes (incluido automáticamente con Node.js): `npm` (también compatible con `pnpm`, `yarn` o `bun`).

---

## 📥 Instalación y Ejecución Local

### 1. Descomprimir o Clonar el Proyecto
Abre una terminal o consola de comandos (PowerShell / CMD en Windows, o Terminal en macOS / Linux) y navega hasta la carpeta del proyecto:

```bash
cd ruta/a/vektorcad
```

### 2. Instalar las Dependencias
Ejecuta el siguiente comando para descargar e instalar todas las librerías necesarias:

```bash
npm install
```
*(Si usas Bun, puedes ejecutar `bun install`)*

### 3. Iniciar el Servidor de Desarrollo
Para arrancar la aplicación en modo desarrollo con recarga rápida:

```bash
npm run dev
```

Una vez ejecutado, verás en la terminal un mensaje indicando la dirección local:
```
  ➜  Local:   http://localhost:3000/
```

Abre tu navegador web preferido (Google Chrome, Edge, Firefox, Brave, Safari) e ingresa a:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 📦 Construcción para Producción

Si deseas generar una versión compilada y optimizada lista para alojar en cualquier servidor web (Vercel, Netlify, GitHub Pages, Apache, Nginx):

```bash
npm run build
```

Los archivos finales estáticos se generarán en la carpeta `dist/`.

Para previsualizar localmente la versión de producción:
```bash
npm run preview
```

---

## 🧪 Pruebas Unitarias del Motor Geométrico

Puedes ejecutar la suite de pruebas unitarias automatizadas del motor CAD (intersecciones, bisectrices, mediatrices, teorema de Tales, isocírculos, perspectiva isométrica y generador DXF):

```bash
node --test src/cad/geometry.test.ts
```

---

## 💡 Consejo: Usar como App de Escritorio

Si deseas usarla como una aplicación de escritorio nativa sin barras del navegador:
1. Abre la aplicación en **Google Chrome** o **Microsoft Edge** (`http://localhost:3000`).
2. En la barra de direcciones o en el menú de opciones (los tres puntos verticales arriba a la derecha), haz clic en **"Instalar VektorCAD"** o **"Aplicaciones" > "Instalar este sitio como aplicación"**.
3. Se creará un acceso directo en tu escritorio e iniciará en su propia ventana independiente de alta resolución.
