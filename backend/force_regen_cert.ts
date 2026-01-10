
const { deleteDoc } = require('./src/utils/firestore-helpers');
const { createAndSendCertificate } = require('./src/controllers/certificate.controller');

async function run() {
    try {
        // Delete existing
        console.log('Deleting old cert...');
        await deleteDoc('certificates', 'MRX-AUTH-5572');

        console.log('Regenerating...');
        const cert = await createAndSendCertificate('909de218-6881-4643-bc36-413b2b729928');
        console.log('New Cert:', cert);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

// Mocking some parts if needed or just running if environment is set
// This might fail if imports are ES modules vs CommonJS.
// The backend is using `import`. Running `node script.js` might fail if not compiled or ts-node.
// It's safer to use the API endpoint after manually deleting, or just just delete physically.
