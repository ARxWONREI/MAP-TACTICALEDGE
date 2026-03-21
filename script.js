const mapData = {
    erangel: {
        title: 'ERANGEL', size: '8x8 km', biome: 'Grassland / Forest',
        tips: 'Prioritize securing vehicles early. Master bridge crossing strategies and control high ground around the center. Waterways can be used for stealthy rotations.',
        image: 'assets/erangel.jpg'
    },
    miramar: {
        title: 'MIRAMAR', size: '8x8 km', biome: 'Desert',
        tips: 'Focus on high ground advantage and secure long-range weapons (DMRs/Snipers). Off-road vehicles like the Buggy or Mirado are essential for traversing uneven terrain.',
        image: 'assets/miramar.jpg'
    },
    sanhok: {
        title: 'SANHOK', size: '4x4 km', biome: 'Tropical Jungle',
        tips: 'Stay vigilant in dense foliage. The safe zone shrinks faster, so always plan your next move. Suppressed weapons are king. Beware of bridge and river ambushes.',
        image: 'assets/sanhok.jpg'
    }
};

let currentMap = 'erangel';
let drawingPoints = [];

const navItems = document.querySelectorAll('nav li');
const mapTitle = document.getElementById('map-title');
const mapSize = document.getElementById('map-size');
const mapBiome = document.getElementById('map-biome');
const optionsList = document.querySelectorAll('#options-list li');
let currentOption = null;
const rotationText = document.getElementById('rotation-text');
const strategyTitle = document.getElementById('strategy-title');
const drawingTools = document.getElementById('drawing-tools');
const clearPathBtn = document.getElementById('clear-path');
const mapImageLayer = document.getElementById('map-image-layer');
const rotationSvgLayer = document.getElementById('rotation-svg-layer');

// Zoom & Pan Variables
let scale = 1;
let translateX = 0;
let translateY = 0;
let isDragging = false;
let isClick = true;
let startX, startY;
const mapContainer = document.querySelector('.map-container');
const mapViewWrapper = document.getElementById('map-view-wrapper');

function init() {
    loadMapData(currentMap);
    
    clearPathBtn.addEventListener('click', () => {
        drawingPoints = [];
        renderDrawing();
    });

    optionsList.forEach(option => {
        option.addEventListener('click', () => {
            if (option.classList.contains('active')) {
                option.classList.remove('active');
                currentOption = null;
            } else {
                optionsList.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                currentOption = option.getAttribute('data-option');
            }
            updateMapImage();
        });
    });

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            currentMap = item.getAttribute('data-map');
            loadMapData(currentMap);
            resetZoom();
        });
    });

    // Zoom Controls
    document.getElementById('zoom-in').addEventListener('click', () => { setScale(scale + 0.5); });
    document.getElementById('zoom-out').addEventListener('click', () => { setScale(scale - 0.5); });
    document.getElementById('zoom-reset').addEventListener('click', resetZoom);

    // Wheel Zoom
    mapContainer.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.2 : -0.2;
        setScale(scale + delta);
    });

    // Drag to Pan
    mapContainer.addEventListener('mousedown', (e) => {
        isDragging = true;
        isClick = true;
        startX = e.clientX - translateX;
        startY = e.clientY - translateY;
    });

    mapContainer.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        isClick = false;
        translateX = e.clientX - startX;
        translateY = e.clientY - startY;
        applyTransform();
    });

    const stopDrag = (e) => { 
        if (isDragging && isClick && currentOption === 'rotation') {
            if (drawingPoints.length >= 5) {
                isDragging = false;
                return;
            }
            const rect = mapImageLayer.getBoundingClientRect();
            const unscaledWidth = rect.width / scale;
            const unscaledHeight = rect.height / scale;
            
            const unscaledX = (e.clientX - rect.left) / scale;
            const unscaledY = (e.clientY - rect.top) / scale;
            
            const svgX = (unscaledX / unscaledWidth) * 1000;
            const svgY = (unscaledY / unscaledHeight) * 1000;
            
            drawingPoints.push({x: svgX, y: svgY});
            renderDrawing();
        }
        isDragging = false; 
    };
    mapContainer.addEventListener('mouseup', stopDrag);
    mapContainer.addEventListener('mouseleave', stopDrag);
}

function loadMapData(mapId) {
    const data = mapData[mapId];

    mapTitle.textContent = data.title;
    mapSize.textContent = data.size;
    mapBiome.textContent = data.biome;
    rotationText.textContent = data.tips;
    strategyTitle.innerHTML = `<i class="fa-solid fa-route"></i> General Strategy`;
    drawingTools.style.display = 'none';
    rotationSvgLayer.style.display = 'none';

    currentOption = null;
    drawingPoints = [];
    optionsList.forEach(opt => opt.classList.remove('active'));

    updateMapImage();
}

function updateMapImage() {
    const data = mapData[currentMap];
    let imageUrl = data.image;
    
    // Reset rotation UI
    drawingTools.style.display = 'none';
    rotationSvgLayer.style.display = 'none';
    strategyTitle.innerHTML = `<i class="fa-solid fa-route"></i> General Strategy`;
    rotationText.textContent = data.tips;

    if (currentOption) {
        if (currentOption === 'rotation') {
            imageUrl = data.image; 
            drawingTools.style.display = 'flex';
            strategyTitle.innerHTML = `<i class="fa-solid fa-route"></i> Tactical Whiteboard`;
            rotationText.textContent = "Click directly on the map to draw your own custom rotation paths point by point. You can still drag to pan out of the safe zone.";
            rotationSvgLayer.style.display = 'block';
            renderDrawing();
        } else {
            imageUrl = `assets/${currentMap}_${currentOption}.jpg`;
        }
    }

    mapImageLayer.classList.remove('loaded');
    setTimeout(() => {
        mapImageLayer.style.backgroundImage = `url('${imageUrl}')`;
        mapImageLayer.className = `map-layer loaded`;
    }, 300);
}

function renderDrawing() {
    if (drawingPoints.length === 0) {
        rotationSvgLayer.innerHTML = '';
        return;
    }
    const pointsStr = drawingPoints.map(p => `${p.x},${p.y}`).join(' ');
    let circles = drawingPoints.map((p, i) => {
        let color = i === 0 ? "#11ff11" : "#ffaa00"; // Green start, orange points
        return `<circle cx="${p.x}" cy="${p.y}" r="4" fill="${color}" filter="drop-shadow(0 0 2px ${color})" />`;
    }).join('');
    
    rotationSvgLayer.innerHTML = `
        <polyline points="${pointsStr}" class="rotation-drawn-path"></polyline>
        ${circles}
    `;
}

function setScale(newScale) {
    scale = Math.max(1, Math.min(newScale, 5));
    if (scale === 1) {
        translateX = 0;
        translateY = 0;
    }
    applyTransform();
}

function resetZoom() {
    scale = 1;
    translateX = 0;
    translateY = 0;
    applyTransform();
}

function applyTransform() {
    mapViewWrapper.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
}

document.addEventListener('DOMContentLoaded', init);
