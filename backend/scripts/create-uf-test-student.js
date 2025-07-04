"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function createUFTestStudent() {
    console.log('🎓 Creating UF test student to access all restaurants...');
    try {
        // Get UF school
        const ufSchool = await prisma.school.findUnique({
            where: { domain: 'ufl.edu' }
        });
        if (!ufSchool) {
            throw new Error('University of Florida school not found');
        }
        console.log(`✅ Found UF school: ${ufSchool.name}`);
        // Check if UF test student already exists
        const existingStudent = await prisma.user.findUnique({
            where: { email: 'student@ufl.edu' }
        });
        if (existingStudent) {
            console.log('⚠️  UF test student already exists, updating password...');
            const hashedPassword = await bcrypt.hash('student123', 10);
            await prisma.user.update({
                where: { email: 'student@ufl.edu' },
                data: { passwordHash: hashedPassword }
            });
            console.log('✅ Updated existing UF student password');
        }
        else {
            console.log('🆕 Creating new UF test student...');
            const hashedPassword = await bcrypt.hash('student123', 10);
            const newStudent = await prisma.user.create({
                data: {
                    email: 'student@ufl.edu',
                    passwordHash: hashedPassword,
                    role: 'STUDENT',
                    schoolId: ufSchool.id,
                    firstName: 'UF',
                    lastName: 'Student',
                    creditBalance: 50.00, // Give them some test credits
                    active: true
                }
            });
            console.log('✅ Created new UF test student');
        }
        // Check restaurant count for UF
        const ufRestaurantCount = await prisma.restaurant.count({
            where: { schoolId: ufSchool.id }
        });
        console.log(`🏪 UF has ${ufRestaurantCount} restaurants available`);
        console.log('\n🎉 UF Test Student Ready!');
        console.log('📍 Login credentials:');
        console.log('   Email: student@ufl.edu');
        console.log('   Password: student123');
        console.log(`   School: ${ufSchool.name}`);
        console.log(`   Will see: ${ufRestaurantCount} restaurants`);
        console.log('\n📋 Complete Test Credentials:');
        console.log('   FAU Student: student@fau.edu / student123 (1 restaurant)');
        console.log('   UF Student: student@ufl.edu / student123 (26 restaurants) ✨');
        console.log('   Restaurant: pizza@fau.edu / restaurant123');
        console.log('   Admin: admin@biteclub.com / admin123');
    }
    catch (error) {
        console.error('❌ Error creating UF test student:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
createUFTestStudent();
//# sourceMappingURL=create-uf-test-student.js.map