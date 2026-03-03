export interface Attestation {
  uid: string;
  schema: string;
  attester: string;
  recipient: string;
  revocable: boolean;
  revoked: boolean;
  data: AttestationData;
  timestamp: number;
}

export interface AttestationData {
  walletAddress: string;
  expertiseScore: number;
  badges: string[];
  scoreBreakdownCID: string;
  schemaVersion: number;
}

export interface MerkleProof {
  address: string;
  score: number;
  proof: `0x${string}`[];
}

export interface VerifyRequest {
  address: string;
  proof: `0x${string}`[];
  score: number;
}
