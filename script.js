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
    saveHistory(); 
    
    // Devolver el foco al papel después de aplicar color
    if (command === 'foreColor') {
        setTimeout(restoreSelection, 10);
    }
}

function updateButtonStates() {
    const commands = ['bold', 'italic', 'underline'];
    commands.forEach(cmd => {
        const btn = document.getElementById('btn-' + cmd);
        if (btn) {
            btn.style.backgroundColor = document.queryCommandState(cmd) ? "#e2e8f0" : "";
        }
    });
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
   LOCAL STORAGE Y PDF (MEJORADO PARA TEXTO COPIABLE)
   ========================================= */
function saveData() {
    const title = document.getElementById('main-title');
    const container = document.getElementById('sections-container');
    if (!title || !container) return;
    const data = {
        title: title.innerHTML,
        content: container.innerHTML,
        mCount: mainPointCount,
        sCount: subPointCount
    };
    localStorage.setItem('bosquejo_data_v2', JSON.stringify(data));
}

window.onload = () => {
    const saved = localStorage.getItem('bosquejo_data_v2');
    if (saved) {
        const data = JSON.parse(saved);
        if(document.getElementById('main-title')) document.getElementById('main-title').innerHTML = data.title || "";
        if(document.getElementById('sections-container')) document.getElementById('sections-container').innerHTML = data.content || "";
        mainPointCount = data.mCount || 0;
        subPointCount = data.sCount || 0;
    }
    initHistorySystem();
};

function clearData() {
    if (confirm("¿Borrar todo el progreso?")) {
        localStorage.removeItem('bosquejo_data_v2');
        location.reload();
    }
}

const pdfOptions = {
    margin: [15, 15, 25, 15], 
    filename: 'Bosquejo_MMM_Studio.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
        scale: 2, 
        useCORS: true, 
        letterRendering: true, // TRUE para forzar la separación de texto y hacerlo copiable
        logging: false 
    },
    jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait', 
        compress: true 
    }
};

function applyFooter(pdf) {
    const totalPages = pdf.internal.getNumberOfPages();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const fecha = new Date().toLocaleDateString();

    for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setDrawColor(0, 74, 153); 
        pdf.setLineWidth(0.4);
        pdf.line(15, pageHeight - 18, pageWidth - 15, pageHeight - 18);
        pdf.setFontSize(8);
        pdf.setTextColor(100);
        pdf.text('Movimiento Misionero Mundial • ' + fecha, 15, pageHeight - 12);
        pdf.text('Página ' + i + ' de ' + totalPages, pageWidth - 15, pageHeight - 12, { align: "right" });
    }
    return pdf;
}

function generatePDF() {
    const element = document.getElementById('paper');
    showLoading(true);
    html2pdf().set(pdfOptions).from(element).toPdf().get('pdf').then(function (pdf) {
        applyFooter(pdf).save();
        showLoading(false);
    });
}

function previewPDF() {
    const element = document.getElementById('paper');
    showLoading(true);
    html2pdf().set(pdfOptions).from(element).toPdf().get('pdf').then(function (pdf) {
        applyFooter(pdf);
        const blob = pdf.output('bloburl');
        window.open(blob, '_blank');
        showLoading(false);
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
   SISTEMA DE HISTORIAL (UNDO/REDO)
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
        if (undoStack.length > 40) undoStack.shift();
        redoStack = []; 
    }
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

function initHistorySystem() {
    const targetNode = document.getElementById('paper');
    if (!targetNode) return;
    const observer = new MutationObserver(() => saveHistory());
    observer.observe(targetNode, { childList: true, subtree: true, characterData: true });
    saveHistory();
}
