const pptxgen = require("pptxgenjs");
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
      "Passionate frontend engineer with 6+ years of experience building scalable web applications. Expert in React ecosystem and modern JavaScript frameworks.",
    experience: [
      {
        title: "Senior Frontend Developer",
        company: "Dialog Axiata PLC",
        period: "2021 - Present",
        details: [
          "Led development of enterprise React dashboard serving 500K+ users",
          "Reduced bundle size by 40% through code splitting",
          "Implemented design system used across 5 internal products",
        ],
      },
      {
        title: "Frontend Developer",
        company: "WSO2",
        period: "2019 - 2021",
        details: [
          "Built micro-frontend architecture for cloud management console",
          "Achieved 95% test coverage with Jest and React Testing Library",
        ],
      },
    ],
    skills: "React, TypeScript, Next.js, Redux, Tailwind CSS, GraphQL, Jest, Webpack, Git, Figma",
    education: "BSc Computer Science - University of Colombo (2018)",
  },
  {
    name: "Sahan Wickramasinghe",
    email: "sahan.wick@email.com",
    phone: "+1 (415) 555-0234",
    location: "San Francisco, CA",
    role: "Backend Engineer",
    summary:
      "Backend engineer with 4 years of experience designing and building RESTful APIs and microservices. Proficient in Node.js and Python.",
    experience: [
      {
        title: "Backend Developer",
        company: "Zone24x7",
        period: "2022 - Present",
        details: [
          "Designed REST APIs handling 10K+ requests per minute",
          "Migrated monolith to microservices using Docker",
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
        ],
      },
    ],
    skills: "Node.js, Python, Express, PostgreSQL, Redis, Docker, AWS, REST APIs, Git, Linux",
    education: "BSc Information Technology - University of Moratuwa (2020)",
  },
  {
    name: "Kanishka Fernando",
    email: "kanishka.f@email.com",
    phone: "+1 (512) 555-0369",
    location: "Austin, TX",
    role: "Full-Stack Developer",
    summary:
      "Motivated full-stack developer with 2 years of hands-on experience. Quick learner with solid foundation in JavaScript, React, and Node.js.",
    experience: [
      {
        title: "Junior Full-Stack Developer",
        company: "Mitra Innovation",
        period: "2023 - Present",
        details: [
          "Built features for e-commerce platform using React and Node.js",
          "Developed RESTful APIs with Express.js and MongoDB",
          "Implemented user authentication with JWT and OAuth2",
        ],
      },
      {
        title: "Intern Developer",
        company: "WSO2",
        period: "2022 - 2023",
        details: [
          "Contributed to open-source API management project",
          "Fixed 15+ bugs and improved test coverage by 20%",
        ],
      },
    ],
    skills: "JavaScript, React, Node.js, Express, MongoDB, HTML/CSS, Git, REST APIs, MySQL",
    education: "BSc Software Engineering - SLIIT (2022)",
  },
];

async function createResume(candidate, filePath) {
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = candidate.name;
  pptx.title = `Resume - ${candidate.name}`;

  // --- Slide 1: Header ---
  let slide = pptx.addSlide();
  slide.addText(candidate.name, {
    x: 0.5,
    y: 0.3,
    w: "90%",
    fontSize: 28,
    fontFace: "Arial",
    bold: true,
    color: "1a1a2e",
  });
  slide.addText(candidate.role, {
    x: 0.5,
    y: 1.0,
    w: "90%",
    fontSize: 16,
    fontFace: "Arial",
    color: "4a4a6a",
  });
  slide.addText(
    `${candidate.email}  |  ${candidate.phone}  |  ${candidate.location}`,
    {
      x: 0.5,
      y: 1.4,
      w: "90%",
      fontSize: 10,
      fontFace: "Arial",
      color: "666666",
    }
  );
  slide.addShape(pptx.shapes.LINE, {
    x: 0.5,
    y: 1.8,
    w: 8.5,
    h: 0,
    line: { color: "cccccc", width: 1 },
  });

  // --- Slide 1: Summary ---
  slide.addText("Professional Summary", {
    x: 0.5,
    y: 2.0,
    w: "90%",
    fontSize: 14,
    fontFace: "Arial",
    bold: true,
    color: "1a1a2e",
  });
  slide.addText(candidate.summary, {
    x: 0.5,
    y: 2.4,
    w: 8.5,
    fontSize: 10,
    fontFace: "Arial",
    color: "333333",
    valign: "top",
    paraSpaceAfter: 6,
  });

  // --- Slide 1: Skills ---
  slide.addText("Skills", {
    x: 0.5,
    y: 3.5,
    w: "90%",
    fontSize: 14,
    fontFace: "Arial",
    bold: true,
    color: "1a1a2e",
  });
  slide.addText(candidate.skills, {
    x: 0.5,
    y: 3.9,
    w: 8.5,
    fontSize: 10,
    fontFace: "Arial",
    color: "333333",
  });

  // --- Slide 1: Education ---
  slide.addText("Education", {
    x: 0.5,
    y: 4.6,
    w: "90%",
    fontSize: 14,
    fontFace: "Arial",
    bold: true,
    color: "1a1a2e",
  });
  slide.addText(candidate.education, {
    x: 0.5,
    y: 5.0,
    w: 8.5,
    fontSize: 10,
    fontFace: "Arial",
    color: "333333",
  });

  // --- Slide 2: Experience ---
  slide = pptx.addSlide();
  slide.addText("Experience", {
    x: 0.5,
    y: 0.3,
    w: "90%",
    fontSize: 18,
    fontFace: "Arial",
    bold: true,
    color: "1a1a2e",
  });

  let yPos = 0.9;
  for (const exp of candidate.experience) {
    slide.addText(exp.title, {
      x: 0.5,
      y: yPos,
      w: 6,
      fontSize: 12,
      fontFace: "Arial",
      bold: true,
      color: "2d3436",
    });
    slide.addText(`${exp.company}  |  ${exp.period}`, {
      x: 0.5,
      y: yPos + 0.3,
      w: 6,
      fontSize: 9,
      fontFace: "Arial",
      italic: true,
      color: "636e72",
    });

    const bulletText = exp.details.map((d) => ({ text: d, options: { bullet: true, fontSize: 9 } }));
    slide.addText(bulletText, {
      x: 0.7,
      y: yPos + 0.6,
      w: 8,
      fontSize: 9,
      fontFace: "Arial",
      color: "333333",
      lineSpacingMultiple: 1.2,
    });

    yPos += 0.6 + exp.details.length * 0.28 + 0.3;
  }

  await pptx.writeFile({ fileName: filePath });
}

async function main() {
  for (const candidate of candidates) {
    const fileName = `${candidate.name.split(" ")[0].toLowerCase()}_resume.pptx`;
    const filePath = path.join(outputDir, fileName);
    await createResume(candidate, filePath);
    console.log(`Generated: ${fileName}`);
  }
  console.log(`\nAll PPTX resumes saved to: ${outputDir}`);
}

main();
