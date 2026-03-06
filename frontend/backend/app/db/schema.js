db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["full_name", "email", "password_hash"],
      properties: {
        full_name: {
          bsonType: "string",
          description: "must be a string and is required",
        },

        email: {
          bsonType: "string",
          pattern: "^.+@.+$",
          description: "must be a valid email and is required",
        },

        password_hash: {
          bsonType: "string",
          description: "must be a string and is required",
        },

        phone: {
          bsonType: "string",
        },

        location: {
          bsonType: "string",
        },

        education: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["degree", "institution"],
            properties: {
              degree: { bsonType: "string" },
              institution: { bsonType: "string" },
              cgpa: { bsonType: "string" },
              start_year: { bsonType: "int" },
              end_year: { bsonType: "int" },
            },
          },
        },

        skills: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["name"],
            properties: {
              name: { bsonType: "string" },
              category: { bsonType: "string" },
              level: { bsonType: "int", minimum: 1, maximum: 5 },
            },
          },
        },

        projects: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["title", "description"],
            properties: {
              title: { bsonType: "string" },
              description: { bsonType: "string" },
              tech_stack: {
                bsonType: "array",
                items: { bsonType: "string" },
              },
              github_link: { bsonType: "string" },
              live_link: { bsonType: "string" },
            },
          },
        },

        experience: {
          bsonType: "array",
          items: {
            bsonType: "object",
            properties: {
              role: { bsonType: "string" },
              company: { bsonType: "string" },
              start_date: { bsonType: "date" },
              end_date: { bsonType: "date" },
              description: { bsonType: "string" },
            },
          },
        },

        certifications: {
          bsonType: "array",
          items: {
            bsonType: "object",
            properties: {
              title: { bsonType: "string" },
              issuer: { bsonType: "string" },
              issue_date: { bsonType: "date" },
              link: { bsonType: "string" },
            },
          },
        },

        links: {
          bsonType: "object",
          properties: {
            linkedin: { bsonType: "string" },
            github: { bsonType: "string" },
            portfolio: { bsonType: "string" },
            leetcode: { bsonType: "string" },
          },
        },

        achievements: {
          bsonType: "array",
          items: {
            bsonType: "object",
            properties: {
              title: { bsonType: "string" },
              description: { bsonType: "string" },
              date: { bsonType: "date" },
            },
          },
        },

        profile_score: {
          bsonType: "int",
          minimum: 0,
          maximum: 100,
        },

        created_at: {
          bsonType: "date",
        },

        updated_at: {
          bsonType: "date",
        },
      },
    },
  },
  validationLevel: "strict",
  validationAction: "error",
});
