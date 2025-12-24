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
   SISTEMA DE ARRASTRE (Optimizado para Móvil)
   ========================================= */
function makeDraggable(el, handle) {
    let p1 = 0, p2 = 0, p3 = 0, p4 = 0;
    handle.onmousedown = dragStart;
    handle.ontouchstart = dragStart;

    function dragStart(e) {
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
        p1 = p3 - cx; p2 = p4 - cy; p3 = cx; p4 = cy;
        el.style.top = (el.offsetTop - p2) + "px";
        el.style.left = (el.offsetLeft - p1) + "px";
    }

    function stopDrag() {
        document.onmouseup = null; document.ontouchend = null;
        document.onmousemove = null; document.ontouchmove = null;
    }
}
if(toolbar && hammer) makeDraggable(toolbar, hammer);

/* =========================================
   GESTIÓN DE SELECCIÓN (El Secreto del Color)
   ========================================= */
function saveSelection() {
    const sel = window.getSelection();
    if (sel.rangeCount > 0) {
        savedSelection = sel.getRangeAt(0);
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
    if (document.activeElement && document.activeElement.isContentEditable) {
        saveSelection();
    }
    updateButtonStates();
});

/* =========================================
   FORMATO DE TEXTO Y COLOR
   ========================================= */
function execCmd(command, event, value = null) {
    if (event && event.preventDefault && command !== 'foreColor') {
        event.preventDefault();
    }
    
    restoreSelection();

    if (command === 'foreColor') {
        // Si no se pasa valor, lo toma del input
        const colorPicker = document.getElementById('fontColor');
        value = value || (colorPicker ? colorPicker.value : "#000000");
    }

    document.execCommand(command, false, value);
    updateButtonStates();
    saveData();
}

function updateButtonStates() {
    const commands = ['bold', 'italic', 'underline'];
    commands.forEach(cmd => {
        const btn = document.getElementById('btn-' + cmd);
        if (btn) {
            if (document.queryCommandState(cmd)) {
                btn.classList.add('active-tool');
                btn.style.backgroundColor = "#e2e8f0"; // Feedback visual
            } else {
                btn.classList.remove('active-tool');
                btn.style.backgroundColor = "";
            }
        }
    });
}

/* =========================================
   DESPLIEGUE DE ALAS EXCLUSIVO
   ========================================= */
function toggleRibbon(side) {
    if (side === 'left') {
        leftRibbon.classList.toggle('hidden');
        rightRibbon.classList.add('hidden');
    } else {
        rightRibbon.classList.toggle('hidden');
        leftRibbon.classList.add('hidden');
    }
}

hammer.addEventListener('click', () => {
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
        <div class="editable" contenteditable="true" oninput="saveData()">
            <i>${descriptions[type]}</i><br>
        </div>
    `;
    
    container.appendChild(div);
    saveData();
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
    
    const letter = String.fromCharCode(64 + subPointCount); // A, B, C...
    div.innerHTML = `
        <span style="font-weight:bold; color:#64748b;">${letter}. </span>
        <span class="editable" contenteditable="true" data-placeholder="Desarrolle el subpunto..." oninput="saveData()" style="display:inline-block; width:85%; border-bottom: 1px dashed #e2e8f0;"></span>
    `;
    
    container.appendChild(div);
    saveData();
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
};

function clearData() {
    if (confirm("¿Borrar todo el progreso del sermón?")) {
        localStorage.removeItem('bosquejo_data_v2');
        location.reload();
    }
}

function generatePDF() {
    // Capturamos el papel que contiene el contenido, logo y footer
    const element = document.getElementById('paper');
    
    // Ocultar cintas para el PDF
    leftRibbon.classList.add('hidden');
    rightRibbon.classList.add('hidden');

    const opt = {
        margin:       [10, 10, 15, 10], // Arriba, Izq, Abajo, Der
        filename:     'Sermon_Studio_Edition.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { 
            scale: 2, 
            useCORS: true, 
            letterRendering: true,
            scrollX: 0,
            scrollY: 0
        },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save().then(() => {
        // Opcional: mostrar herramientas de nuevo después de guardar
        console.log("PDF Generado");
    });
}
