
/* =========================================
   VARIABLES GLOBALES Y CONTADORES
   ========================================= */
let mainPointCount = 0;
let subPointCount = 0;
let savedSelection = null; 

const toolbar = document.getElementById("floating-toolbar");
const hammer = document.getElementById("hammer-icon");
const leftRibbon = document.getElementById("left-ribbon");
const rightRibbon = document.getElementById("right-ribbon");

/* =========================================
   SISTEMA DE ARRASTRE CON EFECTO IMÁN
   ========================================= */
function makeDraggable(el) {
    let p1 = 0, p2 = 0, p3 = 0, p4 = 0;
    const handles = el.querySelectorAll('#hammer-icon, .side-tab');

    handles.forEach(handle => {
        handle.onmousedown = dragStart;
        handle.ontouchstart = dragStart;
    });

    function dragStart(e) {
        el.style.transition = "none"; 
        el.classList.remove("toolbar-docked"); 
        
        p3 = e.clientX || (e.touches ? e.touches[0].clientX : 0);
        p4 = e.clientY || (e.touches ? e.touches[0].clientY : 0);
        
        document.onmouseup = stopDrag;
        document.ontouchend = stopDrag;
        document.onmousemove = move;
        document.ontouchmove = move;
    }

    function move(e) {
        let cx = e.clientX || (e.touches ? e.touches[0].clientX : 0);
        let cy = e.clientY || (e.touches ? e.touches[0].clientY : 0);
        
        p1 = p3 - cx; 
        p2 = p4 - cy; 
        p3 = cx; 
        p4 = cy;
        
        el.style.top = (el.offsetTop - p2) + "px";
        el.style.left = (el.offsetLeft - p1) + "px";
    }

    function stopDrag() {
        document.onmouseup = null; 
        document.ontouchend = null;
        document.onmousemove = null; 
        document.ontouchmove = null;
        applyMagneticEffect(el);
    }
}

function applyMagneticEffect(el) {
    el.style.transition = "all 0.3s ease"; 
    const gap = 20; 
    const rect = el.getBoundingClientRect();
    
    if (rect.left < gap) {
        el.style.left = "0px";
        el.classList.add("toolbar-docked");
    } else if (window.innerWidth - rect.right < gap) {
        el.style.left = (window.innerWidth - rect.width) + "px";
        el.classList.add("toolbar-docked");
    }

    if (rect.top < gap) {
        el.style.top = "0px";
    } else if (window.innerHeight - rect.bottom < gap) {
        el.style.top = (window.innerHeight - rect.height) + "px";
    }
}

if(toolbar) makeDraggable(toolbar);

/* =========================================
   GESTIÓN DE SELECCIÓN (MEJORADA)
   ========================================= */
function saveSelection() {
    const sel = window.getSelection();
    if (sel.rangeCount > 0) {
        savedSelection = sel.getRangeAt(0).cloneRange();
    }
}

function restoreSelection() {
    if (savedSelection) {
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(savedSelection);
    }
}

document.addEventListener("selectionchange", () => {
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.isContentEditable || activeEl.closest('[contenteditable="true"]'))) {
        saveSelection();
    }
    updateButtonStates();
});

/* =========================================
   FORMATO DE TEXTO Y COLOR (MEJORADO)
   ========================================= */
function execCmd(command, event, value = null) {
    if (event && event.preventDefault && command !== 'foreColor') {
        event.preventDefault();
    }
    
    restoreSelection();

    if (command === 'foreColor') {
        const colorPicker = document.getElementById('fontColor');
        value = value || (colorPicker ? colorPicker.value : "#000000");
    }

    document.execCommand(command, false, value);
    
    updateButtonStates();
    saveData();
    // MEJORA: Guardado instantáneo para que el botón "Deshacer" funcione con el formato
    saveHistory(); 
    
    if (command === 'foreColor' || command === 'hiliteColor') {
        setTimeout(restoreSelection, 10);
    }
}

// NUEVA MEJORA: Limpiar formato del texto seleccionado
function clearFormatting(event) {
    if (event) event.preventDefault();
    restoreSelection();
    document.execCommand('removeFormat', false, null);
    // También quitamos colores de fondo manualmente si los hay
    document.execCommand('hiliteColor', false, 'transparent');
    saveData();
    saveHistory();
}

function updateButtonStates() {
    const commands = ['bold', 'italic', 'underline'];
    commands.forEach(cmd => {
        const btn = document.getElementById('btn-' + cmd);
        if (btn) {
            btn.style.backgroundColor = document.queryCommandState(cmd) ? "#e2e8f0" : "";
        }
    });

    const highlightBtn = document.getElementById('btn-highlight');
    if (highlightBtn) {
        const isHighlighted = document.queryCommandValue('hiliteColor') !== 'rgba(0, 0, 0, 0)' 
                           && document.queryCommandValue('hiliteColor') !== 'transparent';
        highlightBtn.style.backgroundColor = isHighlighted ? "#ffffb0" : "";
    }
}

/* =========================================
   SISTEMA NOCTURNO (MODO OSCURO)
   ========================================= */
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('studio_dark_mode', isDark);
}

/* =========================================
   DESPLIEGUE DE ALAS EXCLUSIVO
   ========================================= */
function toggleRibbon(side) {
    toolbar.classList.remove("toolbar-docked"); 
    if (side === 'left') {
        leftRibbon.classList.toggle('hidden');
        rightRibbon.classList.add('hidden');
    } else {
        rightRibbon.classList.toggle('hidden');
        leftRibbon.classList.add('hidden');
    }
}

hammer.addEventListener('click', () => {
    toolbar.classList.remove("toolbar-docked");
    if (leftRibbon.classList.contains('hidden') && rightRibbon.classList.contains('hidden')) {
        leftRibbon.classList.remove('hidden');
    } else {
        leftRibbon.classList.add('hidden');
        rightRibbon.classList.add('hidden');
    }
});

/* =========================================
   ESTRUCTURA DEL BOSQUEJO
   ========================================= */
function toRoman(num) {
    const romans = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
    return romans[num] || num;
}

function addSection(label, color) {
    const container = document.getElementById('sections-container');
    const div = document.createElement('div');
    div.className = 'section-block';
    div.style.borderTop = `3px solid ${color}`;
    div.innerHTML = `
        <div class="label" style="color: ${color}; font-weight:bold; margin-bottom:5px;">${label}</div>
        <div class="editable" contenteditable="true" data-placeholder="Escriba aquí..." oninput="saveData()"></div>
    `;
    container.appendChild(div);
    saveData();
    saveHistory(); 
    setTimeout(() => div.querySelector('.editable').focus(), 10);
}

function addScripture() {
    const container = document.getElementById('sections-container');
    const div = document.createElement('div');
    div.className = 'scripture-block';
    div.innerHTML = `
        <span class="editable scripture-text" contenteditable="true" data-placeholder="«Cita bíblica...»" oninput="saveData()"></span>
        <span class="editable scripture-ref" contenteditable="true" data-placeholder="— Referencia" oninput="saveData()"></span>
    `;
    container.appendChild(div);
    saveData();
    saveHistory();
    setTimeout(() => div.querySelector('.scripture-text').focus(), 10);
}

function addPurpose(type) {
    if (!type) return;
    const descriptions = {
        "Evangelístico": "Presentar a Cristo como Salvador y persuadir a los perdidos a aceptarlo.",
        "Aliento (Consuelo)": "Fortalecer la fe del creyente en pruebas, recordando la presencia de Dios.",
        "Doctrinal (Didáctico)": "Enseñar verdades bíblicas, su significado y aplicación práctica.",
        "Devocional": "Intensificar el amor y la adoración hacia Dios y la reverencia.",
        "Consagración": "Motivar a dedicar talentos, tiempo e influencia al servicio de Dios.",
        "Ético-Moral": "Ayudar a normar la conducta diaria y relaciones sociales según principios."
    };
    const container = document.getElementById('sections-container');
    const div = document.createElement('div');
    div.className = 'section-block';
    div.style.borderTop = `3px solid #9b59b6`;
    div.innerHTML = `
        <div class="label" style="color: #9b59b6; font-weight:bold;">Propósito: ${type}</div>
        <div class="editable" contenteditable="true" oninput="saveData()"><i>${descriptions[type]}</i><br></div>
    `;
    container.appendChild(div);
    saveData();
    saveHistory();
    setTimeout(() => div.querySelector('.editable').focus(), 10);
}

function addMainPoint() {
    mainPointCount++;
    subPointCount = 0;
    addSection(`Punto Principal ${toRoman(mainPointCount)}`, "#1e293b");
}

function addSubPoint() {
    subPointCount++;
    const container = document.getElementById('sections-container');
    const div = document.createElement('div');
    div.className = 'sub-point-container';
    div.style.marginLeft = "30px";
    div.style.marginTop = "10px";
    const letter = String.fromCharCode(64 + subPointCount); 
    div.innerHTML = `
        <span style="font-weight:bold; color:#64748b;">${letter}. </span>
        <span class="editable" contenteditable="true" data-placeholder="Subpunto..." oninput="saveData()" style="display:inline-block; width:85%; border-bottom: 1px dashed #e2e8f0;"></span>
    `;
    container.appendChild(div);
    saveData();
    saveHistory();
    setTimeout(() => div.querySelector('.editable').focus(), 10);
}

/* =========================================
   BARRA DE PROGRESO DE PÁGINA
   ========================================= */
function updatePageProgress() {
    const paper = document.getElementById('paper');
    const bar = document.getElementById('page-progress-bar');
    const text = document.getElementById('page-progress-text');
    if (!paper || !bar) return;

    const a4HeightPx = 1122; 
    const currentHeight = paper.scrollHeight;
    let percentage = Math.round((currentHeight / a4HeightPx) * 100);
    
    bar.style.width = (percentage > 100 ? 100 : percentage) + "%";
    text.innerText = `Espacio: ${percentage}%`;
    bar.style.background = percentage > 95 ? "#ef4444" : "linear-gradient(90deg, #004a99, #f1c40f)";
}

/* =========================================
   LOCAL STORAGE Y PDF (MEJORADO)
   ========================================= */
function saveData() {
    const title = document.getElementById('main-title');
    const author = document.getElementById('author-name'); 
    const container = document.getElementById('sections-container');
    if (!title || !container) return;
    
    const data = {
        title: title.innerHTML,
        author: author ? author.innerHTML : "", 
        content: container.innerHTML,
        mCount: mainPointCount,
        sCount: subPointCount
    };
    localStorage.setItem('bosquejo_data_v2', JSON.stringify(data));
    updatePageProgress(); 
}

window.onload = () => {
    const saved = localStorage.getItem('bosquejo_data_v2');
    if (saved) {
        const data = JSON.parse(saved);
        if(document.getElementById('main-title')) document.getElementById('main-title').innerHTML = data.title || "";
        if(document.getElementById('author-name')) document.getElementById('author-name').innerHTML = data.author || "";
        if(document.getElementById('sections-container')) document.getElementById('sections-container').innerHTML = data.content || "";
        mainPointCount = data.mCount || 0;
        subPointCount = data.sCount || 0;
    }
    
    // Cargar preferencia de modo oscuro
    if (localStorage.getItem('studio_dark_mode') === 'true') {
        document.body.classList.add('dark-mode');
    }

    initHistorySystem();
    updatePageProgress();
};

function clearData() {
    if (confirm("¿Borrar todo el progreso?")) {
        localStorage.removeItem('bosquejo_data_v2');
        location.reload();
    }
}

const pdfOptions = {
    margin: [10, 10, 20, 10], 
    filename: 'Bosquejo_MMM_Studio.pdf',
    image: { type: 'jpeg', quality: 1 },
    html2canvas: { scale: 2, useCORS: true, letterRendering: true, logging: false, scrollY: 0 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true, precision: 16 }
};

function applyFooter(pdf) {
    const totalPages = pdf.internal.getNumberOfPages();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const fecha = new Date().toLocaleDateString();

    for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setDrawColor(0, 74, 153); 
        pdf.setLineWidth(0.5);
        pdf.line(10, pageHeight - 18, pageWidth - 10, pageHeight - 18);
        pdf.setFontSize(8);
        pdf.setTextColor(120);
        pdf.text('Movimiento Misionero Mundial • ' + fecha, 10, pageHeight - 12);
        pdf.text('Página ' + i + ' de ' + totalPages, pageWidth - 10, pageHeight - 12, { align: "right" });
    }
    return pdf;
}

function generatePDF() {
    // IMPORTANTE: Quitar modo oscuro antes de exportar
    const wasDark = document.body.classList.contains('dark-mode');
    if(wasDark) document.body.classList.remove('dark-mode');

    const element = document.getElementById('paper');
    showLoading(true);
    html2pdf().set(pdfOptions).from(element).toPdf().get('pdf').then(function (pdf) {
        applyFooter(pdf).save();
        showLoading(false);
        if(wasDark) document.body.classList.add('dark-mode'); // Restaurar
    });
}

function previewPDF() {
    const wasDark = document.body.classList.contains('dark-mode');
    if(wasDark) document.body.classList.remove('dark-mode');

    const element = document.getElementById('paper');
    showLoading(true);
    html2pdf().set(pdfOptions).from(element).toPdf().get('pdf').then(function (pdf) {
        applyFooter(pdf);
        const blob = pdf.output('bloburl');
        window.open(blob, '_blank');
        showLoading(false);
        if(wasDark) document.body.classList.add('dark-mode');
    });
}

function showLoading(status) {
    let loader = document.getElementById('pdf-loader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'pdf-loader';
        loader.innerHTML = '<div style="position:fixed; top:20px; right:20px; background:#004a99; color:white; padding:10px 20px; border-radius:50px; font-family:sans-serif; z-index:9999; box-shadow:0 4px 15px rgba(0,0,0,0.2);">Generando documento...</div>';
        document.body.appendChild(loader);
    }
    loader.style.display = status ? 'block' : 'none';
}

/* =========================================
   SISTEMA DE HISTORIAL (UNDO/REDO) MEJORADO
   ========================================= */
let undoStack = [];
let redoStack = [];
let isRestoring = false;

function saveHistory() {
    if (isRestoring) return;
    const paper = document.getElementById('paper');
    if (!paper) return;
    const currentHTML = paper.innerHTML;
    
    if (undoStack.length === 0 || undoStack[undoStack.length - 1] !== currentHTML) {
        undoStack.push(currentHTML);
        if (undoStack.length > 60) undoStack.shift(); // Aumentado a 60 pasos
        redoStack = []; 
    }
    updatePageProgress(); 
}

function historyUndo(e) {
    if (e) e.preventDefault();
    if (undoStack.length > 1) {
        isRestoring = true;
        redoStack.push(undoStack.pop());
        const targetState = undoStack[undoStack.length - 1];
        document.getElementById('paper').innerHTML = targetState;
        saveData();
        isRestoring = false;
    }
}

function historyRedo(e) {
    if (e) e.preventDefault();
    if (redoStack.length > 0) {
        isRestoring = true;
        const nextState = redoStack.pop();
        undoStack.push(nextState);
        document.getElementById('paper').innerHTML = nextState;
        saveData();
        isRestoring = false;
    }
}

// ATAJOS DE TECLADO MEJORADOS
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === 'z') historyUndo(e);
        if (e.key.toLowerCase() === 'y') historyRedo(e);
    }
});

function initHistorySystem() {
    const targetNode = document.getElementById('paper');
    if (!targetNode) return;
    
    saveHistory(); // Guardar estado inicial

    const observer = new MutationObserver(() => {
        // Debounce: espera 400ms después de escribir para guardar el historial
        clearTimeout(window.hTimer);
        window.hTimer = setTimeout(saveHistory, 400);
    });
    
    observer.observe(targetNode, { childList: true, subtree: true, characterData: true });
}

function addPageBreak() {
    const container = document.getElementById('sections-container');
    const hr = document.createElement('div');
    hr.className = 'page-break-indicator no-print';
    hr.innerHTML = '<span>--- SALTO DE PÁGINA ---</span>';
    
    const breaker = document.createElement('div');
    breaker.className = 'html2pdf__page-break'; 
    
    container.appendChild(hr);
    container.appendChild(breaker);
    saveData();
    saveHistory(); // Guardado para poder deshacer el salto
}

/* =========================================
   SISTEMA NOCTURNO (MODO OSCURO)
   ========================================= */
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    
    // Guardamos la preferencia para que no se pierda al recargar
    localStorage.setItem('studio_dark_mode', isDark);
    
    // Cambiamos el icono del botón según el estado
    const btn = document.getElementById('btn-dark-mode');
    if (btn) btn.innerHTML = isDark ? "☀️" : "🌙";
}

/* =========================================
   LIMPIAR FORMATO (EL ÚLTIMO BOTÓN)
   ========================================= */
function clearFormatting(event) {
    if (event) event.preventDefault();
    restoreSelection();
    
    // Comando nativo para quitar negritas, cursivas, etc.
    document.execCommand('removeFormat', false, null);
    
    // Limpieza extra para colores de resaltado que a veces persisten
    document.execCommand('hiliteColor', false, 'transparent');
    
    saveData();
    saveHistory();
}

// Cargar preferencia al iniciar (añade esto dentro de window.onload)
// localStorage.getItem('studio_dark_mode') === 'true' ? toggleDarkMode() : null;
