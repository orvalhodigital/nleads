const dns = require('dns');

const domains = [
    'otimizza.pro',
    'docs.otimizza.pro',
    'otimizza.com.br',
    'docs.otimizza.com.br',
    'nleads.pro',
    'docs.nleads.pro'
];

domains.forEach(domain => {
    dns.resolve4(domain, (err, addresses) => {
        if (err) {
            console.log(`[DNS] ${domain} failed to resolve:`, err.message);
        } else {
            console.log(`[DNS] ${domain} resolved to:`, addresses);
        }
    });
});
