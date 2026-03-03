export interface StorageLayer {
  saveEvent(event: any): Promise<void>;
  getLastProcessedBlock(chainId: number): Promise<number>;
  setLastProcessedBlock(chainId: number, block: number): Promise<void>;
}

export function createStorage(): StorageLayer {
  // TODO: Connect to PostgreSQL via DATABASE_URL
  const blocks = new Map<number, number>();

  return {
    async saveEvent(event: any) {
      // TODO: Insert into PostgreSQL
      console.log(`[storage] Saved event: ${event.txHash}`);
    },
    async getLastProcessedBlock(chainId: number) {
      return blocks.get(chainId) || 0;
    },
    async setLastProcessedBlock(chainId: number, block: number) {
      blocks.set(chainId, block);
    },
  };
}
