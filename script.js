// Global variables
const toleranceTable = {
    'A': 0.0005, 'B': 0.001, 'C': 0.0025, 'D': 0.005, 'E': 0.005,
    'F': 0.01, 'G': 0.02, 'H': 0.03, 'J': 0.05, 'K': 0.10,
    'L': 0.15, 'M': 0.20, 'N': 0.30, 'P': 1.00, 'S': 0.50,
    'W': 2.00, 'X': 0.40, 'Z': 0.80
};

let resistorPrecision = 2;
let capacitorPrecision = 2;

// --- Resistor Decimal Precision Control ---
document.getElementById('resistorPrecision').addEventListener('input', function() {
    resistorPrecision = parseInt(this.value);
    document.getElementById('resistorDecimalValue').textContent = resistorPrecision;
    calculateResistor();
    updateAllTableRows();
});

// --- Capacitor Decimal Precision Control ---
document.getElementById('capacitorPrecision').addEventListener('input', function() {
    capacitorPrecision = parseInt(this.value);
    document.getElementById('capacitorDecimalValue').textContent = capacitorPrecision;
    calculateCapacitor();
    updateAllTableRows();
});

// --- Auto Save / Load values from localStorage ---
function saveValues() {
    const data = {
        resistorValue: document.getElementById('resistorValue').value,
        resistorType: document.getElementById('resistorType').value,
        resistorTolerance: document.getElementById('resistorTolerance').value,
        capacitorCode: document.getElementById('capacitorCode').value,
        capacitorType: document.getElementById('capacitorType').value,
        capacitorTolerance: document.getElementById('capacitorTolerance').value,
        resistorPrecision: resistorPrecision,
        capacitorPrecision: capacitorPrecision
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
    }
}

// --- Resistor Value Parse ---
function parseResistorValue(value, type) {
    const num = parseFloat(value);
    if (isNaN(num)) return NaN;
    if (type === 'Ω') return num;
    if (type === 'mΩ') return num / 1000;
    if (type === 'KΩ') return num * 1000;
    if (type === 'MΩ') return num * 1000000;
    return NaN;
}

// --- Capacitor Code or Real Value Parse ---
function parseCapacitorValue(codeOrValue) {
    if (!isNaN(codeOrValue)) {
        return parseFloat(codeOrValue);
    }
    if (codeOrValue.length === 3) {
        const firstTwoDigits = parseInt(codeOrValue.substring(0, 2));
        const multiplier = Math.pow(10, parseInt(codeOrValue.charAt(2)));
        return firstTwoDigits * multiplier; // in pF
    }
    return NaN;
}

// --- Capacitor Value Conversion ---
function convertCapacitorValue(valuePF, targetType) {
    if (targetType === 'pF') return valuePF;
    if (targetType === 'nF') return valuePF / 1000;
    if (targetType === 'µF') return valuePF / 1000000;
    return NaN;
}

// --- Resistor Calculation ---
function calculateResistor() {
    const value = document.getElementById('resistorValue').value;
    const type = document.getElementById('resistorType').value;
    const toleranceCode = document.getElementById('resistorTolerance').value;

    const baseValue = parseResistorValue(value, type);
    if (isNaN(baseValue)) {
        document.getElementById('resistorMinValue').textContent = '';
        document.getElementById('resistorMaxValue').textContent = '';
        return;
    }

    const tolerance = toleranceTable[toleranceCode];
    if (tolerance === undefined) {
        document.getElementById('resistorMinValue').textContent = '';
        document.getElementById('resistorMaxValue').textContent = '';
        return;
    }

    const min = baseValue * (1 - tolerance);
    const max = baseValue * (1 + tolerance);

    let displayMin = min, displayMax = max, displayUnit = "Ω";

    if (min >= 1e6) {
        displayMin = (min / 1e6).toFixed(resistorPrecision);
        displayMax = (max / 1e6).toFixed(resistorPrecision);
        displayUnit = "MΩ";
    } else if (min >= 1e3) {
        displayMin = (min / 1e3).toFixed(resistorPrecision);
        displayMax = (max / 1e3).toFixed(resistorPrecision);
        displayUnit = "KΩ";
    } else {
        displayMin = min.toFixed(resistorPrecision);
        displayMax = max.toFixed(resistorPrecision);
    }

    document.getElementById('resistorMinValue').textContent = `${displayMin} ${displayUnit}`;
    document.getElementById('resistorMaxValue').textContent = `${displayMax} ${displayUnit}`;

    saveValues();
}

// --- Capacitor Calculation ---
function calculateCapacitor() {
    const code = document.getElementById('capacitorCode').value;
    const type = document.getElementById('capacitorType').value;
    const toleranceCode = document.getElementById('capacitorTolerance').value;

    const baseValueInPF = parseCapacitorValue(code);
    if (isNaN(baseValueInPF)) {
        document.getElementById('capacitorMinValue').innerHTML = '';
        document.getElementById('capacitorMaxValue').innerHTML = '';
        return;
    }

    const baseValue = convertCapacitorValue(baseValueInPF, type);
    if (isNaN(baseValue)) {
        document.getElementById('capacitorMinValue').innerHTML = '';
        document.getElementById('capacitorMaxValue').innerHTML = '';
        return;
    }

    const tolerance = toleranceTable[toleranceCode];
    if (tolerance === undefined) {
        document.getElementById('capacitorMinValue').innerHTML = '';
        document.getElementById('capacitorMaxValue').innerHTML = '';
        return;
    }

    const min = baseValue * (1 - tolerance);
    const max = baseValue * (1 + tolerance);

    let unit = type;
    if (baseValue > 1000000 && type === 'pF') {
        unit = 'µF';
    } else if (baseValue > 1000 && type === 'pF') {
        unit = 'nF';
    }

    document.getElementById('capacitorMinValue').innerHTML = `Min Value: ${min.toFixed(capacitorPrecision)} ${unit}<br>`;
    document.getElementById('capacitorMaxValue').innerHTML = `Max Value: ${max.toFixed(capacitorPrecision)} ${unit}`;

    saveValues();
}

// --- Table Functions ---
function addRow() {
    const table = document.getElementById('partsTable').getElementsByTagName('tbody')[0];
    const newRow = table.insertRow();

    const partNumberCell = newRow.insertCell(0);
    const partInput = document.createElement('input');
    partInput.type = 'text';
    partInput.className = 'form-control';
    partInput.placeholder = 'Enter Part Number';
    partInput.oninput = function() { updateRow(newRow); };
    partNumberCell.appendChild(partInput);

    const minCell = newRow.insertCell(1);
    minCell.className = 'min-value';
    minCell.textContent = '-';

    const maxCell = newRow.insertCell(2);
    maxCell.className = 'max-value';
    maxCell.textContent = '-';
}

function updateRow(row) {
    const partInput = row.querySelector('input');
    const minCell = row.querySelector('.min-value');
    const maxCell = row.querySelector('.max-value');

    const code = partInput.value.trim();
    if (code.length === 0) {
        minCell.textContent = '-';
        maxCell.textContent = '-';
        return;
    }

    const valueInPF = parseCapacitorValue(code);
    if (isNaN(valueInPF)) {
        minCell.textContent = 'Invalid';
        maxCell.textContent = 'Invalid';
        return;
    }

    const tolerance = toleranceTable['F']; // Default ±1% (F)
    const min = valueInPF * (1 - tolerance);
    const max = valueInPF * (1 + tolerance);

    let displayUnit = 'pF';
    let minVal = min;
    let maxVal = max;

    if (valueInPF > 1000000) {
        displayUnit = 'µF';
        minVal = min / 1000000;
        maxVal = max / 1000000;
    } else if (valueInPF > 1000) {
        displayUnit = 'nF';
        minVal = min / 1000;
        maxVal = max / 1000;
    }

    minCell.textContent = `${minVal.toFixed(capacitorPrecision)} ${displayUnit}`;
    maxCell.textContent = `${maxVal.toFixed(capacitorPrecision)} ${displayUnit}`;
}

function updateAllTableRows() {
    const rows = document.querySelectorAll('#partsTable tbody tr');
    rows.forEach(row => updateRow(row));
}

// --- Dark Mode Toggle ---
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    saveValues();
}

// --- On Page Load ---
window.onload = function() {
    loadValues();
    calculateResistor();
    calculateCapacitor();

    // Event listeners
    document.getElementById('resistorValue').addEventListener('input', calculateResistor);
    document.getElementById('resistorType').addEventListener('change', calculateResistor);
    document.getElementById('resistorTolerance').addEventListener('change', calculateResistor);

    document.getElementById('capacitorCode').addEventListener('input', calculateCapacitor);
    document.getElementById('capacitorType').addEventListener('change', calculateCapacitor);
    document.getElementById('capacitorTolerance').addEventListener('change', calculateCapacitor);

    // Add initial row to table
    addRow();
};
