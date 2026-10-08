import fs from 'fs';

const pngBuf = fs.readFileSync('public/Tradosphere Logo.png');
fs.writeFileSync('public/logo.png', pngBuf);

const base64 = pngBuf.toString('base64');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1254 1254" width="100%" height="100%">
  <image width="1254" height="1254" href="data:image/png;base64,${base64}" />
</svg>
`;

fs.writeFileSync('public/logo.svg', svg);
console.log('Successfully created public/logo.svg and public/logo.png! Size:', svg.length);
