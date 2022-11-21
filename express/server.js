const ASSEMBLE_SCRIPT = '/home/android/assemble';
const ASSEMBLE_LOG = '/android/assemble.in.progress.log';

const ASSEMBLED_APK = 'snapshot.apk';
const ASSEMBLED_DIR = '/builds';

const fs = require('fs');
const express = require('express');
const { spawn } = require('child_process');
const events = require('events');
const messageEmitter = new events.EventEmitter();

const app = express();
const port = process.env.PORT || 80;
const root = process.env.DIST || 'dist/build-box';
const BUILD_PATH = __dirname + ASSEMBLED_DIR;

let assembleProgressPromise;

if (!fs.existsSync(BUILD_PATH)) {
  fs.mkdirSync(BUILD_PATH);
}
process.env['BUILD_APK'] = BUILD_PATH + '/' + ASSEMBLED_APK;

app.get('/api/has-file', (req, res) => {
  const buildFile = BUILD_PATH + '/' + ASSEMBLED_APK;
  console.log('request to check file:', buildFile);

  let hasFile;
  let stats;
  try {
    hasFile = fs.existsSync(buildFile);
    stats = fs.statSync(buildFile);
  } catch (err) {
    hasFile = false;
    stats = null;
  }

  res.status(200).json({
    hasFile: hasFile,
    stats: stats,
    fileName: ASSEMBLED_APK
  });
});

app.get('/api/download', (req, res, next) => {
  console.log('request to download file:', BUILD_PATH + '/' + ASSEMBLED_APK);
  res.download(ASSEMBLED_APK, { root: BUILD_PATH }, (err) => {
    if (!err) return; // file sent
    if (err.status !== 404) return next(err); // non-404 error
    // file for download not found
    res.statusCode = 404;
    res.send('Cant find that file, sorry!');
  });
});

app.get('/api/assemble/status', (req, res) => {
  console.log('request to check is assemble in progress');
  res.status(200).json({ inProgress: assembleProgressPromise });
});

app.post('/api/assemble', (req, res) => {

  // user single instance
  if (!assembleProgressPromise) {
    assembleProgressPromise = new Promise((resolve, reject) => {
      const timeStart = Date.now();

      const ps = spawn(ASSEMBLE_SCRIPT, []);
      const tailps = spawn('tail', ['-f', ASSEMBLE_LOG]);

      ps.stdout.on('data', (data) => {
        console.log('[ Assemble data spawned ]', data.toString());
        messageEmitter.emit('data', data.toString());
      });
      ps.on('close', () => {
        const timeEnd = `Time: ${((Date.now() - timeStart) / 1000).toFixed(1)} s.`
        messageEmitter.emit('data', timeEnd);

        tailps.kill();

        resolve();
        assembleProgressPromise = null;
      });
      ps.stderr.on('data', (err) => {
        console.log('[ Assemble error spawned ]', err.toString());
        messageEmitter.emit('error', err.toString());
      });

      tailps.stdout.on('data', (data) => {
        console.log('[ Tail data spawned ]', data.toString());
        messageEmitter.emit('data', data.toString());
      });
      tailps.on('close', () => {
        //
      });
      tailps.stderr.on('data', (err) => {
        console.log('[ Tail error spawned ]', err.toString());
        messageEmitter.emit('error', err.toString());
      });
    });
  }

  assembleProgressPromise
    .then(() => {
      res.end();
    })
    .catch((err) => {
      res.end('stderr: ' + err);
    });
});

app.get('/api/status', (req, res) => {
  res.set({
    'Cache-Control': 'no-cache',
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
  });
  res.flushHeaders();
  res.write(`retry: 5000\n\n`);

  messageEmitter.addListener('data',  (data) => {
    data.split('\n').forEach((line) => {
      res.write(`id: ${Date.now()}\ndata: ${line}\n\n`);
    });
  });
  messageEmitter.addListener('close',  () => {
    res.end();
  });
  messageEmitter.addListener('error',  (err) => {
    err.split('\n').forEach((line) => {
      res.write(`id: ${Date.now()}\ndata: ${line}\n\n`);
    });
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

app.get('*.*', express.static(root, { maxAge: '1y' }));
app.all('*', (req, res) => {
  res.status(200).sendFile(`/`, { root });
});

console.log(`starting static server on the port ${port} for dir "${root}"`);

const server = app.listen(port, () => {
  const port = server.address().port;
  console.log(`app now running on port ${port}`);
});
