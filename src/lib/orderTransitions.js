// Pure order-lifecycle transition map.
// Single source of truth for the Payment → Measurements → Production → Delivery flow.
// Statuses come from the Prisma OrderStatus enum.
const TRANSITIONS = {
  PENDING: ['AWAITING_REQUIREMENTS', 'CANCELLED'],
  AWAITING_REQUIREMENTS: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
  REFUNDED: [],
};

function canTransition(from, to) {
  return Boolean(TRANSITIONS[from] && TRANSITIONS[from].includes(to));
}

function assertTransition(from, to) {
  if (!TRANSITIONS[from]) throw new Error(`Unknown order status: ${from}`);
  if (!canTransition(from, to)) {
    throw new Error(`Illegal order transition ${from} -> ${to}`);
  }
}

module.exports = { TRANSITIONS, canTransition, assertTransition };
