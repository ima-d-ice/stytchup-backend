// Admin-only operations (all routes guarded by requireRole('ADMIN')).
const { prisma } = require('../../prisma');
const { assertTransition } = require('../lib/orderTransitions');
const { emitOrderUpdated } = require('../lib/socket');

function emitOrder(orderId, status) {
  emitOrderUpdated(orderId, status);
}

const listUsers = async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  }).catch((err) => null);
  if (!users) return res.status(500).json({ error: 'Server error' });
  res.json(users);
};

const listOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        buyer: { select: { name: true, email: true } },
        design: { select: { title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json(orders);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};

const listDesigns = async (req, res) => {
  try {
    const designs = await prisma.design.findMany({
      include: { designer: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json(designs);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};

const setUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  if (!['CUSTOMER', 'DESIGNER', 'ADMIN'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role (CUSTOMER/DESIGNER/ADMIN)' });
  }
  try {
    const updated = await prisma.user.update({ where: { id }, data: { role } });
    res.json({ id: updated.id, email: updated.email, role: updated.role });
  } catch {
    res.status(404).json({ error: 'User not found' });
  }
};

const cancelOrder = async (req, res) => {
  const { id } = req.params;
  try {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    try {
      assertTransition(order.status, 'CANCELLED');
    } catch {
      return res.status(400).json({ error: `Cannot cancel from ${order.status}` });
    }
    const updated = await prisma.order.update({ where: { id }, data: { status: 'CANCELLED' } });
    emitOrder(id, 'CANCELLED');
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};

const refundOrder = async (req, res) => {
  const { id } = req.params;
  try {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status === 'REFUNDED') return res.status(400).json({ error: 'Already refunded' });
    const updated = await prisma.order.update({ where: { id }, data: { status: 'REFUNDED' } });
    emitOrder(id, 'REFUNDED');
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};

const setDesignActive = async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;
  if (typeof isActive !== 'boolean') return res.status(400).json({ error: 'isActive boolean required' });
  try {
    const updated = await prisma.design.update({ where: { id }, data: { isActive } });
    res.json(updated);
  } catch {
    res.status(404).json({ error: 'Design not found' });
  }
};

module.exports = { listUsers, listOrders, listDesigns, setUserRole, cancelOrder, refundOrder, setDesignActive };
