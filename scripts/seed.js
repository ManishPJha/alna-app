/* eslint-disable @typescript-eslint/no-require-imports */
// scripts/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const restaurantNames = [
    'The Golden Spoon',
    'Sunset Bistro',
    'Ocean View Grill',
    'Mountain Peak Cafe',
    'Urban Kitchen',
    'Rustic Table',
    'Fire & Stone',
    'Green Garden Restaurant',
    'Blue Moon Diner',
    'Silver Fork',
    'The Cozy Corner',
    'Spice Route',
    'Farm to Table',
    'The Local Pub',
    'Noodle House',
    'Pizza Corner',
    'Sushi Zen',
    'Taco Fiesta',
    'Burger Palace',
    'Steakhouse Prime',
    'Italian Garden',
    'French Quarter',
    'Mediterranean Breeze',
    'Asian Fusion',
    'BBQ Smokehouse',
    'Vegetarian Delight',
    'Seafood Harbor',
    'Wine & Dine',
    'Coffee Culture',
    'Sweet Treats Bakery',
    'Morning Glory Cafe',
    'Night Owl Bar',
    'Riverside Restaurant',
    'Downtown Eatery',
    'Suburban Kitchen',
    'Highway Diner',
    'Airport Lounge',
    'Hotel Restaurant',
    'Rooftop Bar',
    'Beach Club',
    'Mountain Lodge',
    'City Center Bistro',
    'Shopping Mall Food Court',
    'Stadium Grill',
    'Conference Center Cafe',
    'University Dining',
    'Hospital Cafeteria',
    'Office Building Deli',
    'Artisan Bakery',
    'Craft Brewery',
    'Wine Bar',
    'Cocktail Lounge',
];

const cities = [
    'New York',
    'Los Angeles',
    'Chicago',
    'Houston',
    'Phoenix',
    'Philadelphia',
    'San Antonio',
    'San Diego',
    'Dallas',
    'San Jose',
    'Austin',
    'Jacksonville',
    'Fort Worth',
    'Columbus',
    'Charlotte',
    'San Francisco',
    'Indianapolis',
    'Seattle',
    'Denver',
    'Washington DC',
    'Boston',
    'El Paso',
    'Nashville',
    'Detroit',
    'Oklahoma City',
    'Portland',
    'Las Vegas',
    'Memphis',
    'Louisville',
    'Baltimore',
    'Milwaukee',
    'Albuquerque',
    'Tucson',
    'Fresno',
    'Mesa',
    'Sacramento',
    'Atlanta',
    'Kansas City',
    'Colorado Springs',
    'Raleigh',
    'Omaha',
    'Miami',
    'Oakland',
    'Minneapolis',
    'Tulsa',
    'Cleveland',
    'Wichita',
    'Arlington',
    'Tampa',
    'New Orleans',
];

const streetNames = [
    'Main Street',
    'Oak Avenue',
    'Pine Road',
    'Maple Drive',
    'Cedar Lane',
    'Elm Street',
    'Park Avenue',
    'First Street',
    'Second Street',
    'Broadway',
    'Washington Street',
    'Lincoln Avenue',
    'Madison Drive',
    'Jefferson Road',
    'Adams Street',
    'Jackson Avenue',
    'Monroe Drive',
    'Wilson Street',
    'Taylor Avenue',
    'Brown Street',
    'Davis Road',
    'Miller Avenue',
    'Garcia Street',
    'Rodriguez Drive',
    'Wilson Lane',
    'Martinez Road',
    'Anderson Street',
    'Thomas Avenue',
    'Jackson Drive',
    'White Street',
];

const managerNames = [
    'John Smith',
    'Jane Doe',
    'Mike Johnson',
    'Sarah Williams',
    'David Brown',
    'Lisa Davis',
    'Robert Miller',
    'Jennifer Wilson',
    'Michael Moore',
    'Jessica Taylor',
    'Christopher Anderson',
    'Ashley Thomas',
    'Matthew Jackson',
    'Amanda White',
    'Daniel Harris',
    'Stephanie Martin',
    'James Thompson',
    'Nicole Garcia',
    'Ryan Martinez',
    'Melissa Robinson',
    'Kevin Clark',
    'Lauren Rodriguez',
    'Jason Lewis',
    'Brittany Lee',
    'Brandon Walker',
    'Samantha Hall',
    'Justin Allen',
    'Rachel Young',
    'Tyler Hernandez',
    'Kayla King',
    'Aaron Wright',
    'Megan Lopez',
    'Nathan Hill',
    'Alexis Scott',
    'Zachary Green',
    'Victoria Adams',
    'Caleb Baker',
    'Hannah Gonzalez',
    'Ian Nelson',
    'Olivia Carter',
    'Ethan Mitchell',
    'Sophia Perez',
    'Mason Roberts',
    'Emma Turner',
    'Noah Phillips',
    'Ava Campbell',
    'Lucas Parker',
    'Isabella Evans',
    'Alexander Edwards',
    'Mia Collins',
];

function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePhoneNumber() {
    const areaCode = getRandomNumber(200, 999);
    const exchange = getRandomNumber(200, 999);
    const number = getRandomNumber(1000, 9999);
    return `+1 (${areaCode}) ${exchange}-${number}`;
}

function generateEmail(name) {
    const cleanName = name.toLowerCase().replace(/\s+/g, '.');
    const domains = [
        'gmail.com',
        'yahoo.com',
        'hotmail.com',
        'outlook.com',
        'company.com',
    ];
    return `${cleanName}@${getRandomElement(domains)}`;
}

function generateAddress() {
    const number = getRandomNumber(100, 9999);
    const street = getRandomElement(streetNames);
    const city = getRandomElement(cities);
    const states = ['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI'];
    const state = getRandomElement(states);
    const zip = getRandomNumber(10000, 99999);
    return `${number} ${street}, ${city}, ${state} ${zip}`;
}

function generateDescription(restaurantName) {
    const descriptions = [
        `${restaurantName} offers an exceptional dining experience with fresh, locally-sourced ingredients.`,
        `Experience the finest cuisine at ${restaurantName}, where tradition meets modern gastronomy.`,
        `${restaurantName} provides a warm, welcoming atmosphere perfect for any occasion.`,
        `Discover authentic flavors and exceptional service at ${restaurantName}.`,
        `${restaurantName} combines classic recipes with contemporary presentation.`,
        `From farm-fresh ingredients to expertly crafted dishes, ${restaurantName} delivers quality.`,
        `${restaurantName} is renowned for its exceptional quality and friendly service.`,
        `Indulge in the finest dining experience at ${restaurantName}.`,
    ];
    return getRandomElement(descriptions);
}

async function main() {
    console.log('Starting database seeding...');

    // Clear existing data
    console.log('Clearing existing data...');
    await prisma.user.deleteMany();
    await prisma.restaurant.deleteMany();

    // Create admin user
    console.log('Creating admin user...');
    const hashedAdminPassword = await bcrypt.hash('admin123', 12);
    const adminUser = await prisma.user.create({
        data: {
            name: 'Admin User',
            email: 'admin@alna.com',
            passwordHash: hashedAdminPassword,
            role: 'ADMIN',
            isActive: true,
        },
    });
    console.log(`Created admin user: ${adminUser.email}`);

    // Create restaurants and managers
    console.log('Creating restaurants and managers...');
    const restaurants = [];
    const users = [];

    for (let i = 0; i < 50; i++) {
        const restaurantName = getRandomElement(restaurantNames);
        const managerName = getRandomElement(managerNames);

        // Create restaurant
        const restaurant = await prisma.restaurant.create({
            data: {
                name: `${restaurantName}${
                    i > 25 ? ' ' + getRandomElement(cities) : ''
                }`.trim(),
                email: generateEmail(restaurantName.replace(/\s+/g, '')),
                phone: generatePhoneNumber(),
                address: generateAddress(),
                description: generateDescription(restaurantName),
                defaultLanguage: getRandomElement([
                    'en',
                    'es',
                    'fr',
                    'de',
                    'it',
                ]),
                timezone: getRandomElement([
                    'UTC',
                    'America/New_York',
                    'America/Chicago',
                    'America/Denver',
                    'America/Los_Angeles',
                    'Europe/London',
                ]),
                themeColor: getRandomElement([
                    '#4f46e5',
                    '#7c3aed',
                    '#dc2626',
                    '#ea580c',
                    '#ca8a04',
                    '#16a34a',
                    '#0891b2',
                    '#be185d',
                ]),
                // isActive: Math.random() > 0.1,
                // menuUploaded: Math.random() > 0.3,
                // qrCodeGenerated: Math.random() > 0.2,
            },
        });
        restaurants.push(restaurant);

        // Create manager for this restaurant
        if (Math.random() > 0.2) {
            const hashedPassword = await bcrypt.hash('manager123', 12);
            const user = await prisma.user.create({
                data: {
                    name: managerName,
                    email: generateEmail(managerName),
                    passwordHash: hashedPassword,
                    role: 'MANAGER',
                    restaurantId: restaurant.id,
                    isActive: Math.random() > 0.05,
                },
            });
            users.push(user);
        }
    }

    // Create additional managers
    console.log('Creating additional managers...');
    for (let i = 0; i < 10; i++) {
        const managerName = getRandomElement(managerNames);
        const hashedPassword = await bcrypt.hash('manager123', 12);
        const user = await prisma.user.create({
            data: {
                name: `${managerName} (Unassigned)`,
                email: generateEmail(`${managerName}.unassigned`),
                passwordHash: hashedPassword,
                role: 'MANAGER',
                isActive: Math.random() > 0.1,
            },
        });
        users.push(user);
    }

    console.log('Seeding completed!');
    console.log(`Created ${restaurants.length} restaurants`);
    console.log(`Created ${users.length + 1} users`);
    console.log('Login: admin@alna.com / admin123');
}

main()
    .catch((e) => {
        console.error('Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
