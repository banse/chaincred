import { PROTOCOL_REGISTRY, type ProtocolDefinition } from '@chaincred/common';

const contractToProtocol = new Map<string, ProtocolDefinition>();

// Build lookup from contract address → protocol
function buildIndex() {
  for (const protocol of PROTOCOL_REGISTRY) {
    for (const [_chainId, addresses] of Object.entries(protocol.contracts)) {
      for (const address of addresses) {
        contractToProtocol.set(address.toLowerCase(), protocol);
      }
    }
  }
}

buildIndex();

export function lookupProtocol(contractAddress: string): ProtocolDefinition | undefined {
  return contractToProtocol.get(contractAddress.toLowerCase());
}

export function getProtocolName(contractAddress: string): string | undefined {
  return lookupProtocol(contractAddress)?.name;
}
