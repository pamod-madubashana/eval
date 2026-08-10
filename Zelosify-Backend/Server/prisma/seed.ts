import { PrismaClient, OpeningStatus } from "@prisma/client";

const prisma = new PrismaClient();

const TENANT_ID = "c36a8dbf-a102-4737-b248-61a875e56ef6";
const HIRING_MANAGER_ID = "c8d6c5fb-c40d-4dd6-8327-7ace2669db31"; // admin user

const openings = [
  {
    title: "Senior React Developer",
    description: "Looking for an experienced React developer to join our frontend team.",
    location: "New York, NY",
    contractType: "Full-Time",
    experienceMin: 5,
    experienceMax: 8,
  },
  {
    title: "Backend Node.js Engineer",
    description: "Need a skilled Node.js developer for API development.",
    location: "Remote",
    contractType: "Full-Time",
    experienceMin: 3,
    experienceMax: 6,
  },
  {
    title: "DevOps Engineer",
    description: "Looking for DevOps engineer with AWS experience.",
    location: "San Francisco, CA",
    contractType: "Contract",
    experienceMin: 4,
    experienceMax: 7,
  },
  {
    title: "Junior Frontend Developer",
    description: "Entry-level position for aspiring frontend developers.",
    location: "Austin, TX",
    contractType: "Full-Time",
    experienceMin: 1,
    experienceMax: 3,
  },
  {
    title: "Senior Cloud Architect",
    description: "Design and implement cloud infrastructure solutions.",
    location: "Seattle, WA",
    contractType: "Contract",
    experienceMin: 7,
    experienceMax: 12,
  },
  {
    title: "Data Engineer",
    description: "Build and maintain data pipelines.",
    location: "Remote",
    contractType: "Full-Time",
    experienceMin: 3,
    experienceMax: 6,
  },
  {
    title: "QA Automation Engineer",
    description: "Create and maintain automated test suites.",
    location: "Chicago, IL",
    contractType: "Full-Time",
    experienceMin: 2,
    experienceMax: 5,
  },
  {
    title: "Senior Python Developer",
    description: "Build scalable Python applications.",
    location: "Boston, MA",
    contractType: "Contract",
    experienceMin: 5,
    experienceMax: 9,
  },
  {
    title: "Mobile App Developer",
    description: "React Native developer for cross-platform apps.",
    location: "Miami, FL",
    contractType: "Full-Time",
    experienceMin: 3,
    experienceMax: 6,
  },
  {
    title: "Security Engineer",
    description: "Implement security best practices and conduct audits.",
    location: "Washington, DC",
    contractType: "Full-Time",
    experienceMin: 4,
    experienceMax: 8,
  },
  {
    title: "AI/ML Engineer",
    description: "Develop machine learning models and AI solutions.",
    location: "Remote",
    contractType: "Contract",
    experienceMin: 4,
    experienceMax: 10,
  },
  {
    title: "Technical Lead",
    description: "Lead a team of developers and make architectural decisions.",
    location: "New York, NY",
    contractType: "Full-Time",
    experienceMin: 8,
    experienceMax: 15,
  },
  {
    title: "Full Stack Developer",
    description: "Work on both frontend and backend technologies.",
    location: "Portland, OR",
    contractType: "Full-Time",
    experienceMin: 3,
    experienceMax: 7,
  },
  {
    title: "Database Administrator",
    description: "Manage and optimize database systems.",
    location: "Denver, CO",
    contractType: "Contract",
    experienceMin: 5,
    experienceMax: 10,
  },
];

async function main() {
  console.log("Seeding...");

  // Create "Bruce Wayne Corp" tenant (idempotent)
  const tenant = await prisma.tenants.upsert({
    where: { tenantId: TENANT_ID },
    update: {},
    create: {
      tenantId: TENANT_ID,
      companyName: "Bruce Wayne Corp",
    },
  });
  console.log(`Tenant: ${tenant.companyName} (${tenant.tenantId})`);

  // Create openings
  for (const opening of openings) {
    await prisma.opening.create({
      data: {
        tenantId: TENANT_ID,
        hiringManagerId: HIRING_MANAGER_ID,
        ...opening,
        status: OpeningStatus.OPEN,
      },
    });
    console.log(`Created: ${opening.title}`);
  }

  console.log(`\nSeeded ${openings.length} openings successfully!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
