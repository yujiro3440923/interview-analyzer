const fs = require('fs');
const path = require('path');

async function testUpload() {
    const filePath = path.join(process.cwd(), 'sample_data.xlsx');
    if (!fs.existsSync(filePath)) {
        console.error('Sample file not found at:', filePath);
        return;
    }

    const fileBuffer = fs.readFileSync(filePath);
    const blob = new Blob([fileBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    const formData = new FormData();
    formData.append('file', blob, 'sample_data.xlsx');

    console.log('Sending upload request to http://localhost:3000/api/upload ...');

    try {
        const res = await fetch('http://localhost:3000/api/upload', {
            method: 'POST',
            body: formData
        });

        if (!res.ok) {
            throw new Error(`Upload failed: ${res.status} ${res.statusText} - ${await res.text()}`);
        }

        const json = await res.json();
        console.log('Upload Success! Response:', JSON.stringify(json, null, 2));
    } catch (e) {
        console.error('Test Failed:', e);
    }
}

testUpload();
