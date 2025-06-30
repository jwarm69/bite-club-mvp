"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const auth_1 = require("./auth");
const prisma = new client_1.PrismaClient();
async function seed() {
    try {
        console.log('🌱 Starting database seeding...');
        // Create schools
        const fau = await prisma.school.create({
            data: {
                name: 'Florida Atlantic University',
                domain: 'fau.edu',
                location: 'Boca Raton, FL',
                active: true
            }
        });
        const uf = await prisma.school.create({
            data: {
                name: 'University of Florida',
                domain: 'ufl.edu',
                location: 'Gainesville, FL',
                active: true
            }
        });
        console.log('🏫 Created schools');
        // Create admin user
        const adminPassword = await (0, auth_1.hashPassword)('admin123');
        const admin = await prisma.user.create({
            data: {
                email: 'admin@biteclub.com',
                passwordHash: adminPassword,
                role: client_1.UserRole.ADMIN,
                firstName: 'Admin',
                lastName: 'User',
                active: true
            }
        });
        console.log('👑 Created admin user');
        // Create sample student
        const studentPassword = await (0, auth_1.hashPassword)('student123');
        const student = await prisma.user.create({
            data: {
                email: 'student@fau.edu',
                passwordHash: studentPassword,
                role: client_1.UserRole.STUDENT,
                firstName: 'John',
                lastName: 'Doe',
                schoolId: fau.id,
                creditBalance: 50.00,
                active: true
            }
        });
        console.log('🎓 Created sample student');
        // Create sample restaurant user
        const restaurantPassword = await (0, auth_1.hashPassword)('restaurant123');
        const restaurantUser = await prisma.user.create({
            data: {
                email: 'pizza@fau.edu',
                passwordHash: restaurantPassword,
                role: client_1.UserRole.RESTAURANT,
                phone: '+1-561-555-0123',
                schoolId: fau.id,
                active: true
            }
        });
        // Create sample restaurant
        const restaurant = await prisma.restaurant.create({
            data: {
                name: 'Campus Pizza Palace',
                phone: '+1-561-555-0123',
                email: 'pizza@fau.edu',
                schoolId: fau.id,
                description: 'Best pizza on campus with fresh ingredients and quick service',
                active: true,
                callEnabled: true
            }
        });
        // Create restaurant promotions
        await prisma.restaurantPromotions.create({
            data: {
                restaurantId: restaurant.id,
                firstTimeEnabled: true,
                firstTimePercent: 20.00, // 20% off
                loyaltyEnabled: true,
                loyaltySpendThreshold: 50.00, // Spend $50
                loyaltyRewardAmount: 10.00 // Get $10 free
            }
        });
        console.log('🍕 Created sample restaurant');
        // Create sample menu items with modifiers
        const pizzaModifiers = {
            groups: [
                {
                    id: 'size',
                    name: 'Size',
                    required: true,
                    multiSelect: false,
                    modifiers: [
                        { id: 'small', name: 'Small (12")', price: 0 },
                        { id: 'medium', name: 'Medium (14")', price: 3.00 },
                        { id: 'large', name: 'Large (16")', price: 6.00 }
                    ]
                },
                {
                    id: 'toppings',
                    name: 'Toppings',
                    required: false,
                    multiSelect: true,
                    maxSelections: 8,
                    modifiers: [
                        { id: 'pepperoni', name: 'Pepperoni', price: 2.00 },
                        { id: 'mushrooms', name: 'Mushrooms', price: 1.50 },
                        { id: 'sausage', name: 'Italian Sausage', price: 2.50 },
                        { id: 'peppers', name: 'Bell Peppers', price: 1.50 },
                        { id: 'onions', name: 'Red Onions', price: 1.50 },
                        { id: 'olives', name: 'Black Olives', price: 1.50 },
                        { id: 'extra_cheese', name: 'Extra Cheese', price: 2.00 },
                        { id: 'pineapple', name: 'Pineapple', price: 2.00 }
                    ]
                },
                {
                    id: 'crust',
                    name: 'Crust Type',
                    required: true,
                    multiSelect: false,
                    modifiers: [
                        { id: 'thin', name: 'Thin Crust', price: 0 },
                        { id: 'thick', name: 'Thick Crust', price: 1.00 },
                        { id: 'stuffed', name: 'Stuffed Crust', price: 3.00 }
                    ]
                }
            ]
        };
        await prisma.menuItem.create({
            data: {
                restaurantId: restaurant.id,
                name: 'Margherita Pizza',
                description: 'Fresh mozzarella, tomato sauce, and basil',
                price: 12.99,
                category: 'Pizza',
                available: true,
                modifiers: pizzaModifiers
            }
        });
        await prisma.menuItem.create({
            data: {
                restaurantId: restaurant.id,
                name: 'Pepperoni Pizza',
                description: 'Classic pepperoni with mozzarella cheese',
                price: 14.99,
                category: 'Pizza',
                available: true,
                modifiers: pizzaModifiers
            }
        });
        // Create wings with modifiers
        const wingsModifiers = {
            groups: [
                {
                    id: 'quantity',
                    name: 'Quantity',
                    required: true,
                    multiSelect: false,
                    modifiers: [
                        { id: '6pc', name: '6 pieces', price: 0 },
                        { id: '12pc', name: '12 pieces', price: 6.00 },
                        { id: '18pc', name: '18 pieces', price: 12.00 }
                    ]
                },
                {
                    id: 'sauce',
                    name: 'Sauce',
                    required: true,
                    multiSelect: false,
                    modifiers: [
                        { id: 'buffalo', name: 'Buffalo (Hot)', price: 0 },
                        { id: 'bbq', name: 'BBQ', price: 0 },
                        { id: 'honey_mustard', name: 'Honey Mustard', price: 0 },
                        { id: 'garlic_parm', name: 'Garlic Parmesan', price: 0.50 },
                        { id: 'extra_hot', name: 'Extra Hot', price: 0.50 }
                    ]
                },
                {
                    id: 'sides',
                    name: 'Sides',
                    required: false,
                    multiSelect: true,
                    modifiers: [
                        { id: 'ranch', name: 'Ranch Dip', price: 0.50 },
                        { id: 'blue_cheese', name: 'Blue Cheese Dip', price: 0.50 },
                        { id: 'celery', name: 'Celery Sticks', price: 1.00 }
                    ]
                }
            ]
        };
        await prisma.menuItem.create({
            data: {
                restaurantId: restaurant.id,
                name: 'Buffalo Wings',
                description: 'Crispy chicken wings with your choice of sauce',
                price: 8.99,
                category: 'Wings',
                available: true,
                modifiers: wingsModifiers
            }
        });
        console.log('🍽️ Created sample menu items');
        // Create customer relationship for first-time discount tracking
        await prisma.customerRelationship.create({
            data: {
                userId: student.id,
                restaurantId: restaurant.id,
                isFirstTime: true,
                totalSpent: 0,
                loyaltyProgress: 0
            }
        });
        console.log('🤝 Created customer relationship');
        console.log('✅ Database seeding completed successfully!');
        console.log('\n📋 Sample credentials:');
        console.log('Admin: admin@biteclub.com / admin123');
        console.log('Student: student@fau.edu / student123');
        console.log('Restaurant: pizza@fau.edu / restaurant123');
    }
    catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
    }
    finally {
        await prisma.$disconnect();
    }
}
seed().catch((error) => {
    console.error(error);
    process.exit(1);
});
//# sourceMappingURL=seed.js.map