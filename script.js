// Global Variables
const toleranceTable = {
    'A': 0.0005, 'B': 0.001, 'C': 0.0025, 'D': 0.005, 'E': 0.005,
    'F': 0.01, 'G': 0.02, 'H': 0.03, 'J': 0.05, 'K': 0.10,
    'L': 0.15, 'M': 0.20, 'N': 0.30, 'P': 1.00, 'S': 0.50,
    'W': 2.00, 'X': 0.40, 'Z': 0.80
};

let resistorPrecision = 2;
let capacitorPrecision = 2;

// --- Precision Controls ---
document.getElementById('resistorPrecision').addEventListener('input', function () {
    resistorPrecision = parseInt(this.value);
    document.getElementById('resistorDecimalValue').textContent = resistorPrecision;
    calculateResistor();
    updateAllTableRows();
});

document.getElementById('capacitorPrecision').addEventListener('input', function () {
    capacitorPrecision = parseInt(this.value);
    document.getElementById('capacitorDecimalValue').textContent = capacitorPrecision;
    calculateCapacitor();
    updateAllTableRows();
});

// --- Save & Load ---
function saveValues() {
    const data = {
        resistorValue: document.getElementById('resistorValue').value,
        resistorType: document.getElementById('resistorType').value,
        resistorTolerance: document.getElementById('resistorTolerance').value,
        capacitorCode: document.getElementById('capacitorCode').value,
        capacitorType: document.getElementById('capacitorType').value,
        capacitorTolerance: document.getElementById('capacitorTolerance').value,
        resistorPrecision,
        capacitorPrecision,
        darkMode: document.body.classList.contains('dark-mode')
    };
    localStorage.setItem('calculatorData', JSON.stringify(data));
}

function loadValues() {
    const saved = JSON.parse(localStorage.getItem('calculatorData'));
    if (saved) {
        document.getElementById('resistorValue').value = saved.resistorValue || '';
        document.getElementById('resistorType').value = saved.resistorType || 'Ω';
        document.getElementById('resistorTolerance').value = saved.resistorTolerance || 'F';
        document.getElementById('capacitorCode').value = saved.capacitorCode || '';
        document.getElementById('capacitorType').value = saved.capacitorType || 'pF';
        document.getElementById('capacitorTolerance').value = saved.capacitorTolerance || 'F';
        if (saved.resistorPrecision !== undefined) {
            resistorPrecision = saved.resistorPrecision;
            document.getElementById('resistorPrecision').value = resistorPrecision;
            document.getElementById('resistorDecimalValue').textContent = resistorPrecision;
        }
        if (saved.capacitorPrecision !== undefined) {
            capacitorPrecision = saved.capacitorPrecision;
            document.getElementById('capacitorPrecision').value = capacitorPrecision;
            document.getElementById('capacitorDecimalValue').textContent = capacitorPrecision;
        }
        if (saved.darkMode) {
            document.body.classList.add('dark-mode');
        }
    }
}

// --- Unit Parsers ---
function parseResistorValue(value, type) {
    const num = parseFloat(value);
    if (isNaN(num)) return NaN;
    switch (type) {
        case 'Ω': return num;
        case 'mΩ': return num / 1000;
        case 'KΩ': return num * 1000;
        case 'MΩ': return num * 1e6;
        default: return NaN;
    }
}

function parseCapacitorValue(codeOrValue) {
    const str = codeOrValue.toString().trim();
    if (/^\d{3}$/.test(str)) {
        const firstTwo = parseInt(str.substring(0, 2));
        const multiplier = Math.pow(10, parseInt(str.charAt(2)));
        return firstTwo * multiplier; // in pF
    }
    const num = parseFloat(str);
    return isNaN(num) ? NaN : num;
}

function convertCapacitorValue(valuePF, targetType) {
    switch (targetType) {
        case 'pF': return valuePF;
        case 'nF': return valuePF / 1e3;
        case 'µF': return valuePF / 1e6;
        default: return NaN;
    }
}

// --- Resistor Logic ---
function calculateResistor() {
    const value = document.getElementById('resistorValue').value;
    const type = document.getElementById('resistorType').value;
    const toleranceCode = document.getElementById('resistorTolerance').value;
    const baseValue = parseResistorValue(value, type);
    const tolerance = toleranceTable[toleranceCode];

    if (isNaN(baseValue) || tolerance === undefined) {
        document.getElementById('resistorMinValue').textContent = '';
        document.getElementById('resistorMaxValue').textContent = '';
        return;
    }

    const min = baseValue * (1 - tolerance);
    const max = baseValue * (1 + tolerance);
    let displayMin = min, displayMax = max, unit = 'Ω';

    if (min >= 1e6) {
        displayMin = min / 1e6;
        displayMax = max / 1e6;
        unit = 'MΩ';
    } else if (min >= 1e3) {
        displayMin = min / 1e3;
        displayMax = max / 1e3;
        unit = 'KΩ';
    }

    document.getElementById('resistorMinValue').textContent = `${displayMin.toFixed(resistorPrecision)} ${unit}`;
    document.getElementById('resistorMaxValue').textContent = `${displayMax.toFixed(resistorPrecision)} ${unit}`;
    saveValues();
}

// --- Capacitor Logic (Fixed Unit Only) ---
function calculateCapacitor() {
    const code = document.getElementById('capacitorCode').value;
    const type = document.getElementById('capacitorType').value;
    const toleranceCode = document.getElementById('capacitorTolerance').value;

    const baseValueInPF = parseCapacitorValue(code);
    const baseValue = convertCapacitorValue(baseValueInPF, type);
    const tolerance = toleranceTable[toleranceCode];

    if (isNaN(baseValue) || tolerance === undefined) {
        document.getElementById('capacitorMinValue').innerHTML = '';
        document.getElementById('capacitorMaxValue').innerHTML = '';
        return;
    }

    const min = baseValue * (1 - tolerance);
    const max = baseValue * (1 + tolerance);

    document.getElementById('capacitorMinValue').innerHTML = `Min Value: ${min.toFixed(capacitorPrecision)} ${type}<br>`;
    document.getElementById('capacitorMaxValue').innerHTML = `Max Value: ${max.toFixed(capacitorPrecision)} ${type}`;
    saveValues();
}

// --- Table Handling ---
function addRow() {
    const table = document.querySelector('#partsTable tbody');
    const row = table.insertRow();

    const partCell = row.insertCell(0);
    const partInput = document.createElement('input');
    partInput.type = 'text';
    partInput.className = 'form-control';
    partInput.placeholder = 'Enter Part Number';
    partInput.addEventListener('input', () => updateRow(row));
    partCell.appendChild(partInput);

    const minCell = row.insertCell(1);
    minCell.className = 'min-value';
    minCell.textContent = '-';

    const maxCell = row.insertCell(2);
    maxCell.className = 'max-value';
    maxCell.textContent = '-';
}

function updateRow(row) {
    const code = row.querySelector('input').value.trim();
    const minCell = row.querySelector('.min-value');
    const maxCell = row.querySelector('.max-value');

    const valueInPF = parseCapacitorValue(code);
    if (isNaN(valueInPF)) {
        minCell.textContent = 'Invalid';
        maxCell.textContent = 'Invalid';
        return;
    }

    const tolerance = toleranceTable['F']; // Default to ±1%
    const min = valueInPF * (1 - tolerance);
    const max = valueInPF * (1 + tolerance);

    // Display fixed unit (pF only in table)
    minCell.textContent = `${min.toFixed(capacitorPrecision)} pF`;
    maxCell.textContent = `${max.toFixed(capacitorPrecision)} pF`;
}

function updateAllTableRows() {
    document.querySelectorAll('#partsTable tbody tr').forEach(row => updateRow(row));
}

// --- Dark Mode ---
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    saveValues();
}

// --- On Load ---
window.onload = function () {
    loadValues();
    calculateResistor();
    calculateCapacitor();

    document.getElementById('resistorValue').addEventListener('input', calculateResistor);
    document.getElementById('resistorType').addEventListener('change', calculateResistor);
    document.getElementById('resistorTolerance').addEventListener('change', calculateResistor);

    document.getElementById('capacitorCode').addEventListener('input', calculateCapacitor);
    document.getElementById('capacitorType').addEventListener('change', calculateCapacitor);
    document.getElementById('capacitorTolerance').addEventListener('change', calculateCapacitor);

    addRow();
};
