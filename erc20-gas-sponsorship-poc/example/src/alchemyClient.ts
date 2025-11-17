// src/alchemyClient.ts
import { createWalletClient, custom } from "viem";
import { sepolia, alchemy } from "@account-kit/infra";
import { WalletClientSigner } from "@aa-sdk/core";
import { createModularAccountAlchemyClient } from "@account-kit/smart-contracts";

const ALCHEMY_API_KEY = import.meta.env.VITE_ALCHEMY_API_KEY as string;
const GAS_POLICY_ID = import.meta.env.VITE_ALCHEMY_GAS_POLICY_ID as string;

if (!ALCHEMY_API_KEY) {
  console.warn("VITE_ALCHEMY_API_KEY 가 설정되어 있지 않습니다.");
}
if (!GAS_POLICY_ID) {
  console.warn("VITE_ALCHEMY_GAS_POLICY_ID 가 설정되어 있지 않습니다.");
}

/**
 * MetaMask EOA를 기반으로 Alchemy Modular Smart Account 클라이언트를 생성.
 * - chain: @account-kit/infra 의 sepolia (AlchemyChain)
 * - transport: alchemy({ apiKey }) → Bundler + Gas Manager 사용
 * - policyId: Gas Manager 정책 ID → 조건 만족 시 가스 스폰
 */
export async function getSmartAccountClient() {
  if (!(window as any).ethereum) {
    throw new Error("MetaMask 지갑이 필요합니다.");
  }

  // 1) MetaMask에서 계정 요청 (이미 연결되어 있으면 팝업 없이 바로 반환될 수 있음)
  const [eoaAddress] = (await (window as any).ethereum.request({
    method: "eth_requestAccounts",
  })) as `0x${string}`[];

  if (!eoaAddress) {
    throw new Error("MetaMask 계정을 찾을 수 없습니다.");
  }

  // 2) viem walletClient 생성 (EOA 기준)
  const walletClient = createWalletClient({
    account: eoaAddress,
    chain: sepolia, // @account-kit/infra 의 AlchemyChain
    transport: custom((window as any).ethereum),
  });

  const signer = new WalletClientSigner(walletClient, "json-rpc");

  // 3) Alchemy Smart Account 클라이언트 생성 (정책 ID 포함)
  const client = await createModularAccountAlchemyClient({
    chain: sepolia,
    signer,
    transport: alchemy({ apiKey: ALCHEMY_API_KEY }),
    policyId: GAS_POLICY_ID,
  });

  // EOA 주소도 같이 반환해서 어떤 지갑인지 UI에서 보여줄 수 있게 함
  return { client, eoaAddress };
}
