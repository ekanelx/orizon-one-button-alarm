import fs from 'fs';
import https from 'https';
import path from 'path';

const data = JSON.parse(fs.readFileSync('figma_details.json', 'utf8'));

let targetHash = '1401a60c610e0ffca0232607e897925feb5b55cc';

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
            const url = parsed.meta.images[targetHash];
            console.log("Downloading from", url);

            // Download the image
            const file = fs.createWriteStream(path.join('public', 'background.png'));
            https.get(url, function (response) {
                response.pipe(file);
                file.on('finish', function () {
                    file.close();
                    console.log("Background downloaded.");
                });
            });

        } catch (e) {
            console.log("Error parsing:", e.message);
        }
    });
});
req.end();
