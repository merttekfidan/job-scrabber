const { Client } = require('pg');

const connectionString = process.argv[2];

if (!connectionString) {
    console.error('❌ Hata: Bağlantı adresini vermedin.');
    console.error('Kullanım: node migrate_production.js "postgresql://..."');
    process.exit(1);
}

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

const fs = require('fs');

async function migrate() {
    console.log('🔌 Veritabanına bağlanılıyor...');
    try {
        await client.connect();

        // 0. Tabloları oluştur (Schema Migration)
        console.log('🏗️  Tablolar kontrol ediliyor (Schema)...');
        const schemaSql = fs.readFileSync('./schema.sql', 'utf8');
        await client.query(schemaSql);
        console.log('✅ Schema uygulandı.');

        // 1. Kullanıcıyı oluştur
        await client.query(`
            INSERT INTO users (name, email, email_verified, image) 
            VALUES ('merttekfidan', 'merttekfidan@gmail.com', NOW(), NULL) 
            ON CONFLICT (email) DO NOTHING;
        `);
        console.log('✅ Kullanıcı (merttekfidan) doğrulandı.');

        // 2. Verileri taşı
        const res = await client.query(`
            UPDATE applications 
            SET user_id = (SELECT id FROM users WHERE email = 'merttekfidan@gmail.com') 
            WHERE user_id IS NULL;
        `);
        console.log(`🚀 ${res.rowCount} adet eski veri hesabına aktarıldı.`);

        // 3. Kontrol et
        const countRes = await client.query(`
            SELECT COUNT(*) as count FROM applications 
            WHERE user_id = (SELECT id FROM users WHERE email = 'merttekfidan@gmail.com');
        `);
        console.log(`🎉 Toplam ${countRes.rows[0].count} başvuru şu an hesabında görünüyor.`);

    } catch (error) {
        console.error('❌ Bir hata oluştu:', error);
    } finally {
        await client.end();
    }
}

migrate();
