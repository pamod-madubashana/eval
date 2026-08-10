const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const outputDir = path.join(__dirname, "..", "test-profiles");
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const candidates = [
  {
    name: "Tharusha Perera",
    email: "tharusha.perera@email.com",
    phone: "+1 (212) 555-0147",
    location: "New York, NY",
    role: "Senior Frontend Engineer",
    summary:
      "Passionate frontend engineer with 6+ years of experience building scalable web applications. Expert in React ecosystem and modern JavaScript frameworks. Strong focus on performance optimization and accessible UI design.",
    experience: [
      {
        title: "Senior Frontend Developer",
        company: "Dialog Axiata PLC",
        period: "2021 - Present",
        details: [
          "Led development of enterprise React dashboard serving 500K+ users",
          "Reduced bundle size by 40% through code splitting and lazy loading",
          "Implemented design system used across 5 internal products",
          "Mentored 4 junior developers on React best practices",
        ],
      },
      {
        title: "Frontend Developer",
        company: "WSO2",
        period: "2019 - 2021",
        details: [
          "Built micro-frontend architecture for cloud management console",
          "Integrated TypeScript across legacy JavaScript codebase",
          "Achieved 95% test coverage with Jest and React Testing Library",
        ],
      },
      {
        title: "Junior Developer",
        company: "Virtusa",
        period: "2018 - 2019",
        details: [
          "Developed responsive web interfaces for banking clients",
          "Collaborated with UX team on design implementation",
        ],
      },
    ],
    skills: [
      "React",
      "TypeScript",
      "Next.js",
      "Redux",
      "Tailwind CSS",
      "GraphQL",
      "Jest",
      "Webpack",
      "Git",
      "Figma",
    ],
    education: "BSc Computer Science - University of Colombo (2018)",
  },
  {
    name: "Sahan Wickramasinghe",
    email: "sahan.wick@email.com",
    phone: "+1 (415) 555-0234",
    location: "San Francisco, CA",
    role: "Backend Engineer",
    summary:
      "Backend engineer with 4 years of experience designing and building RESTful APIs and microservices. Proficient in Node.js and Python with strong database design skills. Passionate about building reliable, well-documented systems.",
    experience: [
      {
        title: "Backend Developer",
        company: "Zone24x7",
        period: "2022 - Present",
        details: [
          "Designed and built REST APIs handling 10K+ requests per minute",
          "Migrated monolith to microservices architecture using Docker",
          "Implemented CI/CD pipelines reducing deployment time by 60%",
          "Optimized PostgreSQL queries improving response times by 3x",
        ],
      },
      {
        title: "Software Engineer",
        company: "CodeGen International",
        period: "2020 - 2022",
        details: [
          "Developed payment processing integration for hotel booking system",
          "Built real-time notification service using WebSockets",
          "Wrote comprehensive API documentation with Swagger",
        ],
      },
    ],
    skills: [
      "Node.js",
      "Python",
      "Express",
      "PostgreSQL",
      "Redis",
      "Docker",
      "AWS",
      "REST APIs",
      "Git",
      "Linux",
    ],
    education: "BSc Information Technology - University of Moratuwa (2020)",
  },
  {
    name: "Kanishka Fernando",
    email: "kanishka.f@email.com",
    phone: "+1 (512) 555-0369",
    location: "Austin, TX",
    role: "Full-Stack Developer",
    summary:
      "Motivated full-stack developer with 2 years of hands-on experience. Quick learner with a solid foundation in JavaScript, React, and Node.js. Eager to contribute to challenging projects and grow in a collaborative team environment.",
    experience: [
      {
        title: "Junior Full-Stack Developer",
        company: "Mitra Innovation",
        period: "2023 - Present",
        details: [
          "Built and maintained features for e-commerce platform using React and Node.js",
          "Developed RESTful APIs with Express.js and MongoDB",
          "Implemented user authentication with JWT and OAuth2",
          "Participated in agile sprints and code reviews",
        ],
      },
      {
        title: "Intern Developer",
        company: "WSO2",
        period: "2022 - 2023",
        details: [
          "Contributed to open-source API management project",
          "Fixed 15+ bugs and improved test coverage by 20%",
          "Learned enterprise development workflows and Git best practices",
        ],
      },
    ],
    skills: [
      "JavaScript",
      "React",
      "Node.js",
      "Express",
      "MongoDB",
      "HTML/CSS",
      "Git",
      "REST APIs",
      "Bootstrap",
      "MySQL",
    ],
    education: "BSc Software Engineering - SLIIT (2022)",
  },
];

function createResume(candidate, filePath) {
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  // Name
  doc
    .fontSize(22)
    .font("Helvetica-Bold")
    .text(candidate.name, { align: "center" });

  // Contact
  doc
    .fontSize(9)
    .font("Helvetica")
    .text(
      `${candidate.email} | ${candidate.phone} | ${candidate.location}`,
      { align: "center" }
    );

  doc.moveDown(0.5);

  // Divider
  doc
    .moveTo(50, doc.y)
    .lineTo(545, doc.y)
    .strokeColor("#cccccc")
    .stroke();

  doc.moveDown(0.5);

  // Professional Summary
  doc.fontSize(12).font("Helvetica-Bold").text("Professional Summary");
  doc.moveDown(0.2);
  doc.fontSize(10).font("Helvetica").text(candidate.summary);

  doc.moveDown(0.5);

  // Skills
  doc.fontSize(12).font("Helvetica-Bold").text("Skills");
  doc.moveDown(0.2);
  doc.fontSize(10).font("Helvetica").text(candidate.skills.join(", "));

  doc.moveDown(0.5);

  // Experience
  doc.fontSize(12).font("Helvetica-Bold").text("Experience");
  doc.moveDown(0.3);

  for (const exp of candidate.experience) {
    doc.fontSize(10).font("Helvetica-Bold").text(exp.title);
    doc
      .fontSize(9)
      .font("Helvetica-Oblique")
      .text(`${exp.company} | ${exp.period}`);
    doc.moveDown(0.1);

    for (const detail of exp.details) {
      doc.fontSize(9).font("Helvetica").text(`  •  ${detail}`, {
        indent: 10,
      });
    }
    doc.moveDown(0.3);
  }

  // Education
  doc.fontSize(12).font("Helvetica-Bold").text("Education");
  doc.moveDown(0.2);
  doc.fontSize(10).font("Helvetica").text(candidate.education);

  doc.end();

  return new Promise((resolve) => stream.on("finish", resolve));
}

async function main() {
  for (const candidate of candidates) {
    const fileName = `${candidate.name.split(" ")[0].toLowerCase()}_resume.pdf`;
    const filePath = path.join(outputDir, fileName);
    await createResume(candidate, filePath);
    console.log(`Generated: ${fileName}`);
  }
  console.log(`\nAll resumes saved to: ${outputDir}`);
}

main();
