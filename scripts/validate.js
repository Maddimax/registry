const Ajv = require("ajv/")
const path = require("path")
const fs = require("fs")
const styleTextOrg = require('node:util').styleText

function styleText(color, text) {
    return styleTextOrg(color, text, {validateStream: false})
}

const extensionSchema = require(path.join(__dirname, "..", "schema", "extension.schema.json"))
const packSchema = require(path.join(__dirname, "..", "schema", "pack.schema.json"))

const baseSchema = require(path.join(__dirname, "..", "schema", "base.schema.ref.json"))
const sourceSchema = require(path.join(__dirname, "..", "schema", "source.schema.ref.json"))
const versionSchema = require(path.join(__dirname, "..", "schema", "version.schema.ref.json"))
const pluginMetaDataSchema = require(path.join(__dirname, "..", "schema", "plugin-meta-data.schema.ref.json"))

const ajv = new Ajv({allowUnionTypes: true})
ajv.addSchema(baseSchema)
ajv.addSchema(sourceSchema)
ajv.addSchema(versionSchema)
ajv.addSchema(pluginMetaDataSchema)

const validateExtension = ajv.compile(extensionSchema)
const validatePack = ajv.compile(packSchema)

const registryFolder = path.join(__dirname, "..", "registry")

function enumerateExtensions(directory) {
  return fs.readdirSync(directory).map((folder)=> {
    const extpath = path.join(directory, folder, "extension.json")
    const packpath = path.join(directory, folder, "pack.json")
    if (fs.existsSync(extpath)) {
      return extpath
    } else if(fs.existsSync(packpath)) {
      return packpath
    }
    throw new Error(`No extension or pack found in ${folder}`)
  })
}

function validate(validator, ext) {
    const res = validator(JSON.parse(fs.readFileSync(ext)))
    if (!res) {
        console.error(`Schema ${path.relative(registryFolder, ext)}:`, styleText("red", "failed"))
        console.error(validator.errors)
        process.exit(1)
    }

    console.log(`Schema ${path.relative(registryFolder, ext)}:`, styleText("green", "Ok"))
}

function validateExtensionData(ext) {    
    for (version in ext.versions) {
        const v = ext.versions[version]
        const metaData = v.metadata
        if (metaData.Id != ext.info.id) {
            console.error(`Version "${version}" metadata Id ("${styleText("green", metaData.Id)}") does not match extension Id ("${styleText("red", ext.info.id)}")`)
            process.exit(1)
        }
    }
}

enumerateExtensions(registryFolder).forEach((ext) => {
    if (ext.endsWith('extension.json')){
        validate(validateExtension, ext)
        validateExtensionData(JSON.parse(fs.readFileSync(ext)))
    }
    if (ext.endsWith('pack.json'))
        validate(validatePack, ext)
})
