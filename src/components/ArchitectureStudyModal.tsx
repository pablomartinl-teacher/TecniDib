/**
 * Technical Architecture Study & Engineering Roadmap Modal
 * Detailed engineering analysis for developing a modern high-performance Technical CAD app
 */

import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Cpu,
  Layers,
  Sparkles,
  Workflow,
  ShieldCheck,
  Code2,
  FileSpreadsheet,
} from 'lucide-react';

interface ArchitectureStudyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureStudyModal: React.FC<ArchitectureStudyModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'stack' | 'traditional' | 'performance' | 'extensions' | 'scalability'>('stack');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#181a21] border border-[#2e323e] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden text-neutral-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2d38] bg-[#14151b]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Estudio Técnico de Arquitectura & Roadmap VektorCAD
              </h2>
              <p className="text-xs text-neutral-400">
                Guía completa de tecnologías, flujos de trabajo, extensiones y escalabilidad para CAD educativo y profesional
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-[#252833] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 px-6 py-2.5 bg-[#121318] border-b border-[#252833] overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('stack')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
              activeTab === 'stack' ? 'bg-sky-600 text-white shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            1. Stack Tecnológico & Motor
          </button>
          <button
            onClick={() => setActiveTab('traditional')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
              activeTab === 'traditional' ? 'bg-sky-600 text-white shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Workflow className="w-3.5 h-3.5" />
            2. Simulación Tradicional CAD
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
              activeTab === 'performance' ? 'bg-sky-600 text-white shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            3. Rendimiento y Precisión
          </button>
          <button
            onClick={() => setActiveTab('extensions')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
              activeTab === 'extensions' ? 'bg-sky-600 text-white shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            4. Formatos e Intercambio (DXF/SVG)
          </button>
          <button
            onClick={() => setActiveTab('scalability')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
              activeTab === 'scalability' ? 'bg-sky-600 text-white shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            5. Escalabilidad Offline y Aula
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 text-xs leading-relaxed space-y-4">
          {activeTab === 'stack' && (
            <div className="space-y-4">
              <div className="bg-[#1f222b] p-4 rounded-xl border border-[#2e3342]">
                <h3 className="text-sm font-semibold text-sky-400 mb-2 flex items-center gap-2">
                  <Code2 className="w-4 h-4" />
                  Arquitectura Desacoplada: Core Matemático vs Renderizado
                </h3>
                <p className="text-neutral-300 mb-3">
                  Para aplicaciones de dibujo técnico, mezclar la lógica de intersecciones, cálculo de cotas y snaps con los componentes de la interfaz es el principal cuello de botella. En VektorCAD se implementa una arquitectura en tres capas:
                </p>
                <ul className="list-disc list-inside space-y-1.5 text-neutral-400 ml-2">
                  <li><strong className="text-white">Capa 1: Motor Geométrico Puro (src/cad/geometry.ts):</strong> Funciones matemáticas libres de dependencias de DOM, ejecutables directamente en Web Workers y testeables con el motor nativo de Node.js (<code className="text-sky-300">node:test</code>).</li>
                  <li><strong className="text-white">Capa 2: Motor de Documento y Estado (src/cad/types.ts y storage.ts):</strong> Modelo de datos declarativo e inmutable con soporte de múltiples láminas, historial de operaciones (Undo/Redo en cola finita), y persistencia transaccional en IndexedDB.</li>
                  <li><strong className="text-white">Capa 3: Interfaz React 19 y SVG Vectorial:</strong> Renderizado con escalado exacto en milímetros (<code className="text-sky-300">viewBox="0 0 297 210"</code>), permitiendo zoom ilimitado sin artefactos de pixelado y soporte nativo de impresión a escala física 1:1.</li>
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#1f222b] p-4 rounded-xl border border-[#2e3342]">
                  <h4 className="font-semibold text-white mb-1.5">¿Por qué SVG + Hybrid Canvas?</h4>
                  <p className="text-neutral-400">
                    A diferencia del Canvas puro (bitmap), el SVG mantiene los vectores reales con sus coordenadas métricas, permite estilizado CSS exacto, impresión directa a PDF con calidad tipográfica y exportación para plotter o cortadora láser sin pérdida de resolución.
                  </p>
                </div>
                <div className="bg-[#1f222b] p-4 rounded-xl border border-[#2e3342]">
                  <h4 className="font-semibold text-white mb-1.5">Librerías Clave Recomendadas</h4>
                  <p className="text-neutral-400">
                    <strong className="text-white">jsPDF:</strong> Para encuadernado y exportación de láminas en formato ISO normalizado.
                    <br />
                    <strong className="text-white">pdf.js:</strong> Para cargar láminas modelo y ejercicios de clase como fondo de calco.
                    <br />
                    <strong className="text-white">Lucide React:</strong> Iconografía minimalista para herramientas de precisión.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'traditional' && (
            <div className="space-y-4">
              <div className="bg-[#1f222b] p-4 rounded-xl border border-[#2e3342]">
                <h3 className="text-sm font-semibold text-amber-300 mb-2">
                  Simulación Didáctica del Dibujo Técnico Tradicional
                </h3>
                <p className="text-neutral-300 mb-3">
                  El objetivo primordial en Educación Plástica y Dibujo Técnico (ESO y Bachillerato) es enseñar los conceptos geométricos fundamentales (tangencias, mediatrices, bisectrices, lugares geométricos y vistas ortogonales) uniendo la precisión del CAD con el valor pedagógico de los instrumentos clásicos:
                </p>
                <div className="grid grid-cols-2 gap-3 text-neutral-300">
                  <div className="bg-[#161820] p-3 rounded-lg border border-[#2c303d]">
                    <span className="font-semibold text-amber-400 block mb-1">📐 Juego de Escuadra y Cartabón:</span>
                    Permite posicionar ambos instrumentos virtuales en la pantalla con rotaciones en pasos normalizados de 15º (15º, 30º, 45º, 60º, 75º, 90º...) simulando el deslizamiento de la hipotenusa de la escuadra sobre el cateto del cartabón para generar haces de paralelas y perpendiculares.
                  </div>
                  <div className="bg-[#161820] p-3 rounded-lg border border-[#2c303d]">
                    <span className="font-semibold text-sky-400 block mb-1">🧭 Compás Métrico Digital:</span>
                    Muestra el pinchazo central, el radio de apertura en milímetros exactos y el barrido angular continuo o cerrado para arcos y circunferencias.
                  </div>
                  <div className="bg-[#161820] p-3 rounded-lg border border-[#2c303d]">
                    <span className="font-semibold text-emerald-400 block mb-1">📏 Acotación Normalizada (ISO 129 / UNE 1-039):</span>
                    Generación automática de líneas auxiliares de cota, línea de cota con flechas a 15º o trazos a 45º, y cifra de cota centrada en milímetros.
                  </div>
                  <div className="bg-[#161820] p-3 rounded-lg border border-[#2c303d]">
                    <span className="font-semibold text-purple-400 block mb-1">🔲 Normalización de Láminas y Cajetín (UNE 1035):</span>
                    Márgenes oficiales de 25mm para archivar y 5mm en contornos, más cajetín con Título, Alumno, Escala, Fecha y Calificación.
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="space-y-4">
              <div className="bg-[#1f222b] p-4 rounded-xl border border-[#2e3342]">
                <h3 className="text-sm font-semibold text-emerald-400 mb-2">
                  Optimización de Rendimiento y Algoritmia Geométrica
                </h3>
                <div className="space-y-3 text-neutral-300">
                  <p>
                    Para mantener 60 FPS estables con más de 1.000 entidades y cálculo de imantado magnético (Snap) en tiempo real:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-neutral-400">
                    <li>
                      <strong className="text-white">Spatial Indexing (Quadtree / R-Tree):</strong>
                      En lugar de recorrer todas las entidades para encontrar el punto de snap o el elemento pulsado en <code className="text-emerald-300">O(N)</code>, dividir el espacio de la lámina en celdas cuadrantes reduce la búsqueda a <code className="text-emerald-300">O(log N)</code>.
                    </li>
                    <li>
                      <strong className="text-white">Debounced Persistence:</strong>
                      El autoguardado en IndexedDB se ejecuta con un temporizador de 600ms tras la última modificación para no saturar el canal de E/S del navegador.
                    </li>
                    <li>
                      <strong className="text-white">Ghost Layer Desacoplada:</strong>
                      La vista previa mientras se arrastra el ratón o se introduce una cota por teclado se renderiza en una capa ligera aislada (<code className="text-emerald-300">#layer-ghost</code>) sin invalidar el DOM completo de la solución.
                    </li>
                    <li>
                      <strong className="text-white">Entrada Numérica Directa (HUD CAD):</strong>
                      Permite teclear la medida exacta (ej. <code className="text-sky-300">45.5</code>) mientras se mueve el cursor y pulsar Enter para bloquear la longitud o ángulo con precisión analítica.
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'extensions' && (
            <div className="space-y-4">
              <div className="bg-[#1f222b] p-4 rounded-xl border border-[#2e3342]">
                <h3 className="text-sm font-semibold text-purple-400 mb-2">
                  Extensiones Recomendadas y Ecosistema de Intercambio
                </h3>
                <div className="space-y-3 text-neutral-300">
                  <p>
                    Para llevar la aplicación a un nivel industrial y conectarla con otros programas del sector:
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#15171f] p-3 rounded-lg border border-[#2c303d]">
                      <span className="font-semibold text-sky-400 block mb-1">Exportador / Importador DXF (AutoCAD):</span>
                      Uso de bibliotecas ligeras como <code className="text-neutral-300">dxf-writer</code> y <code className="text-neutral-300">dxf-parser</code> para abrir los dibujos en AutoCAD, LibreCAD, QCAD o enviarlos a fresadoras CNC.
                    </div>
                    <div className="bg-[#15171f] p-3 rounded-lg border border-[#2c303d]">
                      <span className="font-semibold text-purple-400 block mb-1">Fabricación Digital (SVG / G-Code):</span>
                      Generación de trazos limpios de línea continua para trazadores de corte (plotter de corte de vinilo) y cortadoras láser escolares.
                    </div>
                    <div className="bg-[#15171f] p-3 rounded-lg border border-[#2c303d]">
                      <span className="font-semibold text-emerald-400 block mb-1">Módulo de Exportación GeoGebra:</span>
                      Exportación de comandos de construcción geométrica sintética hacia GeoGebra para verificación analítica de soluciones.
                    </div>
                    <div className="bg-[#15171f] p-3 rounded-lg border border-[#2c303d]">
                      <span className="font-semibold text-amber-400 block mb-1">Generador de Problemas con IA:</span>
                      Enunciados de selectividad / EBAU y pruebas de acceso a ciclos formativos con generación asistida de figuras base para resolver.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'scalability' && (
            <div className="space-y-4">
              <div className="bg-[#1f222b] p-4 rounded-xl border border-[#2e3342]">
                <h3 className="text-sm font-semibold text-sky-400 mb-2">
                  Despliegue en Aulas de Informática & Modo Offline-First
                </h3>
                <div className="space-y-3 text-neutral-300">
                  <p>
                    En centros educativos es habitual contar con conexiones limitadas o equipos con permisos restringidos. Las mejores prácticas recomendadas son:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-neutral-400">
                    <li><strong className="text-white">PWA Completa (Progressive Web App):</strong> Con Service Worker y Cache API, la aplicación funciona de forma instantánea sin conexión a internet y se puede instalar como aplicación nativa en Windows, macOS, Linux y ChromeOS.</li>
                    <li><strong className="text-white">Persistencia 100% Local y Privada:</strong> No requiere cuentas de usuario para guardar el trabajo escolar; almacena todo en IndexedDB del navegador y permite descargar el archivo .json para entregarlo en plataformas escolares (Moodle, Google Classroom, Teams).</li>
                    <li><strong className="text-white">Colaboración en Tiempo Real Opcional:</strong> Integración mediante WebSockets y librerías CRDT (<code className="text-sky-300">Yjs</code> o <code className="text-sky-300">Automerge</code>) para que el profesor pueda corregir la lámina del alumno en directo o proyectar la solución paso a paso.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#2a2d38] bg-[#14151b] flex items-center justify-between text-xs text-neutral-400">
          <span>VektorCAD Engine v2.0 • Diseñado según normativas UNE / ISO de Dibujo Técnico</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-xl transition shadow"
          >
            Entendido, volver al dibujo
          </button>
        </div>
      </div>
    </div>
  );
};
