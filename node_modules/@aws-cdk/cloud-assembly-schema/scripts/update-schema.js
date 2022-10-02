"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSchema = exports.bump = exports.update = exports.SCHEMAS = void 0;
const fs = require("fs");
const path = require("path");
const semver = require("semver");
// eslint-disable-next-line import/no-extraneous-dependencies
const tjs = require("typescript-json-schema");
function log(message) {
    // eslint-disable-next-line no-console
    console.log(message);
}
/**
 * Where schemas are committed.
 */
const SCHEMA_DIR = path.resolve(__dirname, '../schema');
const SCHEMA_DEFINITIONS = {
    'assets': { rootTypeName: 'AssetManifest' },
    'cloud-assembly': { rootTypeName: 'AssemblyManifest' },
    'integ': { rootTypeName: 'IntegManifest' },
};
exports.SCHEMAS = Object.keys(SCHEMA_DEFINITIONS);
function update() {
    for (const s of exports.SCHEMAS) {
        generateSchema(s);
    }
    bump();
}
exports.update = update;
function bump() {
    const versionFile = path.join(SCHEMA_DIR, 'cloud-assembly.version.json');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const metadata = require(versionFile);
    const oldVersion = metadata.version;
    const newVersion = semver.inc(oldVersion, 'major');
    log(`Updating schema version: ${oldVersion} -> ${newVersion}`);
    fs.writeFileSync(versionFile, JSON.stringify({ version: newVersion }));
}
exports.bump = bump;
/**
 * Generates a schema from typescript types.
 * @returns JSON schema
 * @param schemaName the schema to generate
 * @param shouldBump writes a new version of the schema and bumps the major version
 */
function generateSchema(schemaName, saveToFile = true) {
    const spec = SCHEMA_DEFINITIONS[schemaName];
    const out = saveToFile ? path.join(SCHEMA_DIR, `${schemaName}.schema.json`) : '';
    const settings = {
        required: true,
        ref: true,
        topRef: true,
        noExtraProps: false,
        out,
    };
    const compilerOptions = {
        strictNullChecks: true,
    };
    const program = tjs.getProgramFromFiles([path.join(__dirname, '../lib/index.d.ts')], compilerOptions);
    const schema = tjs.generateSchema(program, spec.rootTypeName, settings);
    augmentDescription(schema);
    addAnyMetadataEntry(schema);
    if (out) {
        log(`Generating schema to ${out}`);
        fs.writeFileSync(out, JSON.stringify(schema, null, 4));
    }
    return schema;
}
exports.generateSchema = generateSchema;
/**
 * Remove 'default' from the schema since its generated
 * from the tsdocs, which are not necessarily actual values,
 * but rather descriptive behavior.
 *
 * To keep this inforamtion in the schema, we append it to the
 * 'description' of the property.
 */
function augmentDescription(schema) {
    function _recurse(o) {
        for (const prop in o) {
            if (prop === 'description' && typeof o[prop] === 'string') {
                const description = o[prop];
                const defaultValue = o.default;
                if (!defaultValue) {
                    // property doesn't have a default value
                    // skip
                    continue;
                }
                const descriptionWithDefault = `${description} (Default ${defaultValue})`;
                delete o.default;
                o[prop] = descriptionWithDefault;
            }
            else if (typeof o[prop] === 'object') {
                _recurse(o[prop]);
            }
        }
    }
    _recurse(schema);
}
/**
 * Patch the properties of MetadataEntry to allow
 * specifying any free form data. This is needed since source
 * code doesn't allow this in order to enforce stricter jsii
 * compatibility checks.
 */
function addAnyMetadataEntry(schema) {
    schema.definitions.MetadataEntry?.properties.data.anyOf.push({ description: 'Free form data.' });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXBkYXRlLXNjaGVtYS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInVwZGF0ZS1zY2hlbWEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEseUJBQXlCO0FBQ3pCLDZCQUE2QjtBQUM3QixpQ0FBaUM7QUFDakMsNkRBQTZEO0FBQzdELDhDQUE4QztBQUU5QyxTQUFTLEdBQUcsQ0FBQyxPQUFlO0lBQzFCLHNDQUFzQztJQUN0QyxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ3ZCLENBQUM7QUFFRDs7R0FFRztBQUNILE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDO0FBRXhELE1BQU0sa0JBQWtCLEdBQXVEO0lBQzdFLFFBQVEsRUFBRSxFQUFFLFlBQVksRUFBRSxlQUFlLEVBQUU7SUFDM0MsZ0JBQWdCLEVBQUUsRUFBRSxZQUFZLEVBQUUsa0JBQWtCLEVBQUU7SUFDdEQsT0FBTyxFQUFFLEVBQUUsWUFBWSxFQUFFLGVBQWUsRUFBRTtDQUMzQyxDQUFDO0FBRVcsUUFBQSxPQUFPLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0FBRXZELFNBQWdCLE1BQU07SUFDcEIsS0FBSyxNQUFNLENBQUMsSUFBSSxlQUFPLEVBQUU7UUFDdkIsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ25CO0lBRUQsSUFBSSxFQUFFLENBQUM7QUFDVCxDQUFDO0FBTkQsd0JBTUM7QUFFRCxTQUFnQixJQUFJO0lBQ2xCLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLDZCQUE2QixDQUFDLENBQUM7SUFFekUsaUVBQWlFO0lBQ2pFLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUV0QyxNQUFNLFVBQVUsR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDO0lBQ3BDLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBRW5ELEdBQUcsQ0FBQyw0QkFBNEIsVUFBVSxPQUFPLFVBQVUsRUFBRSxDQUFDLENBQUM7SUFDL0QsRUFBRSxDQUFDLGFBQWEsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLE9BQU8sRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDekUsQ0FBQztBQVhELG9CQVdDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxTQUFnQixjQUFjLENBQUMsVUFBa0IsRUFBRSxhQUFzQixJQUFJO0lBQzNFLE1BQU0sSUFBSSxHQUFHLGtCQUFrQixDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQzVDLE1BQU0sR0FBRyxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsR0FBRyxVQUFVLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7SUFFakYsTUFBTSxRQUFRLEdBQXNCO1FBQ2xDLFFBQVEsRUFBRSxJQUFJO1FBQ2QsR0FBRyxFQUFFLElBQUk7UUFDVCxNQUFNLEVBQUUsSUFBSTtRQUNaLFlBQVksRUFBRSxLQUFLO1FBQ25CLEdBQUc7S0FDSixDQUFDO0lBRUYsTUFBTSxlQUFlLEdBQUc7UUFDdEIsZ0JBQWdCLEVBQUUsSUFBSTtLQUN2QixDQUFDO0lBRUYsTUFBTSxPQUFPLEdBQUcsR0FBRyxDQUFDLG1CQUFtQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsbUJBQW1CLENBQUMsQ0FBQyxFQUFFLGVBQWUsQ0FBQyxDQUFDO0lBQ3RHLE1BQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxZQUFZLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFFeEUsa0JBQWtCLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDM0IsbUJBQW1CLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFNUIsSUFBSSxHQUFHLEVBQUU7UUFDUCxHQUFHLENBQUMsd0JBQXdCLEdBQUcsRUFBRSxDQUFDLENBQUM7UUFDbkMsRUFBRSxDQUFDLGFBQWEsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDeEQ7SUFFRCxPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDO0FBNUJELHdDQTRCQztBQUVEOzs7Ozs7O0dBT0c7QUFDSCxTQUFTLGtCQUFrQixDQUFDLE1BQVc7SUFFckMsU0FBUyxRQUFRLENBQUMsQ0FBTTtRQUN0QixLQUFLLE1BQU0sSUFBSSxJQUFJLENBQUMsRUFBRTtZQUVwQixJQUFJLElBQUksS0FBSyxhQUFhLElBQUksT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssUUFBUSxFQUFFO2dCQUV6RCxNQUFNLFdBQVcsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzVCLE1BQU0sWUFBWSxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUM7Z0JBRS9CLElBQUksQ0FBQyxZQUFZLEVBQUU7b0JBQ2pCLHdDQUF3QztvQkFDeEMsT0FBTztvQkFDUCxTQUFTO2lCQUNWO2dCQUVELE1BQU0sc0JBQXNCLEdBQUcsR0FBRyxXQUFXLGFBQWEsWUFBWSxHQUFHLENBQUM7Z0JBRTFFLE9BQU8sQ0FBQyxDQUFDLE9BQU8sQ0FBQztnQkFDakIsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLHNCQUFzQixDQUFDO2FBRWxDO2lCQUFNLElBQUksT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssUUFBUSxFQUFFO2dCQUN0QyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7YUFDbkI7U0FDRjtJQUNILENBQUM7SUFFRCxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7QUFFbkIsQ0FBQztBQUVEOzs7OztHQUtHO0FBQ0gsU0FBUyxtQkFBbUIsQ0FBQyxNQUFXO0lBQ3RDLE1BQU0sQ0FBQyxXQUFXLENBQUMsYUFBYSxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLFdBQVcsRUFBRSxpQkFBaUIsRUFBRSxDQUFDLENBQUM7QUFDbkcsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyBzZW12ZXIgZnJvbSAnc2VtdmVyJztcbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBpbXBvcnQvbm8tZXh0cmFuZW91cy1kZXBlbmRlbmNpZXNcbmltcG9ydCAqIGFzIHRqcyBmcm9tICd0eXBlc2NyaXB0LWpzb24tc2NoZW1hJztcblxuZnVuY3Rpb24gbG9nKG1lc3NhZ2U6IHN0cmluZykge1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuICBjb25zb2xlLmxvZyhtZXNzYWdlKTtcbn1cblxuLyoqXG4gKiBXaGVyZSBzY2hlbWFzIGFyZSBjb21taXR0ZWQuXG4gKi9cbmNvbnN0IFNDSEVNQV9ESVIgPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi4vc2NoZW1hJyk7XG5cbmNvbnN0IFNDSEVNQV9ERUZJTklUSU9OUzogeyBbc2NoZW1hTmFtZTogc3RyaW5nXTogeyByb290VHlwZU5hbWU6IHN0cmluZyB9IH0gPSB7XG4gICdhc3NldHMnOiB7IHJvb3RUeXBlTmFtZTogJ0Fzc2V0TWFuaWZlc3QnIH0sXG4gICdjbG91ZC1hc3NlbWJseSc6IHsgcm9vdFR5cGVOYW1lOiAnQXNzZW1ibHlNYW5pZmVzdCcgfSxcbiAgJ2ludGVnJzogeyByb290VHlwZU5hbWU6ICdJbnRlZ01hbmlmZXN0JyB9LFxufTtcblxuZXhwb3J0IGNvbnN0IFNDSEVNQVMgPSBPYmplY3Qua2V5cyhTQ0hFTUFfREVGSU5JVElPTlMpO1xuXG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlKCkge1xuICBmb3IgKGNvbnN0IHMgb2YgU0NIRU1BUykge1xuICAgIGdlbmVyYXRlU2NoZW1hKHMpO1xuICB9XG5cbiAgYnVtcCgpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYnVtcCgpIHtcbiAgY29uc3QgdmVyc2lvbkZpbGUgPSBwYXRoLmpvaW4oU0NIRU1BX0RJUiwgJ2Nsb3VkLWFzc2VtYmx5LnZlcnNpb24uanNvbicpO1xuXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tcmVxdWlyZS1pbXBvcnRzXG4gIGNvbnN0IG1ldGFkYXRhID0gcmVxdWlyZSh2ZXJzaW9uRmlsZSk7XG5cbiAgY29uc3Qgb2xkVmVyc2lvbiA9IG1ldGFkYXRhLnZlcnNpb247XG4gIGNvbnN0IG5ld1ZlcnNpb24gPSBzZW12ZXIuaW5jKG9sZFZlcnNpb24sICdtYWpvcicpO1xuXG4gIGxvZyhgVXBkYXRpbmcgc2NoZW1hIHZlcnNpb246ICR7b2xkVmVyc2lvbn0gLT4gJHtuZXdWZXJzaW9ufWApO1xuICBmcy53cml0ZUZpbGVTeW5jKHZlcnNpb25GaWxlLCBKU09OLnN0cmluZ2lmeSh7IHZlcnNpb246IG5ld1ZlcnNpb24gfSkpO1xufVxuXG4vKipcbiAqIEdlbmVyYXRlcyBhIHNjaGVtYSBmcm9tIHR5cGVzY3JpcHQgdHlwZXMuXG4gKiBAcmV0dXJucyBKU09OIHNjaGVtYVxuICogQHBhcmFtIHNjaGVtYU5hbWUgdGhlIHNjaGVtYSB0byBnZW5lcmF0ZVxuICogQHBhcmFtIHNob3VsZEJ1bXAgd3JpdGVzIGEgbmV3IHZlcnNpb24gb2YgdGhlIHNjaGVtYSBhbmQgYnVtcHMgdGhlIG1ham9yIHZlcnNpb25cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlU2NoZW1hKHNjaGVtYU5hbWU6IHN0cmluZywgc2F2ZVRvRmlsZTogYm9vbGVhbiA9IHRydWUpIHtcbiAgY29uc3Qgc3BlYyA9IFNDSEVNQV9ERUZJTklUSU9OU1tzY2hlbWFOYW1lXTtcbiAgY29uc3Qgb3V0ID0gc2F2ZVRvRmlsZSA/IHBhdGguam9pbihTQ0hFTUFfRElSLCBgJHtzY2hlbWFOYW1lfS5zY2hlbWEuanNvbmApIDogJyc7XG5cbiAgY29uc3Qgc2V0dGluZ3M6IFBhcnRpYWw8dGpzLkFyZ3M+ID0ge1xuICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgIHJlZjogdHJ1ZSxcbiAgICB0b3BSZWY6IHRydWUsXG4gICAgbm9FeHRyYVByb3BzOiBmYWxzZSxcbiAgICBvdXQsXG4gIH07XG5cbiAgY29uc3QgY29tcGlsZXJPcHRpb25zID0ge1xuICAgIHN0cmljdE51bGxDaGVja3M6IHRydWUsXG4gIH07XG5cbiAgY29uc3QgcHJvZ3JhbSA9IHRqcy5nZXRQcm9ncmFtRnJvbUZpbGVzKFtwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vbGliL2luZGV4LmQudHMnKV0sIGNvbXBpbGVyT3B0aW9ucyk7XG4gIGNvbnN0IHNjaGVtYSA9IHRqcy5nZW5lcmF0ZVNjaGVtYShwcm9ncmFtLCBzcGVjLnJvb3RUeXBlTmFtZSwgc2V0dGluZ3MpO1xuXG4gIGF1Z21lbnREZXNjcmlwdGlvbihzY2hlbWEpO1xuICBhZGRBbnlNZXRhZGF0YUVudHJ5KHNjaGVtYSk7XG5cbiAgaWYgKG91dCkge1xuICAgIGxvZyhgR2VuZXJhdGluZyBzY2hlbWEgdG8gJHtvdXR9YCk7XG4gICAgZnMud3JpdGVGaWxlU3luYyhvdXQsIEpTT04uc3RyaW5naWZ5KHNjaGVtYSwgbnVsbCwgNCkpO1xuICB9XG5cbiAgcmV0dXJuIHNjaGVtYTtcbn1cblxuLyoqXG4gKiBSZW1vdmUgJ2RlZmF1bHQnIGZyb20gdGhlIHNjaGVtYSBzaW5jZSBpdHMgZ2VuZXJhdGVkXG4gKiBmcm9tIHRoZSB0c2RvY3MsIHdoaWNoIGFyZSBub3QgbmVjZXNzYXJpbHkgYWN0dWFsIHZhbHVlcyxcbiAqIGJ1dCByYXRoZXIgZGVzY3JpcHRpdmUgYmVoYXZpb3IuXG4gKlxuICogVG8ga2VlcCB0aGlzIGluZm9yYW10aW9uIGluIHRoZSBzY2hlbWEsIHdlIGFwcGVuZCBpdCB0byB0aGVcbiAqICdkZXNjcmlwdGlvbicgb2YgdGhlIHByb3BlcnR5LlxuICovXG5mdW5jdGlvbiBhdWdtZW50RGVzY3JpcHRpb24oc2NoZW1hOiBhbnkpIHtcblxuICBmdW5jdGlvbiBfcmVjdXJzZShvOiBhbnkpIHtcbiAgICBmb3IgKGNvbnN0IHByb3AgaW4gbykge1xuXG4gICAgICBpZiAocHJvcCA9PT0gJ2Rlc2NyaXB0aW9uJyAmJiB0eXBlb2Ygb1twcm9wXSA9PT0gJ3N0cmluZycpIHtcblxuICAgICAgICBjb25zdCBkZXNjcmlwdGlvbiA9IG9bcHJvcF07XG4gICAgICAgIGNvbnN0IGRlZmF1bHRWYWx1ZSA9IG8uZGVmYXVsdDtcblxuICAgICAgICBpZiAoIWRlZmF1bHRWYWx1ZSkge1xuICAgICAgICAgIC8vIHByb3BlcnR5IGRvZXNuJ3QgaGF2ZSBhIGRlZmF1bHQgdmFsdWVcbiAgICAgICAgICAvLyBza2lwXG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBkZXNjcmlwdGlvbldpdGhEZWZhdWx0ID0gYCR7ZGVzY3JpcHRpb259IChEZWZhdWx0ICR7ZGVmYXVsdFZhbHVlfSlgO1xuXG4gICAgICAgIGRlbGV0ZSBvLmRlZmF1bHQ7XG4gICAgICAgIG9bcHJvcF0gPSBkZXNjcmlwdGlvbldpdGhEZWZhdWx0O1xuXG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiBvW3Byb3BdID09PSAnb2JqZWN0Jykge1xuICAgICAgICBfcmVjdXJzZShvW3Byb3BdKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBfcmVjdXJzZShzY2hlbWEpO1xuXG59XG5cbi8qKlxuICogUGF0Y2ggdGhlIHByb3BlcnRpZXMgb2YgTWV0YWRhdGFFbnRyeSB0byBhbGxvd1xuICogc3BlY2lmeWluZyBhbnkgZnJlZSBmb3JtIGRhdGEuIFRoaXMgaXMgbmVlZGVkIHNpbmNlIHNvdXJjZVxuICogY29kZSBkb2Vzbid0IGFsbG93IHRoaXMgaW4gb3JkZXIgdG8gZW5mb3JjZSBzdHJpY3RlciBqc2lpXG4gKiBjb21wYXRpYmlsaXR5IGNoZWNrcy5cbiAqL1xuZnVuY3Rpb24gYWRkQW55TWV0YWRhdGFFbnRyeShzY2hlbWE6IGFueSkge1xuICBzY2hlbWEuZGVmaW5pdGlvbnMuTWV0YWRhdGFFbnRyeT8ucHJvcGVydGllcy5kYXRhLmFueU9mLnB1c2goeyBkZXNjcmlwdGlvbjogJ0ZyZWUgZm9ybSBkYXRhLicgfSk7XG59XG4iXX0=