const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Create default admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = await prisma.adminUser.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            passwordHash: hashedPassword,
            role: 'admin'
        }
    });

    console.log('✅ Created admin user:', admin.username);

    // Create default DJ user
    const djPassword = await bcrypt.hash('dj123', 10);

    const dj = await prisma.adminUser.upsert({
        where: { username: 'dj' },
        update: {},
        create: {
            username: 'dj',
            passwordHash: djPassword,
            role: 'dj'
        }
    });

    console.log('✅ Created DJ user:', dj.username);

    // Create default settings
    const settings = [
        { key: 'min_bid_amount', value: '50' },
        { key: 'default_vibe_duration', value: '2' },
        { key: 'currency_symbol', value: '₹' },
        { key: 'app_name', value: 'UPNEXT' }
    ];

    for (const setting of settings) {
        await prisma.setting.upsert({
            where: { key: setting.key },
            update: { value: setting.value },
            create: setting
        });
    }

    console.log('✅ Created default settings');

    console.log('🎉 Seeding complete!');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
