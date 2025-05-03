
const fs = require('fs');
const { CSV_PATH } = require('./config');
const parseCSV = require('./parser');
const db = require('./db');


(async function main() {
    let rawCSV;
    try {
        rawCSV = fs.readFileSync(CSV_PATH, 'utf-8');
    } catch (err) {
        console.error("Could not read the CSV file. Is the path correct?", err);
        process.exit(1);
    }

    const users = parseCSV(rawCSV);

    // Resetting table 
    await db.query('DROP TABLE IF EXISTS users');
    await db.query(`
        CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            name VARCHAR NOT NULL,
            age INT NOT NULL,
            address JSONB,
            additional_info JSONB
        )
    `);

    // Insert users one by one
    for (const user of users) {
        await db.query(
            'INSERT INTO users(name, age, address, additional_info) VALUES($1, $2, $3, $4)',
            [user.name, user.age, user.address, user.additional_info]
        );
    }

    // Age distribution calculation
    const result = await db.query('SELECT age FROM users');
    const ageStats = { '<20': 0, '20-40': 0, '40-60': 0, '>60': 0 };
    const totalUsers = result.rows.length;


    result.rows.forEach(row => {
        const age = row.age;
        if (age < 20) ageStats['<20']++;
        else if (age <= 40) ageStats['20-40']++;
        else if (age <= 60) ageStats['40-60']++;
        else ageStats['>60']++;
    });

    console.log('📊 Age Distribution');
    for (const label in ageStats) {
        const pct = ((ageStats[label] / totalUsers) * 100).toFixed(2);
        console.log(`${label}: ${pct}%`);
    }

    process.exit(0);
})();
