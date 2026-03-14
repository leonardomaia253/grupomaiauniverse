const fs = require('fs');
const path = require('path');

const DIRECTORIES_TO_SCAN = [
  path.join(__dirname, '..', 'supabase', 'migrations'),
  path.join(__dirname, '..', 'src', 'app', 'api'),
  path.join(__dirname, '..', 'src', 'lib'),
  path.join(__dirname, '..', 'src', 'components'),
  path.join(__dirname, '..', 'src', 'app'),
];

// File extensions to process
const EXTENSIONS = new Set(['.sql', '.ts', '.tsx', '.js', '.jsx', '.json', '.md']);

// Helper to recursively get all files
function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach((file) => {
    if (fs.statSync(dirPath + '/' + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + '/' + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, '/', file));
    }
  });

  return arrayOfFiles;
}

// Replacement rules (ordered carefully to prevent overlap logic issues)
const REPLACEMENTS = [
  { match: /developers/g, replace: 'companies' },
  { match: /Developers/g, replace: 'Companies' },
  { match: /DEVELOPERS/g, replace: 'COMPANIES' },
  { match: /developer/g, replace: 'company' },
  { match: /Developer/g, replace: 'Company' },
  { match: /DEVELOPER/g, replace: 'COMPANY' },

  { match: /buildings/g, replace: 'planets' },
  { match: /Buildings/g, replace: 'Planets' },
  { match: /BUILDINGS/g, replace: 'PLANETS' },
  { match: /building/g, replace: 'planet' },
  { match: /Building/g, replace: 'Planet' },
  { match: /BUILDING/g, replace: 'PLANET' },

  { match: /city_stats/g, replace: 'universe_stats' },
  { match: /city_snapshot/g, replace: 'universe_snapshot' },
];

let filesProcessed = 0;
let filesModified = 0;

DIRECTORIES_TO_SCAN.forEach((dir) => {
  if (!fs.existsSync(dir)) return;

  const files = getAllFiles(dir, []);
  
  files.forEach((file) => {
    const ext = path.extname(file);
    if (!EXTENSIONS.has(ext)) return;

    filesProcessed++;
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;

    for (const rule of REPLACEMENTS) {
      content = content.replace(rule.match, rule.replace);
    }

    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      filesModified++;
      console.log(`Updated contents: ${file}`);
    }
    
    // Rename file if necessary
    const basename = path.basename(file);
    let newBasename = basename;
    
    for (const rule of REPLACEMENTS) {
      newBasename = newBasename.replace(rule.match, rule.replace);
    }
    
    if (newBasename !== basename) {
      const newPath = path.join(path.dirname(file), newBasename);
      fs.renameSync(file, newPath);
      console.log(`Renamed file: ${basename} -> ${newBasename}`);
    }
  });
});

console.log(`\nProcessed ${filesProcessed} files. Modified content in ${filesModified} files.`);

// Rename directories if necessary (e.g. src/app/api/dev -> src/app/api/company)
const dirsToRename = [
  { from: path.join(__dirname, '..', 'src', 'app', 'api', 'dev'), to: path.join(__dirname, '..', 'src', 'app', 'api', 'company') },
  { from: path.join(__dirname, '..', 'src', 'app', 'dev'), to: path.join(__dirname, '..', 'src', 'app', 'company') },
];

dirsToRename.forEach(({ from, to }) => {
  if (fs.existsSync(from)) {
    fs.renameSync(from, to);
    console.log(`Renamed directory: ${from} -> ${to}`);
  }
});
