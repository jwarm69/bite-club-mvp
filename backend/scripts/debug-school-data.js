const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugSchoolData() {
  try {
    console.log('🔍 Debugging school data for UF test student...');
    
    // Check UF test student's school data
    const ufStudent = await prisma.user.findUnique({
      where: { email: 'student@ufl.edu' },
      include: {
        school: true
      }
    });
    
    console.log('📚 UF Test Student:', {
      email: ufStudent?.email,
      schoolId: ufStudent?.schoolId,
      school: ufStudent?.school
    });
    
    // Check all schools
    const allSchools = await prisma.school.findMany({
      select: {
        id: true,
        name: true,
        domain: true,
        active: true
      }
    });
    
    console.log('\n🏫 All schools in database:');
    allSchools.forEach(school => {
      console.log(`  - ${school.name}: ${school.domain} (active: ${school.active})`);
    });
    
    // Check restaurants by UF school
    const ufSchool = allSchools.find(s => s.name.includes('Florida'));
    if (ufSchool) {
      console.log(`\n🍽️ Restaurants for ${ufSchool.name} (${ufSchool.domain}):`);
      const restaurants = await prisma.restaurant.findMany({
        where: { 
          schoolId: ufSchool.id,
          active: true 
        },
        select: {
          id: true,
          name: true,
          active: true
        }
      });
      
      console.log(`  Found ${restaurants.length} restaurants:`);
      restaurants.forEach(r => {
        console.log(`    - ${r.name} (${r.id})`);
      });
    }
    
    // Test the API endpoint logic
    if (ufStudent?.school?.domain) {
      console.log(`\n🔌 Testing API endpoint for domain: ${ufStudent.school.domain}`);
      
      const apiRestaurants = await prisma.restaurant.findMany({
        where: { 
          school: {
            domain: ufStudent.school.domain,
            active: true
          },
          active: true 
        },
        select: {
          id: true,
          name: true,
          description: true
        }
      });
      
      console.log(`  API would return ${apiRestaurants.length} restaurants:`);
      apiRestaurants.forEach(r => {
        console.log(`    - ${r.name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugSchoolData();