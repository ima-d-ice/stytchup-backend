import { Response } from 'express';
import { prisma } from '../../prisma';
import { AuthRequest } from '../middleware/authMiddleware';

// GET /profile/settings
export const getSettings = async (req: AuthRequest, res: Response) => {
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
export const updateProfile = async (req: AuthRequest, res: Response) => {
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
        skillsArray = skills.split(',').map((s: string) => s.trim()).filter(Boolean);
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
        userId: req.user!,
        avatarUrl,
        bio,
        location,
        website,
        skills: skillsArray,
        socialLinks: socialLinksJson
      }
    });

    res.json(updatedProfile);
  } catch (err: any) {
    console.error("Update Error:", err);
    res.status(500).json({ error: "Could not update profile", details: err.message });
  }
};

export const addAddress = async (req: AuthRequest, res: Response) => {
  // ... (Your existing addAddress code is fine)
    const { label, street, city, state, zip, country } = req.body;

  try {
    const newAddress = await prisma.address.create({
      data: {
        userId: req.user!,
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