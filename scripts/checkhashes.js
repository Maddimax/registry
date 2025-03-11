const util = require('util');
const exec = util.promisify(require('child_process').exec);

const path = require('path');
const fs = require('fs/promises');
const https = require('https');
const crypto = require('crypto');
const styleTextOrg = require('node:util').styleText

function styleText(color, text) {
    // Github actions don't have a real tty, so styleText will normally output monochrome text.
    // But we check if the "CI" env variable is set to "true" and if so, we disable the stream validation.
    return styleTextOrg(color, text, {validateStream: process.env.CI !== "true"})
}

function httpGet(url, resolve, reject) {
    https.get(url, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
            httpGet(response.headers.location, resolve, reject);
            return
        }

        const hash = crypto.createHash('sha256');
        response.on('error', (err) => {
            reject(err);
        })
        response.on('data', (chunk) => {
            hash.update(chunk);
        })
        response.on('end', () => {
            const digest = hash.digest('hex');
            resolve(digest);
        })
    })
}

async function shaFromUrl(url) {
    return new Promise((resolve, reject) => {
        httpGet(url, resolve, reject)
    })
}

async function main() {
    const {stdout, stderr}  =await exec('git diff --name-only origin/main...HEAD');
    if (stderr) {
        console.error(stderr);
        return 1;
    }
    const files = stdout.split('\n').filter(file => file.includes('registry') && path.basename(file) === 'extension.json');
    for (const file of files) {
        const content = JSON.parse(await fs.readFile(file));
        for(const version in content.versions) {
            const sources = content.versions[version].sources
            for(const source of sources) {
                const url = source.url
                const sha256 = source.sha256
                console.log(`Now checking ${styleText('grey', url)} with hash ${styleText('grey', sha256)}`);
                const actualSha = await shaFromUrl(url)

                if (actualSha !== sha256) {
                    console.error(`Hash mismatch for ${styleText('red', url)}: expected ${styleText('red', sha256)} but got ${styleText('red', actualSha)}`);
                    return 1;
                } else {
                    console.log(`Hash for ${styleText('green', url)} matches`);
                }
            }
        }
    }
    return 0
}

main().then((code) => {
    process.exit(code)
})
