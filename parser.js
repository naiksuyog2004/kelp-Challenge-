
// Helper to construct nested objects
function buildNestedObject(keys, value) {
    let result = value;
    for (let i = keys.length - 1; i >= 0; i--) {
        const key = keys[i];
        result = { [key]: result };
    }
    return result;
}

// Rough deep merge 
function mergeDeep(target, source) {
    for (let key in source) {
        if (typeof source[key] === 'object' && source[key] !== null && key in target) {
            source[key] = mergeDeep(target[key], source[key]);
        }
    }
    // Copy everything from both into a new object 
    return Object.assign({}, target, source);
}


function parseCSV(csvContent) {
    if (!csvContent || typeof csvContent !== 'string') {
        console.warn("CSV content missing or invalid.");
        return [];
    }

    const lines = csvContent.trim().split('\n');

    if (lines.length < 2) {
        // Not enough data to parse
        console.error("CSV content has no data rows.");
        return [];
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const result = [];

    for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',').map(v => v.trim());
        let userCore = {};
        let miscFields = {};

        for (let j = 0; j < headers.length; j++) {
            const header = headers[j];
            const val = row[j];
            const nested = buildNestedObject(header.split('.'), val);

            // Manually checking known fields
            if (header === 'name.firstName' || header === 'name.lastName' || header === 'age' || header.startsWith('address')) {
                userCore = mergeDeep(userCore, nested);
            } else {
                miscFields = mergeDeep(miscFields, nested);
            }
        }


        const first = userCore.name?.firstName || '';
        const last = userCore.name?.lastName || '';
        const fullName = `${first} ${last}`.trim();

        const parsedAge = parseInt(userCore.age, 10);
        const userAge = isNaN(parsedAge) ? null : parsedAge;


        result.push({
            name: fullName,
            age: userAge,
            address: userCore.address || null,
            additional_info: miscFields,
        });
    }

    return result;
}


module.exports = parseCSV;
