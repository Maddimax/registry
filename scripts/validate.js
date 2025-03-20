const Ajv = require("ajv/")
const path = require("path")
const fs = require("fs")
const styleTextOrg = require('node:util').styleText

function styleText(color, text) {
    // Github actions don't have a real tty, so styleText will normally output monochrome text.
    // But we check if the "CI" env variable is set to "true" and if so, we disable the stream validation.
    return styleTextOrg(color, text, { validateStream: process.env.CI !== "true" })
}

const rootFolder = path.join(__dirname, "..")

const extensionSchema = require(path.join(rootFolder, "schema", "extension.schema.json"))
const packSchema = require(path.join(rootFolder, "schema", "pack.schema.json"))

const baseSchema = require(path.join(rootFolder, "schema", "base.schema.ref.json"))
const sourceSchema = require(path.join(rootFolder, "schema", "source.schema.ref.json"))
const versionSchema = require(path.join(rootFolder, "schema", "version.schema.ref.json"))
const pluginMetaDataSchema = require(path.join(rootFolder, "schema", "plugin-meta-data.schema.ref.json"))

const ajv = new Ajv({ allowUnionTypes: true })
ajv.addSchema(baseSchema)
ajv.addSchema(sourceSchema)
ajv.addSchema(versionSchema)
ajv.addSchema(pluginMetaDataSchema)

const validateExtension = ajv.compile(extensionSchema)
const validatePack = ajv.compile(packSchema)

const registryFolder = path.join(rootFolder, "registry")

function enumerateExtensions(directory) {
    return fs.readdirSync(directory).map((folder) => {
        const extpath = path.join(directory, folder, "extension.json")
        const packpath = path.join(directory, folder, "pack.json")
        if (fs.existsSync(extpath)) {
            return extpath
        } else if (fs.existsSync(packpath)) {
            return packpath
        }
        throw new Error(`No extension or pack found in ${folder}`)
    })
}

function checkDirectoryContents(directory) {
    // Make sure that each extension folder only contains the allowed files
    const allowedFiles = ["extension.json", "pack.json", "icon.png", "icon@2x.png"]

    const files = fs.readdirSync(directory)
    if (!files.includes("extension.json") && !files.includes("pack.json")) {
        console.error(`No extension or pack found in ${styleText('red', path.relative(rootFolder, directory))}`)
        process.exit(1)
    }

    for (const file of files) {
        if (!allowedFiles.includes(file)) {
            console.error(`Unexpected file found in ${styleText('green', path.relative(rootFolder, directory))}: ${styleText('red', file)}`)
            console.log('Allowed files:', allowedFiles)
            process.exit(1)
        }
    }
}

function checkExtensionDirectoryContents(directory) {
    const extensions = fs.readdirSync(directory)
    for (const extension of extensions) {
        checkDirectoryContents(path.join(directory, extension))
    }

    console.log(`All extensions in ${styleText("green", path.relative(rootFolder, directory))} have the correct files`)
}

function validate(validator, ext) {
    const res = validator(JSON.parse(fs.readFileSync(ext)))
    if (!res) {
        console.error(`Schema ${styleText("red", path.relative(registryFolder, ext))}:`, styleText("red", "failed"))
        console.error(validator.errors)
        process.exit(1)
    }

    console.log(`Schema ${styleText("green", path.relative(registryFolder, ext))}:`, styleText("green", "Ok"))
}

function validateExtensionData(ext) {
    const iData = {
        id: ext.info.id,
        vendorId: ext.info.vendor_id,
        display_name: ext.info.display_name,
        display_vendor: ext.info.display_vendor,
    }

    for (version in ext.versions) {
        const v = ext.versions[version]
        const metaData = v.metadata

        const vData = {
            id: metaData.Id,
            vendorId: metaData.VendorId,
            display_name: metaData.Name,
            display_vendor: metaData.Vendor,
        }

        if (JSON.stringify(vData) !== JSON.stringify(iData)) {
            console.error(`Version "${version}" metadata ("${styleText("green", JSON.stringify(iData))}") does not match ("${styleText("red", JSON.stringify(vData))}")`)
            process.exit(1)
        }

        if (version !== metaData.Version) {
            console.error(`The metadata version field (${styleText("green", metaData.Version)}) does not match the key ${styleText("red", version)}`)
            process.exit(1)
        }
    }
    const id = `${ext.info.vendor_id}.${ext.info.id}`
    console.log(`Extension data ${styleText("green", id)}:`, styleText("green", "Ok"))
}

checkExtensionDirectoryContents(registryFolder)

enumerateExtensions(registryFolder).forEach((ext) => {
    if (ext.endsWith('extension.json')) {
        validate(validateExtension, ext)
        validateExtensionData(JSON.parse(fs.readFileSync(ext)))
    }
    if (ext.endsWith('pack.json'))
        validate(validatePack, ext)
})
