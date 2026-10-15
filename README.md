# VektorCAD — Dibujo Técnico & Geometría Métrica

Aplicación CAD de precisión profesional para dibujo técnico normalizado (UNE / ISO) y educación plástica y visual, con simulación de instrumentos clásicos (regla milimetrada, escuadra a 45º, cartabón a 30º/60º, compás), perspectiva isométrica y diédrica, y exportación a DXF, SVG, PDF vectorial y JSON.

---

## 🌟 Opciones para Instalar y Ejecutar la Aplicación

Tienes **4 opciones diferentes** para instalar y usar VektorCAD según tus preferencias:

---

### 🟢 Opción 1: Instalación Directa PWA (Recomendada — Sin instalar nada ni usar consola)
*No requiere Node.js, Git ni escribir comandos en la terminal.*

1. Abre el enlace de la aplicación en **Google Chrome**, **Microsoft Edge** o **Brave**:
   * En tu PC/Mac: Verás un icono de **"Instalar VektorCAD"** en la barra de direcciones o el botón **"Instalar App"** en la barra superior.
   * En iPhone/iPad (Safari): Pulsa el botón **Compartir** y selecciona **"Añadir a pantalla de inicio"**.
   * En Android (Chrome): Pulsa los tres puntos `⋮` y selecciona **"Instalar aplicación"**.
2. La aplicación se instalará como un programa de escritorio independiente con su propio icono, funcionará **sin conexión a internet (offline)** y guardará tus láminas localmente en tu equipo.

---

### 🐳 Opción 2: Con Docker (Un solo comando, sin instalar Node.js)
Si tienes **Docker** o **Docker Desktop** instalado:

```bash
docker compose up -d
```
O con Docker directo:
```bash
docker build -t vektorcad .
docker run -d -p 3000:80 vektorcad
```
Abre en tu navegador: **[http://localhost:3000](http://localhost:3000)**.

---

### 💻 Opción 3: Modo Tradicional con Node.js

1. Descarga e instala **[Node.js](https://nodejs.org/)** (LTS).
2. Abre una terminal en la carpeta del proyecto y ejecuta:
   ```bash
   npm install
   npm run dev
   ```
3. Accede en tu navegador a: **[http://localhost:3000](http://localhost:3000)**.

---

### ☁️ Opción 4: Despliegue en la Nube con 1 Clic (Gratis)
Puedes alojar tu propia copia online accesible desde cualquier dispositivo:
* **Vercel**: Importa el repositorio de GitHub en [vercel.com](https://vercel.com) (detecta Vite automáticamente).
* **Netlify**: Arrastra la carpeta `dist/` generada tras `npm run build` a [app.netlify.com/drop](https://app.netlify.com/drop).
* **GitHub Pages**: Sube el código a GitHub y activa GitHub Pages desde `Settings > Pages`.

---

## 🧪 Pruebas Unitarias Geométricas

Puedes verificar el funcionamiento del motor geométrico ejecutando:
```bash
node --test src/cad/geometry.test.ts
```
