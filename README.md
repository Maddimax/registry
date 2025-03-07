# The Registry

We register stuff


## How to include your plugin

1. Fork this repository
2. Add a new folder in the `registry` folder with the name `<vendorid>.<pluginid>`
3. Add a `plugin.json` file in your new folder with the following content:

```json
{
    "$schema": "../../schema/registry.schema.json",
    "extension_id": "<your-plugin-id>",
    "vendor_id": "<your-company-id>",
    "display_name": "<display name of your plugin",
    "display_vendor": "<dislay name of your company>",
    "license": "open-source",
    "latest": "<version-key-of-the-latest-version>",
    "versions": { "1.0.0": {} },
}
```
