// Barangay Pie Chart
const barangayLabels = barangayData.map(item => item.barangay);
const barangayValues = barangayData.map(item => item.count);
const barangayColors = barangayLabels.map((_, index) => 
    `hsl(${(index * 360) / barangayLabels.length}, 70%, 50%)`
);

// Initialize Barangay Graph
const barangayCanvas = document.getElementById('barangayGraph');
const barangayGraph = new Chart(barangayCanvas, {
    type: 'polarArea',
    data: {
        labels: barangayLabels,
        datasets: [{
            data: barangayValues,
            backgroundColor: barangayColors,
        }]
    },
    options: {
        responsive: true,
        plugins: {
            legend: { position: 'right' },
            tooltip: { enabled: true }
        }
    }
});
if (!barangayData[0]?.barangay) {
    const barangayLabels = barangayData.map(item => item.barangay || item[0]);
    const barangayValues = barangayData.map(item => item.count || item[1]);

    // Rebuild structured array for description generator
    const barangayStructured = barangayLabels.map((label, index) => ({
        barangay: label,
        count: barangayValues[index]
    }));
    generateBarangayDescription(barangayStructured);
} else {
    generateBarangayDescription(barangayData);
}


// Initially hide the graph
barangayCanvas.style.display = 'none';

// Toggle Graph Visibility
const barangayCard = document.getElementById('barangayCard');
barangayCard.addEventListener('click', () => {
    const firstGraph = document.querySelector('.firstGraph');
    const isHidden = firstGraph.style.display === 'none';
    firstGraph.style.display = isHidden ? 'block' : 'none';
    if (isHidden) {
        generateBarangayDescription();
    }
});




console.log('classificationData:', classificationData);

// Classification Bar Chart
document.addEventListener('DOMContentLoaded', () => {
    const card = document.getElementById('classificationCard');
    const graphContainer = document.getElementById('graphContainer');
    

    card.addEventListener('click', () => {
        const isHidden = graphContainer.style.display === 'none';
        graphContainer.style.display = isHidden ? 'block' : 'none';
    });
});
const firstClassificationKey = Object.keys(classificationData)[0];
const classificationLabels = firstClassificationKey 
    ? Object.keys(classificationData[firstClassificationKey]) 
    : [];

const datasets = Object.keys(classificationData).map((key, index) => ({
    label: key,
    data: classificationLabels.map(label => classificationData[key]?.[label] || 0),
    backgroundColor: `hsl(${(index * 360) / 4}, 70%, 50%)`
}));

new Chart(document.getElementById('classificationGraph'), {
    type: 'bar',
    data: {
        labels: classificationLabels,
        datasets: datasets
    },
    options: {
        responsive: true,
        scales: {
            x: { stacked: true },
            y: { beginAtZero: true }
        },
        plugins: {
            legend: { position: 'top' },
            tooltip: { enabled: true }
        }
    }
});
// Subclass Displaced Bar Chart
const subclassDisplacedLabels = [...new Set(subclassDisplacedData.map(item => item.subclass_displaced))]; // Unique subclasses
const barangayLabelsDisplaced = [...new Set(subclassDisplacedData.map(item => item.barangay))]; // Unique barangays

const displacedDatasets = subclassDisplacedLabels.map(subclass => {
    return {
        label: subclass,
        data: barangayLabelsDisplaced.map(barangay => {
            const filtered = subclassDisplacedData.filter(item => item.barangay === barangay && item.subclass_displaced === subclass);
            return filtered.length > 0 ? filtered[0].count : 0; // Add count or 0
        }),
        backgroundColor: `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.7)`
    };
});

new Chart(document.getElementById('subclass_displacedGraph'), {
    type: 'bar',
    data: {
        labels: barangayLabelsDisplaced,
        datasets: displacedDatasets
    },
    options: {
        responsive: true,
        scales: {
            x: { stacked: true },
            y: { beginAtZero: true, stacked: true }
        },
        plugins: {
            legend: { display: true },
            tooltip: { enabled: true }
        }
    }
});

// Subclass Double-Up Bar Chart
const subclassDoubleUpLabels = [...new Set(subclassDoubleUpData.map(item => item.subclass_doubleup))]; // Unique subclasses
const barangayLabelsDoubleUp = [...new Set(subclassDoubleUpData.map(item => item.barangay))]; // Unique barangays

const doubleUpDatasets = subclassDoubleUpLabels.map(subclass => {
    return {
        label: subclass,
        data: barangayLabelsDoubleUp.map(barangay => {
            const filtered = subclassDoubleUpData.filter(item => item.barangay === barangay && item.subclass_doubleup === subclass);
            return filtered.length > 0 ? filtered[0].count : 0; // Add count or 0
        }),
        backgroundColor: `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.7)`
    };
});

new Chart(document.getElementById('subclass_doubleupGraph'), {
    type: 'bar',
    data: {
        labels: barangayLabelsDoubleUp,
        datasets: doubleUpDatasets
    },
    options: {
        responsive: true,
        scales: {
            x: { stacked: true },
            y: { beginAtZero: true, stacked: true }
        },
        plugins: {
            legend: { display: true },
            tooltip: { enabled: true }
        }
    }
});

function generateBarangayDescription(data = barangayData) {
    console.log("Generating description...");
    if (!data || data.length === 0) {
        console.log("No barangay data found!");
        return;
    }

    const sorted = [...data].sort((a, b) => b.count - a.count);
    const top = sorted[0];
    const second = sorted[1];
    const total = sorted.reduce((sum, b) => sum + parseInt(b.count), 0);

    let description = "";

    if (sorted.length === 1) {
        description = `Barangay ${top.barangay} currently has the highest number of beneficiaries (${top.count}).`;
    } else {
        description = `Barangay ${top.barangay} has the highest number of beneficiaries (${top.count}), followed by Barangay ${second.barangay} (${second.count}). `;
        description += `In total, there are ${total} beneficiaries across ${sorted.length} barangays. `;
        description += `This indicates that Barangay ${top.barangay} may require more attention or support for relocation and housing assistance.`;
    }

    const descElement = document.getElementById('barangayDescription');
    if (descElement) {
        descElement.textContent = description;
        descElement.style.display = 'block';
        console.log("Description updated:", description);
    } else {
        console.log("Description element not found!");
    }
}

