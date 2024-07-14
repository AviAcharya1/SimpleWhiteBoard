const canvas = document.getElementById('whiteboard');
const ctx = canvas.getContext('2d');
const tools = document.querySelectorAll('.tool');
const colorPicker = document.getElementById('colorPicker');
const lineWidth = document.getElementById('lineWidth');

let isDrawing = false;
let currentTool = 'pencil';
let startX, startY;

// Set canvas size
canvas.width = window.innerWidth - 40;
canvas.height = window.innerHeight - 100;

// Socket.io setup (assuming server is set up)
const socket = io('http://localhost:3000');

// Tool selection
tools.forEach(tool => {
    tool.addEventListener('click', () => {
        tools.forEach(t => t.classList.remove('active'));
        tool.classList.add('active');
        currentTool = tool.id.replace('Tool', '');
    });
});

// Drawing functions
function startDrawing(e) {
    isDrawing = true;
    [startX, startY] = [e.offsetX, e.offsetY];
}

function draw(e) {
    if (!isDrawing) return;
    ctx.strokeStyle = colorPicker.value;
    ctx.lineWidth = lineWidth.value;
    ctx.lineCap = 'round';

    switch (currentTool) {
        case 'pencil':
            ctx.lineTo(e.offsetX, e.offsetY);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(e.offsetX, e.offsetY);
            break;
        case 'eraser':
            ctx.strokeStyle = '#ffffff';
            ctx.lineTo(e.offsetX, e.offsetY);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(e.offsetX, e.offsetY);
            break;
        case 'rectangle':
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.beginPath();
            ctx.rect(startX, startY, e.offsetX - startX, e.offsetY - startY);
            ctx.stroke();
            break;
        case 'circle':
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.beginPath();
            const radius = Math.sqrt(Math.pow(e.offsetX - startX, 2) + Math.pow(e.offsetY - startY, 2));
            ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
            ctx.stroke();
            break;
    }

    // Emit drawing data to server
    socket.emit('draw', {
        tool: currentTool,
        color: colorPicker.value,
        lineWidth: lineWidth.value,
        startX,
        startY,
        endX: e.offsetX,
        endY: e.offsetY
    });
}

function stopDrawing() {
    isDrawing = false;
    ctx.beginPath();
}

// Event listeners
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

// Collaborative feature: receive drawing data from server
socket.on('draw', (data) => {
    ctx.strokeStyle = data.color;
    ctx.lineWidth = data.lineWidth;
    ctx.lineCap = 'round';

    switch (data.tool) {
        case 'pencil':
        case 'eraser':
            ctx.beginPath();
            ctx.moveTo(data.startX, data.startY);
            ctx.lineTo(data.endX, data.endY);
            ctx.stroke();
            break;
        case 'rectangle':
            ctx.beginPath();
            ctx.rect(data.startX, data.startY, data.endX - data.startX, data.endY - data.startY);
            ctx.stroke();
            break;
        case 'circle':
            ctx.beginPath();
            const radius = Math.sqrt(Math.pow(data.endX - data.startX, 2) + Math.pow(data.endY - data.startY, 2));
            ctx.arc(data.startX, data.startY, radius, 0, 2 * Math.PI);
            ctx.stroke();
            break;
    }
});

// Simple shape recognition (for demonstration)
function recognizeShape(startX, startY, endX, endY) {
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);
    const ratio = width / height;

    if (0.9 < ratio && ratio < 1.1) {
        return 'circle';
    } else {
        return 'rectangle';
    }
}

// Smart snapping (basic implementation)
function snapToGrid(x, y, gridSize = 20) {
    return {
        x: Math.round(x / gridSize) * gridSize,
        y: Math.round(y / gridSize) * gridSize
    };
}

// You would need to integrate these functions into your drawing logic