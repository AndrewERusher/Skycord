const pngToIco = require('png-to-ico').default || require('png-to-ico');
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'build', 'icon.png');
const dest = path.join(__dirname, '..', 'build', 'icon.ico');

pngToIco(src)
  .then(buf => {
    fs.writeFileSync(dest, buf);
    console.log('✅ icon.ico created at build/icon.ico');
  })
  .catch(console.error);
