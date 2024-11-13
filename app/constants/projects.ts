export interface Project {
  name: string;
  description: string;
  tech: string[];
  highlights: string[];
}

export const projects: Project[] = [
  {
    name: "Decentralized Exchange Platform",
    description: "A full-featured DEX built on Ethereum with AMM functionality",
    tech: ["Solidity", "React", "Web3.js", "TypeScript"],
    highlights: ["Automated Market Maker", "Token Swaps", "Liquidity Pools"]
  },
  {
    name: "NFT Marketplace",
    description: "A marketplace for creating, buying, and selling NFTs",
    tech: ["Next.js", "Solidity", "IPFS", "Hardhat"],
    highlights: ["NFT Minting", "Auction System", "Metadata Management"]
  },
  {
    name: "DeFi Lending Protocol",
    description: "Decentralized lending platform with yield optimization",
    tech: ["Solidity", "React", "Ethers.js", "Node.js"],
    highlights: ["Lending/Borrowing", "Yield Farming", "Risk Management"]
  }
];
