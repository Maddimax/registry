// git diff --name-only origin/main...test

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const changedFiles = exec('git diff --name-only origin/main...HEAD', (err, stdout, stderr) => {
    if (err) {
        console.error(err);
        return;
    }
    if (stderr) {
        console.error(stderr);
        return;
    }
    console.log('Changed files:', stdout);
    const files = stdout.split('\n').filter(file => file.includes('registry'));
    files.forEach(file => {
        console.log(file)
    });
})
