import { PrismaClient, Role, Gender, HostelType, RoomType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database with test data (one record per entity)...\n");

  // 1. Create Admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@bmsce.ac.in" },
    update: {},
    create: {
      email: "admin@bmsce.ac.in",
      passwordHash: adminPassword,
      firstName: "Admin",
      lastName: "BMSCE",
      phone: "9876543210",
      role: Role.ADMIN,
    },
  });
  console.log("✅ Admin created:", admin.email);

  // 2. Create Warden user
  const wardenPassword = await bcrypt.hash("warden123", 12);
  const warden = await prisma.user.upsert({
    where: { email: "warden@bmsce.ac.in" },
    update: {},
    create: {
      email: "warden@bmsce.ac.in",
      passwordHash: wardenPassword,
      firstName: "Warden",
      lastName: "BMSCE",
      phone: "9876543211",
      role: Role.WARDEN,
    },
  });
  console.log("✅ Warden created:", warden.email);

  // 3. Create Accountant user
  const accountantPassword = await bcrypt.hash("accountant123", 12);
  const accountant = await prisma.user.upsert({
    where: { email: "accountant@bmsce.ac.in" },
    update: {},
    create: {
      email: "accountant@bmsce.ac.in",
      passwordHash: accountantPassword,
      firstName: "Accountant",
      lastName: "BMSCE",
      phone: "9876543212",
      role: Role.ACCOUNTANT,
    },
  });
  console.log("✅ Accountant created:", accountant.email);

  // 4. Create Security user
  const securityPassword = await bcrypt.hash("security123", 12);
  const security = await prisma.user.upsert({
    where: { email: "security@bmsce.ac.in" },
    update: {},
    create: {
      email: "security@bmsce.ac.in",
      passwordHash: securityPassword,
      firstName: "Security",
      lastName: "BMSCE",
      phone: "9876543213",
      role: Role.SECURITY,
    },
  });
  console.log("✅ Security created:", security.email);

  // 5. Create Student user + profile
  const studentPassword = await bcrypt.hash("student123", 12);
  const student = await prisma.user.upsert({
    where: { email: "student@bmsce.ac.in" },
    update: {},
    create: {
      email: "student@bmsce.ac.in",
      passwordHash: studentPassword,
      firstName: "Rahul",
      lastName: "Sharma",
      phone: "9876543214",
      role: Role.STUDENT,
    },
  });

  await prisma.studentProfile.upsert({
    where: { userId: student.id },
    update: {},
    create: {
      userId: student.id,
      usn: "1BM22CS001",
      department: "Computer Science",
      year: 2,
      semester: 3,
      guardianName: "Rajesh Sharma",
      guardianPhone: "9876543220",
      permanentAddress: "123 MG Road, Bengaluru, Karnataka 560001",
      bloodGroup: "O+",
      dateOfBirth: new Date("2004-05-15"),
      gender: Gender.MALE,
    },
  });
  console.log("✅ Student created:", student.email);

  // 6. Create one Hostel
  const hostel = await prisma.hostel.upsert({
    where: { name: "Vishveshwaraya Boys Hostel" },
    update: {},
    create: {
      name: "Vishveshwaraya Boys Hostel",
      type: HostelType.BOYS,
      address: "Bull Temple Road, Basavanagudi, Bengaluru",
      description: "Premier boys hostel at BMSCE campus",
      wardenId: warden.id,
      allowedYears: [2, 3],
    },
  });
  console.log("✅ Hostel created:", hostel.name);

  // 7. Create one Block
  const block = await prisma.block.upsert({
    where: { hostelId_name: { hostelId: hostel.id, name: "Block A" } },
    update: {},
    create: {
      hostelId: hostel.id,
      name: "Block A",
      description: "Main block with all amenities",
    },
  });
  console.log("✅ Block created:", block.name);

  // 8. Create one Floor
  const floor = await prisma.floor.upsert({
    where: { blockId_floorNumber: { blockId: block.id, floorNumber: 1 } },
    update: {},
    create: {
      blockId: block.id,
      floorNumber: 1,
      name: "First Floor",
    },
  });
  console.log("✅ Floor created:", floor.name);

  // 9. Create one Room
  const room = await prisma.room.upsert({
    where: { floorId_roomNumber: { floorId: floor.id, roomNumber: "101" } },
    update: {},
    create: {
      floorId: floor.id,
      roomNumber: "101",
      capacity: 3,
      type: RoomType.TRIPLE,
      feePerSemester: 45000,
      amenities: JSON.stringify(["Wi-Fi", "Attached Bathroom", "Study Table", "Wardrobe"]),
    },
  });
  console.log("✅ Room created:", room.roomNumber);

  // 10. System Config
  await prisma.systemConfig.upsert({
    where: { key: "reservation_timeout_minutes" },
    update: {},
    create: {
      key: "reservation_timeout_minutes",
      value: "4",
      description: "Time in minutes before an unpaid reservation expires",
    },
  });
  console.log("✅ System config created");

  console.log("\n🎉 Seed completed successfully!");
  console.log("\n📋 Test Credentials:");
  console.log("┌──────────────┬──────────────────────────┬──────────────┐");
  console.log("│ Role         │ Email                    │ Password     │");
  console.log("├──────────────┼──────────────────────────┼──────────────┤");
  console.log("│ Admin        │ admin@bmsce.ac.in        │ admin123     │");
  console.log("│ Warden       │ warden@bmsce.ac.in       │ warden123    │");
  console.log("│ Accountant   │ accountant@bmsce.ac.in   │ accountant123│");
  console.log("│ Security     │ security@bmsce.ac.in     │ security123  │");
  console.log("│ Student      │ student@bmsce.ac.in      │ student123   │");
  console.log("└──────────────┴──────────────────────────┴──────────────┘");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
