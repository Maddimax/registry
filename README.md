# The Registry

This contains a registry of extensions.

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
    "latest": "1.0.0",
    "versions": {
        "1.0.0": {
          "sources": [
            "url": "<url to your plugin>",
            "sha256": "<sha256 of your plugin>"
          ],
          "metadata": {
            // A copy of the metadata from your plugin.
          }
        }
    }
}
```
4. Run `npm run all` to validate your changes
5. Run `git add .` and `git commit -m "Added <your-plugin-id>"`
6. Push your changes to your fork
7. Create a pull request to this repository
8. Wait for approval
