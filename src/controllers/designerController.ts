import { Request,Response } from "express";
import { prisma } from "../../prisma";

export const getDesigners = async (req: Request, res: Response) => {
  try {
    const designers = await prisma.user.findMany({
        where: { role: 'DESIGNER' },
        
        include: { profile: true 
         },
        
    });
    res.json(designers);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
export const getDesignerById = async (req: Request, res: Response) => {
    const designerId = req.params.id;
    try {
      const designer = await prisma.user.findUnique({
        where: { id: designerId },
        include: { profile: true, designs: true },
      });
      console.log(designer);
      if (!designer) return res.status(404).json({ error: 'Designer not found' });
      res.json(designer);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  };