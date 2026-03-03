import type { Attestation, AttestationData } from '@chaincred/common';

const EAS_GRAPHQL_URL = process.env.EAS_GRAPHQL_URL || 'https://easscan.org/graphql';
const CHAINCRED_SCHEMA_UID = process.env.CHAINCRED_SCHEMA_UID || '';

interface EASAttestationNode {
  id: string;
  schemaId: string;
  attester: string;
  recipient: string;
  revocable: boolean;
  revoked: boolean;
  decodedDataJson: string;
  timeCreated: number;
}

const ATTESTATION_QUERY = `
  query GetAttestation($recipient: String!, $schemaId: String!) {
    attestations(
      where: {
        recipient: { equals: $recipient }
        schemaId: { equals: $schemaId }
        revoked: { equals: false }
      }
      orderBy: [{ timeCreated: desc }]
      take: 1
    ) {
      id
      schemaId
      attester
      recipient
      revocable
      revoked
      decodedDataJson
      timeCreated
    }
  }
`;

function parseDecodedData(json: string): AttestationData {
  const fields: { name: string; value: { value: unknown } }[] = JSON.parse(json);
  const get = (name: string) => fields.find((f) => f.name === name)?.value?.value;

  return {
    walletAddress: String(get('walletAddress') ?? ''),
    expertiseScore: Number(get('expertiseScore') ?? 0),
    badges: (get('badges') as string[]) ?? [],
    scoreBreakdownCID: String(get('scoreBreakdownCID') ?? ''),
    schemaVersion: Number(get('schemaVersion') ?? 1),
  };
}

export async function getAttestation(address: string): Promise<Attestation | null> {
  if (!CHAINCRED_SCHEMA_UID) return null;

  const res = await fetch(EAS_GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: ATTESTATION_QUERY,
      variables: { recipient: address.toLowerCase(), schemaId: CHAINCRED_SCHEMA_UID },
    }),
  });

  if (!res.ok) {
    console.error(`EAS GraphQL error: ${res.status}`);
    return null;
  }

  const { data } = (await res.json()) as { data: { attestations: EASAttestationNode[] } };
  const node = data?.attestations?.[0];
  if (!node) return null;

  return {
    uid: node.id,
    schema: node.schemaId,
    attester: node.attester,
    recipient: node.recipient,
    revocable: node.revocable,
    revoked: node.revoked,
    data: parseDecodedData(node.decodedDataJson),
    timestamp: node.timeCreated,
  };
}
