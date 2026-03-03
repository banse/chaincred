/** PRD 4.2 — Known CREATE2 factory contract addresses */
const CREATE2_FACTORIES = new Set([
  '0x4e59b44847b379578588920ca78fbf26c0b4956c', // Deterministic Deployment Proxy
  '0x0000000000ffe8b47b3e2130213b802212439497', // CREATE2 Factory
  '0x13b0d85ccb8bf860b6b79af3029fca081ae9bef2', // Generic CREATE2 Deployer
  '0xa6b71e26c5e0845f74c812102ca7114b6a896ab2', // Safe Proxy Factory
]);

export function isCreate2Factory(address: string): boolean {
  return CREATE2_FACTORIES.has(address.toLowerCase());
}
