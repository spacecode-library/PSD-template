import express from 'express';
import path from 'path';
import cors from 'cors';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

// Enable CORS
app.use(cors());

// Debug logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Serve PSD files
app.get('/psd/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'public', 'PSD-files', filename);
  
  console.log(`[PSD] Requesting file: ${filename}`);
  console.log(`[PSD] Full path: ${filePath}`);
  
  // Security: Only allow specific PSD files
  const allowedFiles = ['5248770.psd', '8039429.psd', '39690114_8731898.psd', '7209489.psd', '8060186.psd'];
  if (!allowedFiles.includes(filename)) {
    console.log(`[PSD] File not in allowed list: ${filename}`);
    return res.status(404).send('File not found');
  }
  
  // Check if file exists with fs.existsSync first
  if (!fs.existsSync(filePath)) {
    console.log(`[PSD] File does not exist at path: ${filePath}`);
    return res.status(404).send('File not found');
  }
  
  // Get file stats
  const stats = fs.statSync(filePath);
  console.log(`[PSD] File size: ${stats.size} bytes`);
  
  fs.access(filePath, fs.constants.R_OK, (err) => {
    if (err) {
      console.log(`[PSD] Cannot read file: ${err.message}`);
      return res.status(404).send('File not found');
    }
    
    console.log(`[PSD] Serving file: ${filename}`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Length', stats.size);
    
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

app.listen(PORT, () => {
  console.log(`PSD server running on http://localhost:${PORT}`);
});