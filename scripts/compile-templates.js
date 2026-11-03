const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const viewsDir = path.join(rootDir, 'views');
const targetFile = path.join(rootDir, 'src', 'components', 'ComponentLoader.js');

const templates = {};

// 1. Layout & Main mounts
templates['mount-login-modal'] = fs.readFileSync(path.join(viewsDir, 'modals', 'login-modal.html'), 'utf8');
templates['mount-header'] = fs.readFileSync(path.join(viewsDir, 'layout', 'header.html'), 'utf8');
templates['mount-date-bar'] = fs.readFileSync(path.join(viewsDir, 'layout', 'date-bar.html'), 'utf8');
templates['mount-filter-toolbar'] = fs.readFileSync(path.join(viewsDir, 'layout', 'filter-toolbar.html'), 'utf8');
templates['mount-main-workspace'] = fs.readFileSync(path.join(viewsDir, 'main', 'main-workspace.html'), 'utf8');

// 2. Modals mount (all other modals combined into mount-modals)
const modalsDir = path.join(viewsDir, 'modals');
const modalFiles = fs.readdirSync(modalsDir);

let combinedModals = '';
modalFiles.forEach(file => {
  if (file === 'login-modal.html' || !file.endsWith('.html')) return;
  const content = fs.readFileSync(path.join(modalsDir, file), 'utf8');
  combinedModals += content + '\n';
});

templates['mount-modals'] = combinedModals;

const outputJs = `/* ==========================================================================
   HOTEL NORTE — CARGADOR Y MONTADOR DE COMPONENTES DE VISTA (TEMPLATES EMBEBIDOS)
   Archivo: src/components/ComponentLoader.js
   Permite ejecución offline y en GitHub Pages sin dependencias de red o servidor.
   ========================================================================== */

const ComponentLoader = {
  templates: ${JSON.stringify(templates, null, 2)},

  mount(id, html) {
    const el = document.getElementById(id);
    if (el) {
      el.innerHTML = html;
    }
  },

  mountAll() {
    for (const [id, html] of Object.entries(this.templates)) {
      this.mount(id, html);
    }
  }
};
`;

fs.writeFileSync(targetFile, outputJs, 'utf8');
console.log('ComponentLoader.js generated successfully with clean UTF-8.');
