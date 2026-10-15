import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';
import { Download, Monitor, CheckCircle2, X } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  // If already running in installed standalone app mode, hide or show check badge
  if (isInstalled) {
    return (
      <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-emerald-400/90 bg-emerald-950/40 border border-emerald-500/20 rounded">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        <span>Instalada</span>
      </span>
    );
  }

  return (
    <>
      <button
        onClick={() => {
          if (isInstallable) {
            install();
          } else {
            setShowModal(true);
          }
        }}
        title="Instalar VektorCAD como aplicación de escritorio o móvil"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-sky-300 bg-sky-950/60 hover:bg-sky-900/80 border border-sky-500/30 hover:border-sky-400/60 rounded transition shadow-sm cursor-pointer"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden md:inline">Instalar App</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-[#1a1c23] border border-[#2e323e] rounded-xl shadow-2xl p-6 text-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#2e323e]">
              <div className="flex items-center gap-2">
                <Monitor className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-semibold text-white">Instalar VektorCAD</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-[#252834] rounded text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-sm">
              <p className="text-gray-300">
                Puedes instalar <strong>VektorCAD</strong> directamente en tu ordenador o dispositivo sin descargar archivos ni usar consola:
              </p>

              {isIOS ? (
                <div className="bg-[#121316] p-3.5 rounded-lg border border-[#2b2f3a] space-y-2">
                  <div className="font-medium text-amber-300 flex items-center gap-1.5">
                    <span>En iPhone o iPad (Safari):</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-gray-300 text-xs pl-1">
                    <li>Toca el botón <strong>Compartir</strong> (icono de cuadrado con flecha hacia arriba).</li>
                    <li>Desliza hacia abajo y pulsa <strong>"Añadir a pantalla de inicio"</strong>.</li>
                    <li>Confirma pulsando <strong>Añadir</strong>.</li>
                  </ol>
                </div>
              ) : (
                <div className="bg-[#121316] p-3.5 rounded-lg border border-[#2b2f3a] space-y-2">
                  <div className="font-medium text-sky-300">
                    En Google Chrome / Microsoft Edge / Brave:
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-gray-300 text-xs pl-1">
                    <li>
                      Busca el icono de <strong>Instalar aplicación</strong> (computadora con flecha hacia abajo) en la parte derecha de la barra de direcciones del navegador.
                    </li>
                    <li>
                      O haz clic en el menú de <strong>tres puntos (⋮)</strong> &gt; <strong>Instalar VektorCAD</strong> (o <em>"Aplicaciones" &gt; "Instalar este sitio como aplicación"</em>).
                    </li>
                    <li>
                      ¡Listo! Se creará un acceso directo en tu escritorio y funcionará offline.
                    </li>
                  </ol>
                </div>
              )}

              <div className="text-xs text-gray-400 bg-[#252834]/50 p-2.5 rounded border border-[#323644]">
                ✨ <strong>Ventajas:</strong> Sin necesidad de instalar Node.js, se abre en ventana completa ultra-rápida, guarda tus láminas en tu disco y funciona sin conexión a internet.
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs transition"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
