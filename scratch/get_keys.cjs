const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        env[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
});

const token = env.SUPABASE_ACESS_TOKEN;
const projectRef = 'cjcfmbgzuxqprzldighp';

if (!token) {
    console.error("Missing SUPABASE_ACESS_TOKEN in .env.local");
    process.exit(1);
}

const url = `https://api.supabase.com/v1/projects/${projectRef}/api-keys`;

fetch(url, {
    headers: {
        'Authorization': `Bearer ${token}`
    }
})
.then(res => {
    if (!res.ok) {
        return res.text().then(text => {
            throw new Error(`HTTP error ${res.status}: ${text}`);
        });
    }
    return res.json();
})
.then(data => {
    console.log("Keys retrieved successfully:");
    console.log(JSON.stringify(data, null, 2));
})
.catch(err => {
    console.error("Error fetching keys:", err);
});
