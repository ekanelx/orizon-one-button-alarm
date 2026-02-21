const fs = require('fs');
const https = require('https');

const options = {
    hostname: 'api.figma.com',
    path: '/v1/files/a11C0MwNXOaaIu3rrG3nye/nodes?ids=213:313,211:1423,211:2037,212:533', // mini-ds, clock, alarm, set time
    method: 'GET',
    headers: {
        'X-Figma-Token': process.env.FIGMA_TOKEN || 'YOUR_FIGMA_TOKEN_HERE'
    }
};

const req = https.request(options, res => {
    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => {
        try {
            const parsed = JSON.parse(data);
            fs.writeFileSync('figma_details.json', JSON.stringify(parsed, null, 2));
            console.log("Details saved to figma_details.json");
        } catch (e) {
            console.log("Error parsing:", e.message);
        }
    });
});

req.on('error', error => {
    console.error(error);
});

req.end();
