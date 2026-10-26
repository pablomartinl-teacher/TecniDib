import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';
import { Download, Monitor, CheckCircle2, X } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'full' | 'drawer';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'compact' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  // If already running in installed standalone app mode, hide or show check badge
  if (isInstalled) {
    if (variant === 'drawer') {
      return (
        <div className="flex items-center gap-2 p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>App / APK instalada en este dispositivo</span>
        </div>
      );
    }
    return (
      <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-emerald-400/90 bg-emerald-950/40 border border-emerald-500/20 rounded">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        <span>Instalada</span>
      </span>
    );
  }

  const handleClick = () => {
    if (isInstallable) {
      install();
    } else {
      setShowModal(true);
    }
  };

  if (variant === 'drawer') {
    return (
      <>
        <button
          onClick={handleClick}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white font-semibold text-xs shadow-lg transition"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-white/20 rounded-lg">
              <Download className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="font-bold">Instalar como App / APK Móvil</div>
              <div className="text-[10px] text-sky-100 font-normal">Pantalla completa, offline y rendimiento nativo</div>
            </div>
          </div>
          <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">Instalar</span>
        </button>

        {showModal && renderInstallModal()}
      </>
    );
  }

  return (
    <>
      <button
        onClick={handleClick}
        title="Instalar VektorCAD como aplicación APK móvil o de escritorio"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-sky-200 bg-sky-950/70 hover:bg-sky-900 border border-sky-400/40 hover:border-sky-300 rounded-lg transition shadow-sm cursor-pointer"
      >
        <Download className="w-3.5 h-3.5 text-sky-300" />
        <span>Instalar APK / App</span>
      </button>

      {showModal && renderInstallModal()}
    </>
  );

  function renderInstallModal() {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
        <div className="w-full max-w-md bg-[#1a1c23] border border-[#2e323e] rounded-2xl shadow-2xl p-5 text-gray-200 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-[#2e323e]">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-sky-600/30 border border-sky-500/40 rounded-lg">
                <Monitor className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Instalar VektorCAD (App / APK)</h3>
                <p className="text-[11px] text-gray-400">Instalación nativa directa en tu móvil u ordenador</p>
              </div>
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="p-1.5 hover:bg-[#252834] rounded-lg text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4 space-y-3.5 text-xs">
            <p className="text-gray-300 text-sm">
              Puedes instalar <strong>VektorCAD</strong> directamente en tu teléfono o tableta con aspecto y rendimiento de <strong>aplicación nativa (APK / PWA)</strong>:
            </p>

            <div className="bg-[#121316] p-3.5 rounded-xl border border-sky-500/30 space-y-2">
              <div className="font-semibold text-sky-300 flex items-center gap-1.5 text-xs">
                <span>🤖 En Android (Instalación APK / WebAPK automática):</span>
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-gray-300 pl-1 leading-relaxed">
                <li>
                  Toca el menú del navegador <strong>tres puntos (⋮)</strong> en la esquina superior derecha.
                </li>
                <li>
                  Pulsa <strong>"Instalar aplicación"</strong> o <strong>"Añadir a pantalla de inicio"</strong>.
                </li>
                <li>
                  Android creará y compilará automáticamente el <strong>APK nativo</strong> en tu cajón de aplicaciones con su icono, pantalla de inicio y ventana completa sin barras.
                </li>
              </ol>
            </div>

            {isIOS && (
              <div className="bg-[#121316] p-3.5 rounded-xl border border-amber-500/30 space-y-2">
                <div className="font-semibold text-amber-300 flex items-center gap-1.5 text-xs">
                  <span>🍎 En iPhone / iPad (iOS Safari):</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-gray-300 pl-1 leading-relaxed">
                  <li>Toca el botón <strong>Compartir</strong> (icono de cuadrado con flecha hacia arriba).</li>
                  <li>Desliza hacia abajo y pulsa <strong>"Añadir a pantalla de inicio"</strong>.</li>
                  <li>Pulsa <strong>Añadir</strong> en la esquina superior derecha.</li>
                </ol>
              </div>
            )}

            <div className="bg-[#121316] p-3.5 rounded-xl border border-[#2b2f3a] space-y-2">
              <div className="font-semibold text-neutral-300 flex items-center gap-1.5 text-xs">
                <span>💻 En PC / Mac / Chromebook:</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Haz clic en el icono de <strong>Instalar</strong> en la barra de direcciones de Chrome, Edge o Brave para usarlo como software de escritorio independiente.
              </p>
            </div>

            <div className="text-[11px] text-gray-400 bg-sky-950/30 p-2.5 rounded-xl border border-sky-800/40">
              ⚡ <strong>100% Funcional sin internet:</strong> Al instalarse, almacena tus láminas en tu dispositivo, funciona sin conexión, elimina la barra del navegador y responde instantáneamente al tacto.
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs transition"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    );
  }
};
