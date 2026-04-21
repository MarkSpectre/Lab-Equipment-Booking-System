import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs'; // Import bcrypt

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed with hashed passwords...');

  const labs = [
    { name: 'IoT Lab', room: 'Room 402', supervisor: 'Prof. Sharma' },
    { name: 'Robotics Lab', room: 'Room 305', supervisor: 'Dr. Iyer' },
    { name: 'CC Lab', room: 'Room 210', supervisor: 'Prof. Fernandes' },
  ];

  for (const lab of labs) {
    await prisma.lab.upsert({
      where: { name: lab.name },
      update: {
        room: lab.room,
        supervisor: lab.supervisor,
      },
      create: lab,
    });
  }

  const [iotLab, roboticsLab, ccLab] = await Promise.all([
    prisma.lab.findUnique({ where: { name: 'IoT Lab' } }),
    prisma.lab.findUnique({ where: { name: 'Robotics Lab' } }),
    prisma.lab.findUnique({ where: { name: 'CC Lab' } }),
  ]);

  // 2. Hash the passwords
  const hashedAdminPassword = await bcrypt.hash('admin123', 10);
  const hashedStudentPassword = await bcrypt.hash('student123', 10);

  // 3. Create Admin with Hashed Password
  await prisma.user.upsert({
    where: { email: 'admin@crce.edu.in' },
    update: { password: hashedAdminPassword }, // Update password if user exists
    create: {
      email: 'admin@crce.edu.in',
      name: 'Admin User',
      password: hashedAdminPassword, 
      role: 'ADMIN',
    },
  });

  // 4. Create Student with Hashed Password
  await prisma.user.upsert({
    where: { email: 'student@crce.edu.in' },
    update: { password: hashedStudentPassword }, // Update password if user exists
    create: {
      email: 'student@crce.edu.in',
      name: 'Swapnil Kasare',
      password: hashedStudentPassword,
      role: 'STUDENT',
    },
  });

  const equipmentData = [
    {
      labId: iotLab.id,
      name: 'Arduino Uno Kit',
      category: 'Embedded Systems',
      description: 'Starter microcontroller board set',
      totalUnits: 12,
      availableUnits: 9,
      status: 'FUNCTIONAL',
      conditionNote: 'All units tested',
    },
    {
      labId: iotLab.id,
      name: 'Raspberry Pi 4',
      category: 'IoT',
      description: 'Single-board computer kit',
      totalUnits: 8,
      availableUnits: 6,
      status: 'FUNCTIONAL',
      conditionNote: 'Two adapters under replacement',
    },
    {
      labId: iotLab.id,
      name: 'DHT22 Sensor Pack',
      category: 'Sensors',
      description: 'Temperature and humidity sensors',
      totalUnits: 20,
      availableUnits: 18,
      status: 'FUNCTIONAL',
      conditionNote: null,
    },
    {
      labId: roboticsLab.id,
      name: 'VR Headsets',
      category: 'XR',
      description: 'Mixed reality test headsets',
      totalUnits: 6,
      availableUnits: 3,
      status: 'FUNCTIONAL',
      conditionNote: 'Charging dock shared',
    },
    {
      labId: roboticsLab.id,
      name: 'LIDAR Module',
      category: 'Robotics',
      description: 'Distance scanning module',
      totalUnits: 5,
      availableUnits: 4,
      status: 'FUNCTIONAL',
      conditionNote: null,
    },
    {
      labId: roboticsLab.id,
      name: 'Servo Motor Set',
      category: 'Actuators',
      description: 'Precision servo motor kits',
      totalUnits: 15,
      availableUnits: 12,
      status: 'REPAIR',
      conditionNote: 'Three units under maintenance',
    },
    {
      labId: ccLab.id,
      name: 'Dell Workstation',
      category: 'Computing',
      description: 'High-performance workstation nodes',
      totalUnits: 25,
      availableUnits: 22,
      status: 'FUNCTIONAL',
      conditionNote: null,
    },
    {
      labId: ccLab.id,
      name: 'NVIDIA GPU Box',
      category: 'AI/ML',
      description: 'External GPU acceleration unit',
      totalUnits: 4,
      availableUnits: 2,
      status: 'MISSING',
      conditionNote: 'Two units flagged for audit',
    },
    {
      labId: ccLab.id,
      name: 'Keyboard-Mouse Combo',
      category: 'Peripherals',
      description: 'Input peripheral bundles',
      totalUnits: 30,
      availableUnits: 28,
      status: 'FUNCTIONAL',
      conditionNote: null,
    },
    {
      labId: ccLab.id,
      name: 'Network Switch Kit',
      category: 'Networking',
      description: 'Managed switch practice modules',
      totalUnits: 10,
      availableUnits: 7,
      status: 'FUNCTIONAL',
      conditionNote: 'Three loaned for infra class',
    },
  ];

  for (const item of equipmentData) {
    const existing = await prisma.equipment.findFirst({
      where: {
        labId: item.labId,
        name: item.name,
      },
    });

    if (existing) {
      await prisma.equipment.update({
        where: { id: existing.id },
        data: item,
      });
    } else {
      await prisma.equipment.create({ data: item });
    }
  }

  console.log('✅ Seed successful! Passwords are now hashed in RDS.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });