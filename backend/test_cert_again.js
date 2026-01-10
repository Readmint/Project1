
fetch('http://localhost:5000/api/certificates/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ articleId: '909de218-6881-4643-bc36-413b2b729928' })
})
    .then(res => res.json())
    .then(console.log)
    .catch(console.error);
