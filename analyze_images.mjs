import fs from 'fs';
import https from 'https';

const data = JSON.parse(fs.readFileSync('figma_details.json', 'utf8'));

let imageRefs = new Set();

function extractNodeDetails(node) {
    if (!node) return;

    if (node.fills) {
        node.fills.forEach(f => {
            if (f.type === 'IMAGE' && f.imageRef) {
                imageRefs.add(f.imageRef);
            }
        });
    }

    if (node.children) {
        node.children.forEach(c => extractNodeDetails(c));
    }
}

Object.values(data.nodes).forEach(n => {
    extractNodeDetails(n.document);
});

console.log("Image Refs found:", Array.from(imageRefs));

const options = {
    hostname: 'api.figma.com',
    path: '/v1/files/a11C0MwNXOaaIu3rrG3nye/images',
    method: 'GET',
    headers: {
        'X-Figma-Token': process.env.FIGMA_TOKEN || 'YOUR_FIGMA_TOKEN_HERE'
    }
};

const req = https.request(options, res => {
    let body = '';
    res.on('data', chunk => { body += chunk; });
    res.on('end', () => {
        try {
            const parsed = JSON.parse(body);
            console.log("Images URLs:", parsed.meta.images);
        } catch (e) {
            console.log("Error parsing:", e.message);
        }
    });
});

req.on('error', error => {
    console.error(error);
});

req.end();
