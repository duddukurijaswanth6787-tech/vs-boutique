const fs = require('fs');
const path = require('path');

function parseSchema(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const models = {};
    let currentModel = null;

    for (let line of lines) {
        line = line.trim();
        if (line.startsWith('model ')) {
            currentModel = line.split(' ')[1];
            models[currentModel] = {};
        } else if (line.startsWith('enum ')) {
            currentModel = line.split(' ')[1];
            models[currentModel] = { _isEnum: true, values: [] };
        } else if (line.startsWith('}')) {
            currentModel = null;
        } else if (currentModel && line.length > 0 && !line.startsWith('@@') && !line.startsWith('//')) {
            if (models[currentModel]._isEnum) {
                models[currentModel].values.push(line);
            } else {
                const parts = line.split(/\s+/);
                const fieldName = parts[0];
                const fieldType = parts[1];
                if (fieldName && fieldType) {
                    models[currentModel][fieldName] = parts.slice(1).join(' ');
                }
            }
        }
    }
    return models;
}

const original = parseSchema(path.join(__dirname, '../prisma/schema.prisma.bak'));
const pulled = parseSchema(path.join(__dirname, '../prisma/schema.prisma'));

let differences = 0;

// Compare models
for (const modelName in original) {
    if (!pulled[modelName]) {
        console.log(`❌ Model ${modelName} is missing in pulled schema`);
        differences++;
        continue;
    }

    const origModel = original[modelName];
    const pullModel = pulled[modelName];

    if (origModel._isEnum) {
        // Compare enum values
        const origValues = origModel.values.map(v => v.split(/\s+/)[0]).sort();
        const pullValues = pullModel.values.map(v => v.split(/\s+/)[0]).sort();
        if (JSON.stringify(origValues) !== JSON.stringify(pullValues)) {
            console.log(`❌ Enum ${modelName} has different values:\n  Original: ${origValues.join(', ')}\n  Pulled: ${pullValues.join(', ')}`);
            differences++;
        }
    } else {
        // Compare fields
        for (const fieldName in origModel) {
            if (fieldName === '_isEnum') continue;
            if (!pullModel[fieldName]) {
                console.log(`❌ Model ${modelName}: Field ${fieldName} is missing in pulled schema`);
                differences++;
                continue;
            }

            // Normalise types (ignore differences in spacing or relation names)
            const origType = origModel[fieldName].replace(/\s+/g, ' ');
            const pullType = pullModel[fieldName].replace(/\s+/g, ' ');
            if (origType !== pullType) {
                // If it's a relation field, it might be represented slightly differently. Let's log it.
                console.log(`⚠️ Model ${modelName}: Field ${fieldName} differs:\n  Original: ${origType}\n  Pulled: ${pullType}`);
                differences++;
            }
        }

        for (const fieldName in pullModel) {
            if (fieldName === '_isEnum') continue;
            if (!origModel[fieldName]) {
                console.log(`➕ Model ${modelName}: Field ${fieldName} is new in pulled schema`);
                differences++;
            }
        }
    }
}

for (const modelName in pulled) {
    if (!original[modelName]) {
        console.log(`➕ Model ${modelName} is new in pulled schema`);
        differences++;
    }
}

if (differences === 0) {
    console.log('✅ Success: Schema matches perfectly!');
} else {
    console.log(`Found ${differences} differences/warnings.`);
}
