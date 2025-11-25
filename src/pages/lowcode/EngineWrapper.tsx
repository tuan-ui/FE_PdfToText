import React, { useEffect } from 'react';

// The engine has a complex startup; we mount it into a simple div container.
const EngineWrapper: React.FC = () => {
  useEffect(() => {
    let container: HTMLDivElement | null = null;

    const bootstrap = async () => {
      try {
        // dynamic import works in browser and Vite dev
        const engineMod = await import('@alilc/lowcode-engine');
        const editorCore = await import('@alilc/lowcode-editor-core');

        // Minimal mount to avoid reference errors in examples
        container = document.createElement('div');
        container.style.height = '600px';
        container.style.border = '1px dashed #ccc';
        document.body.appendChild(container);

        const init = (editorCore && (editorCore as any).init) || null;
        if (init && typeof init === 'function') {
          try {
            init();
            // eslint-disable-next-line no-console
            console.log('lowcode editor-core initialized');
          } catch (e) {
            // eslint-disable-next-line no-console
            console.warn('lowcode init threw', e);
          }
        } else {
          // eslint-disable-next-line no-console
          console.warn('lowcode editor-core init not available');
        }

        // If engine module exposes a mount API, call it (best-effort)
        const engine = (engineMod as any).default || (engineMod as any).Engine || null;
        if (engine && typeof engine === 'function') {
          try {
            // some engine APIs require construction; this is a no-op best-effort
            new engine({ container });
            // eslint-disable-next-line no-console
            console.log('lowcode engine constructed');
          } catch (e) {
            // eslint-disable-next-line no-console
            console.warn('constructing lowcode engine failed', e);
          }
        } else {
          // eslint-disable-next-line no-console
          console.warn('lowcode engine API not found or not a constructor', engineMod);
        }
      } catch (err) {
        // dynamic import failed
        // eslint-disable-next-line no-console
        console.error('Failed to load lowcode modules dynamically', err);
      }
    };

    bootstrap();

    return () => {
      if (container && container.parentElement) container.parentElement.removeChild(container);
    };
  }, []);

  return <div></div>;
};

export default EngineWrapper;