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
        el.style.transition = "none"; // Quitamos transición durante el arrastre
        el.classList.remove("toolbar-docked"); // Quitamos transparencia al mover
        
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
    el.style.transition = "all 0.3s ease"; // Suavizamos el golpe del imán
    const gap = 20; // Distancia para que se active el imán
    const rect = el.getBoundingClientRect();
    
    // Imán horizontal
    if (rect.left < gap) {
        el.style.left = "0px";
        el.classList.add("toolbar-docked");
    } else if (window.innerWidth - rect.right < gap) {
        el.style.left = (window.innerWidth - rect.width) + "px";
        el.classList.add("toolbar-docked");
    }

    // Imán vertical
    if (rect.top < gap) {
        el.style.top = "0px";
    } else if (window.innerHeight - rect.bottom < gap) {
        el.style.top = (window.innerHeight - rect.height) + "px";
    }
}

if(toolbar) makeDraggable(toolbar);

/* =========================================
   GESTIÓN DE SELECCIÓN
   ========================================= */
function saveSelection() {
    const sel = window.getSelection();
    if (sel.rangeCount > 0) savedSelection = sel.getRangeAt(0);
}

function restoreSelection() {
    if (savedSelection) {
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(savedSelection);
    }
}

document.addEventListener("selectionchange", () => {
    if (document.activeElement && document.activeElement.isContentEditable) saveSelection();
    updateButtonStates();
});

/* =========================================
   FORMATO DE TEXTO Y COLOR
   ========================================= */
function execCmd(command, event, value = null) {
    if (event && event.preventDefault && command !== 'foreColor') event.preventDefault();
    restoreSelection();
    if (command === 'foreColor') {
        const colorPicker = document.getElementById('fontColor');
        value = value || (colorPicker ? colorPicker.value : "#000000");
    }
    document.execCommand(command, false, value);
    updateButtonStates();
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
}

/* =========================================
   DESPLIEGUE DE ALAS EXCLUSIVO
   ========================================= */
function toggleRibbon(side) {
    toolbar.classList.remove("toolbar-docked"); // Se ilumina al interactuar
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
   LOCAL STORAGE Y PDF
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
        document.getElementById('main-title').innerHTML = data.title || "";
        document.getElementById('sections-container').innerHTML = data.content || "";
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

// MEJORA: PDF con Footer editable, Fecha y Páginas
function generatePDF() {
    const element = document.getElementById('paper');
    const fecha = new Date().toLocaleDateString();
    
    // Obtener el nombre de la organización si existe en el título o pedir uno
    let orgName = "Movimiento Misionero Mundial"; 
    
    const opt = {
        margin: [10, 10, 25, 10], 
        filename: 'Bosquejo_MMM_Studio.pdf',
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { 
            scale: 2, 
            useCORS: true, 
            letterRendering: true, 
            logging: false 
        },
        jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait', 
            compress: true 
        }
    };

    html2pdf().set(opt).from(element).toPdf().get('pdf').then(function (pdf) {
        const totalPages = pdf.internal.getNumberOfPages();
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            
            // Línea estética sobre el pie de página (Azul MMM)
            pdf.setDrawColor(0, 74, 153); 
            pdf.setLineWidth(0.4);
            pdf.line(10, pageHeight - 18, pageWidth - 10, pageHeight - 18);

            pdf.setFontSize(8);
            pdf.setTextColor(100);

            // Izquierda: Organización y Fecha
            pdf.text(orgName + ' • ' + fecha, 10, pageHeight - 12);
            
            // Centro: Nombre del sistema
            pdf.setFont("helvetica", "italic");
            pdf.text('MMM Studio Edition 2025', pageWidth / 2, pageHeight - 12, { align: "center" });
            
            // Derecha: Numeración
            pdf.setFont("helvetica", "normal");
            pdf.text('Página ' + i + ' de ' + totalPages, pageWidth - 10, pageHeight - 12, { align: "right" });

            // Lema final del Salmo
            pdf.setFontSize(7);
            pdf.setTextColor(150);
            pdf.text('"Tu palabra es una lámpara a mis pies..." Salmo 119:105', pageWidth / 2, pageHeight - 8, { align: "center" });
        }
    }).save();
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
