/**
 * Merkle tree generation script.
 * Run weekly via cron: bun run packages/api/src/scripts/generate-merkle.ts
 *
 * Reads all wallet scores, builds a Merkle tree, stores proofs in DB,
 * and prints the root for on-chain submission via ScoreMerkleRoot.updateMerkleRoot().
 */
import { buildMerkleTree, storeMerkleProofs } from '../services/merkle.js';

async function main() {
  console.log('Building Merkle tree from all wallet scores...');
  const tree = await buildMerkleTree();

  console.log(`Leaves: ${tree.leaves.length}`);
  console.log(`Root:   ${tree.root}`);

  console.log('Storing proofs in database...');
  await storeMerkleProofs(tree);

  console.log('Done. Submit this root on-chain:');
  console.log(`  ScoreMerkleRoot.updateMerkleRoot(${tree.root})`);

  process.exit(0);
}

main().catch((err) => {
  console.error('Merkle generation failed:', err);
  process.exit(1);
});
