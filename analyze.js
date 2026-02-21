import fs from 'fs';

const data = JSON.parse(fs.readFileSync('figma_details.json', 'utf8'));

function extractNodeDetails(node, prefix = "") {
    if (!node) return;

    // Check if it has a background fill or image
    let hasImage = false;
    let bgColors = [];
    if (node.fills) {
        node.fills.forEach(f => {
            if (f.type === 'IMAGE') hasImage = true;
            if (f.type === 'SOLID') bgColors.push(f.color);
        });
    }

    if (hasImage || node.name === '01-clock' || node.name === '09-clock' || node.type === 'TEXT' || node.name === 'Action') {
        console.log(`${prefix}Node: ${node.name} (${node.type})`);
        if (node.absoluteBoundingBox) {
            console.log(`${prefix}  Size: ${node.absoluteBoundingBox.width}x${node.absoluteBoundingBox.height}`);
        }
        if (hasImage) console.log(`${prefix}  HAS IMAGE FILL`);
        if (bgColors.length) console.log(`${prefix}  BG Color:`, bgColors);

        if (node.style) {
            console.log(`${prefix}  Font: ${node.style.fontSize}px ${node.style.fontFamily} ${node.style.fontWeight}`);
            console.log(`${prefix}  Letter Spacing: ${node.style.letterSpacing}`);
        }
        if (node.cornerRadius) {
            console.log(`${prefix}  Radius: ${node.cornerRadius}`);
        }
        if (node.paddingTop) {
            console.log(`${prefix}  Padding: ${node.paddingTop} ${node.paddingRight} ${node.paddingBottom} ${node.paddingLeft}`);
        }
    }

    if (node.children) {
        node.children.forEach(c => extractNodeDetails(c, prefix + "  "));
    }
}

Object.values(data.nodes).forEach(n => {
    extractNodeDetails(n.document);
});
