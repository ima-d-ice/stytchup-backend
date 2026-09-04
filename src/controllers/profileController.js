// GET /profile/settings
const { prisma } = require('../../prisma');

const getSettings = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user },
      include: {
        profile: true,
        addresses: true,
      }
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    const { password, ...safeUser } = user;
    res.json(safeUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// PUT /profile/update
const updateProfile = async (req, res) => {
  // 1. Destructure all incoming fields
  const { avatarUrl, bio, location, website, skills, name, instagram, behance } = req.body;

  try {
    // 2. Update the base User Name
    if (name) {
      await prisma.user.update({
        where: { id: req.user },
        data: { name }
      });
    }

    // 3. Prepare Data for Profile
    // Convert skills string to array if it came in as a string
    let skillsArray = skills;
    if (typeof skills === 'string') {
        skillsArray = skills.split(',').map((s) => s.trim()).filter(Boolean);
    }

    // Pack social links into a JSON object
    const socialLinksJson = {
        instagram: instagram || "",
        behance: behance || ""
    };

    // 4. Upsert Profile
    const updatedProfile = await prisma.userProfile.upsert({
      where: { userId: req.user },
      update: {
        avatarUrl,
        bio,
        location,
        website,
        skills: skillsArray,     // Save as Array
        socialLinks: socialLinksJson // Save as JSON
      },
      create: {
        userId: req.user,
        avatarUrl,
        bio,
        location,
        website,
        skills: skillsArray,
        socialLinks: socialLinksJson
      }
    });

    res.json(updatedProfile);
  } catch (err) {
    console.error("Update Error:", err);
    res.status(500).json({ error: "Could not update profile", details: err.message });
  }
};

const addAddress = async (req, res) => {
    const { label, street, city, state, zip, country } = req.body;

  try {
    const newAddress = await prisma.address.create({
      data: {
        userId: req.user,
        label,
        street,
        city,
        state,
        zip,
        country
      }
    });
    res.json(newAddress);
  } catch (err) {
    res.status(500).json({ error: "Could not add address" });
  }
};

module.exports = { getSettings, updateProfile, addAddress };
