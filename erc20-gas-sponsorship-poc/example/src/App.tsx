// src/App.tsx
import { useState, useMemo } from "react";
import { getSmartAccountClient } from "./alchemyClient";
import {
  parseUnits,
  encodeFunctionData,
  parseAbi,
  createPublicClient,
  http,
  createWalletClient,
  custom,
} from "viem";
import { sepolia, mainnet } from "@account-kit/infra";

type ClientBundle = Awaited<ReturnType<typeof getSmartAccountClient>>;

// ─────────────────────────────────────────────────────────────
// 1. 환경 / 네트워크 / 토큰 설정
// ─────────────────────────────────────────────────────────────

// 나중에 메인넷 전환 시 여기만 바꾸면 됨
const NETWORK = (import.meta.env.VITE_NETWORK || "sepolia") as
  | "sepolia"
  | "mainnet";

const CHAIN = NETWORK === "mainnet" ? mainnet : sepolia;

// Alchemy API 키 (UserOp + public client 둘 다 사용)
const ALCHEMY_API_KEY = import.meta.env.VITE_ALCHEMY_API_KEY as string;

// 토큰 메타데이터 (테스트넷 기준)
// 메인넷 적용 시 address / name / symbol / decimals만 교체하면 됨
const TOKEN = {
  address: import.meta.env.VITE_TOKEN_ADDRESS as `0x${string}`,
  name: import.meta.env.VITE_TOKEN_NAME,
  symbol: import.meta.env.VITE_TOKEN_SYMBOL,
  decimals: 18,
} as const;

// ERC-20 transfer ABI (SCA → recipient)
const erc20Abi = parseAbi([
  "function transfer(address to, uint256 amount) returns (bool)",
]);

// ERC-20 Permit + transferFrom ABI (EOA → recipient, gasless)
const erc20PermitAbi = parseAbi([
  "function permit(address owner,address spender,uint256 value,uint256 deadline,uint8 v,bytes32 r,bytes32 s)",
  "function transferFrom(address from,address to,uint256 value) returns (bool)",
  "function nonces(address owner) view returns (uint256)",
]);

// ─────────────────────────────────────────────────────────────
// 2. React Component
// ─────────────────────────────────────────────────────────────

function App() {
  const [client, setClient] = useState<ClientBundle["client"] | null>(null);
  const [eoaAddress, setEoaAddress] = useState<string>("");
  const [scaAddress, setScaAddress] = useState<string>("");
  const [log, setLog] = useState<string>("");

  // 공통 입력값 (recipient / amount)
  const [recipient, setRecipient] = useState<string>("");
  const [amount, setAmount] = useState<string>("");

  // viem public client (nonce / 코드 조회용)
  const publicClient = useMemo(() => {
    if (!ALCHEMY_API_KEY) return null;
    return createPublicClient({
      chain: CHAIN,
      transport: http(
        `https://${
          CHAIN.id === 1 ? "eth-mainnet" : "eth-sepolia"
        }.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
      ),
    });
  }, []);

  // ─────────────────────────────────────────────────────────
  // helper: 로그 출력
  // ─────────────────────────────────────────────────────────
  const appendLog = (lines: string | string[]) => {
    setLog((prev) =>
      [prev, ...(Array.isArray(lines) ? lines : [lines])]
        .filter(Boolean)
        .join("\n")
    );
  };

  const resetLog = (msg?: string) => {
    setLog(msg || "");
  };

  // ─────────────────────────────────────────────────────────
  // 3. 지갑 연결 + Smart Account 준비
  // ─────────────────────────────────────────────────────────
  const connectWallet = async () => {
    try {
      resetLog("지갑 연결 및 Smart Account 준비 중...");

      const { client: c, eoaAddress } = await getSmartAccountClient();
      const sca = await c.getAddress();

      setClient(c);
      setEoaAddress(eoaAddress);
      setScaAddress(sca);

      resetLog(
        [
          "✅ Smart Account 준비 완료",
          `· 네트워크: ${NETWORK} (chainId: ${CHAIN.id})`,
          `· EOA 주소: ${eoaAddress}`,
          `· SCA 주소: ${sca}`,
          "",
          "2) no-op UO, 3) SCA 전송, 4) EOA 가스리스 전송을 순서대로 테스트해볼 수 있습니다.",
        ].join("\n")
      );
    } catch (e: any) {
      console.error(e);
      resetLog(`❌ 지갑 연결 실패: ${e?.message ?? String(e)}`);
    }
  };

  // ─────────────────────────────────────────────────────────
  // 4. Smart Account 배포 여부 보장 (no-op UO)
  // ─────────────────────────────────────────────────────────
  const ensureSmartAccountDeployed = async () => {
    if (!client || !scaAddress || !publicClient) return;

    const code = await publicClient.getCode({
      address: scaAddress as `0x${string}`,
    });

    if (code && code !== "0x") {
      // 이미 배포됨
      return;
    }

    appendLog([
      "",
      "ℹ Smart Account가 아직 배포되지 않아, 먼저 no-op UO로 배포를 진행합니다...",
    ]);

    const { hash: deployUoHash } = await client.sendUserOperation({
      uo: {
        target: scaAddress as `0x${string}`,
        data: "0x",
        value: 0n,
      },
    });

    await client.waitForUserOperationTransaction({ hash: deployUoHash });

    appendLog([`✅ Smart Account 배포 완료 (userOpHash: ${deployUoHash})`, ""]);
  };

  // ─────────────────────────────────────────────────────────
  // 5. no-op UserOperation (기본 엔드투엔드 테스트)
  // ─────────────────────────────────────────────────────────
  const sendNoopUserOp = async () => {
    if (!client) {
      resetLog("먼저 지갑을 연결해 주세요.");
      return;
    }
    if (!scaAddress) {
      resetLog("Smart Account 주소를 찾을 수 없습니다.");
      return;
    }

    try {
      resetLog("⏳ no-op UserOperation 전송 중...");

      const { hash: userOpHash } = await client.sendUserOperation({
        uo: {
          target: scaAddress as `0x${string}`,
          data: "0x",
          value: 0n,
        },
      });

      appendLog([
        "",
        "✅ no-op UO 전송 완료",
        `· userOpHash: ${userOpHash}`,
        "⏳ 트랜잭션 채굴 대기 중...",
      ]);

      const txHash = await client.waitForUserOperationTransaction({
        hash: userOpHash,
      });

      appendLog(["", "🎉 no-op 트랜잭션 채굴 완료", `· txHash: ${txHash}`]);
    } catch (e: any) {
      console.error(e);
      appendLog(`❌ no-op UO 전송 실패: ${e?.message ?? String(e)}`);
    }
  };

  // ─────────────────────────────────────────────────────────
  // 6. [옵션] SCA 잔고에서 토큰 전송 (기본 SCA → recipient)
  // ─────────────────────────────────────────────────────────
  const sendTokenFromSCA = async () => {
    if (!client) {
      resetLog("먼저 지갑을 연결해 주세요.");
      return;
    }
    if (!scaAddress) {
      resetLog("Smart Account 주소를 찾을 수 없습니다.");
      return;
    }
    if (!recipient || !amount) {
      resetLog("전송받을 지갑 주소와 수량을 모두 입력해 주세요.");
      return;
    }

    try {
      resetLog("⏳ [SCA → recipient] 토큰 전송 UO 전송 중...");

      const amountWei = parseUnits(amount, TOKEN.decimals);

      const data = encodeFunctionData({
        abi: erc20Abi,
        functionName: "transfer",
        args: [recipient as `0x${string}`, amountWei],
      });

      const { hash: userOpHash } = await client.sendUserOperation({
        uo: {
          target: TOKEN.address,
          data,
          value: 0n,
        },
      });

      appendLog([
        "",
        "✅ [SCA → recipient] UO 전송 완료",
        `· userOpHash: ${userOpHash}`,
        "⏳ 트랜잭션 채굴 대기 중...",
      ]);

      const txHash = await client.waitForUserOperationTransaction({
        hash: userOpHash,
      });

      appendLog([
        "",
        "🎉 [SCA → recipient] 토큰 전송 완료",
        `· txHash: ${txHash}`,
      ]);
    } catch (e: any) {
      console.error(e);
      appendLog(
        `❌ [SCA → recipient] 토큰 전송 실패: ${e?.message ?? String(e)}`
      );
    }
  };

  // ─────────────────────────────────────────────────────────
  // 7. [핵심] EOA 잔고에서 바로 recipient로 가스리스 전송
  //    (permit + transferFrom, UO 2개 버전)
  // ─────────────────────────────────────────────────────────
  const sendGaslessFromEOA = async () => {
    if (!client) {
      resetLog("먼저 지갑을 연결해 주세요.");
      return;
    }
    if (!publicClient) {
      resetLog("publicClient를 초기화할 수 없습니다. API 키를 확인해 주세요.");
      return;
    }
    if (!eoaAddress || !scaAddress) {
      resetLog("EOA 또는 Smart Account 주소를 찾을 수 없습니다.");
      return;
    }
    if (!recipient || !amount) {
      resetLog("전송받을 지갑 주소와 수량을 모두 입력해 주세요.");
      return;
    }

    try {
      resetLog(
        [
          "⏳ [EOA → recipient] 가스리스 전송 준비 중...",
          "· 1) permit 서명",
          "· 2) permit UO 전송",
          "· 3) transferFrom UO 전송",
        ].join("\n")
      );

      // (0) Smart Account가 배포되어 있는지 보장 (필수 아님이지만 안전용)
      await ensureSmartAccountDeployed();

      // (1) nonce / chainId / amount 준비
      const chainId = await publicClient.getChainId();

      const nonce = (await publicClient.readContract({
        address: TOKEN.address,
        abi: erc20PermitAbi,
        functionName: "nonces",
        args: [eoaAddress as `0x${string}`],
      })) as bigint;

      const amountWei = parseUnits(amount, TOKEN.decimals);
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 10); // 10분 유효

      // (2) EIP-712 Permit 도메인/타입/메시지
      const domain = {
        name: TOKEN.name,
        version: "1",
        chainId,
        verifyingContract: TOKEN.address,
      } as const;

      const types = {
        Permit: [
          { name: "owner", type: "address" },
          { name: "spender", type: "address" },
          { name: "value", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      } as const;

      const message = {
        owner: eoaAddress as `0x${string}`,
        spender: scaAddress as `0x${string}`,
        value: amountWei,
        nonce,
        deadline,
      } as const;

      // (3) EOA로 permit용 서명 (가스 0, 오프체인)
      const walletClient = createWalletClient({
        account: eoaAddress as `0x${string}`,
        chain: CHAIN,
        transport: custom((window as any).ethereum),
      });

      const signature = await walletClient.signTypedData({
        domain,
        types,
        primaryType: "Permit",
        message,
      });

      const sig = signature.slice(2);
      const r = `0x${sig.slice(0, 64)}` as `0x${string}`;
      const s = `0x${sig.slice(64, 128)}` as `0x${string}`;
      const v = Number.parseInt(sig.slice(128, 130), 16);

      appendLog([
        "",
        "✅ permit 서명 완료 (EOA는 온체인 가스 사용 없음)",
        `· signature: ${signature}`,
      ]);

      // (4) permit UserOperation 전송
      appendLog(["", "⏳ 1단계: permit(UserOperation) 전송 중..."]);

      const permitData = encodeFunctionData({
        abi: erc20PermitAbi,
        functionName: "permit",
        args: [
          eoaAddress as `0x${string}`,
          scaAddress as `0x${string}`,
          amountWei,
          deadline,
          v,
          r,
          s,
        ],
      });

      const { hash: permitUoHash } = await client.sendUserOperation({
        uo: {
          target: TOKEN.address,
          data: permitData,
          value: 0n,
        },
      });

      appendLog([
        "",
        `✅ permit UO 전송 완료 (hash: ${permitUoHash})`,
        "⏳ permit UserOperation 채굴 대기 중...",
      ]);

      await client.waitForUserOperationTransaction({
        hash: permitUoHash,
      });

      appendLog(["", "✅ permit 온체인 반영 완료"]);

      // (5) transferFrom UserOperation 전송
      appendLog(["", "⏳ 2단계: transferFrom(UserOperation) 전송 중..."]);

      const transferFromData = encodeFunctionData({
        abi: erc20PermitAbi,
        functionName: "transferFrom",
        args: [
          eoaAddress as `0x${string}`,
          recipient as `0x${string}`,
          amountWei,
        ],
      });

      const { hash: transferUoHash } = await client.sendUserOperation({
        uo: {
          target: TOKEN.address,
          data: transferFromData,
          value: 0n,
        },
      });

      appendLog([
        "",
        `✅ transferFrom UO 전송 완료 (hash: ${transferUoHash})`,
        "⏳ transferFrom UserOperation 채굴 대기 중...",
      ]);

      const txHash = await client.waitForUserOperationTransaction({
        hash: transferUoHash,
      });

      appendLog([
        "",
        "🎉 [EOA → recipient] 가스리스 토큰 전송 완료",
        `· 최종 txHash: ${txHash}`,
      ]);
    } catch (e: any) {
      console.error(e);
      appendLog(
        `❌ [EOA → recipient] 가스리스 전송 실패: ${e?.message ?? String(e)}`
      );
    }
  };

  // ─────────────────────────────────────────────────────────
  // 8. UI
  // ─────────────────────────────────────────────────────────

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        alignItems: "center",
        justifyContent: "center",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        padding: 24,
      }}
    >
      <h1 style={{ fontSize: 24, fontWeight: 700, textAlign: "center" }}>
        Gasless {TOKEN.symbol} Transfer · {NETWORK.toUpperCase()} · Alchemy
        Account Kit
      </h1>

      {/* 지갑 연결 / no-op 버튼 */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button
          onClick={connectWallet}
          style={{
            padding: "10px 18px",
            borderRadius: 8,
            border: "1px solid #ccc",
            cursor: "pointer",
          }}
        >
          1) MetaMask 연결 + Smart Account 생성
        </button>

        <button
          onClick={sendNoopUserOp}
          disabled={!client}
          style={{
            padding: "10px 18px",
            borderRadius: 8,
            border: "1px solid #ccc",
            cursor: client ? "pointer" : "not-allowed",
            opacity: client ? 1 : 0.5,
          }}
        >
          2) no-op UserOperation 테스트
        </button>
      </div>

      {/* 주소 표시 */}
      <div style={{ fontSize: 14 }}>
        EOA(메타마스크) 주소:{" "}
        {eoaAddress || "(아직 연결 전, 위 버튼으로 연결해 주세요)"}
      </div>
      <div style={{ fontSize: 14, marginBottom: 8 }}>
        Smart Account 주소:{" "}
        {scaAddress || "(아직 연결 전, 위 버튼으로 연결해 주세요)"}
      </div>

      {/* 공통 전송 입력폼 */}
      <div
        style={{
          marginTop: 16,
          padding: 12,
          border: "1px solid #ddd",
          borderRadius: 8,
          maxWidth: 800,
          width: "100%",
          fontSize: 14,
        }}
      >
        <div style={{ marginBottom: 8, fontWeight: 600 }}>
          {TOKEN.symbol} 전송 설정
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label>
            전송받을 지갑 주소 (recipient):
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value.trim())}
              placeholder="0x로 시작하는 메타마스크 지갑 주소"
              style={{ width: "100%", padding: 6, marginTop: 4 }}
            />
          </label>

          <label>
            전송 수량 ({TOKEN.symbol}):
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value.trim())}
              placeholder="예: 1.5"
              style={{ width: "100%", padding: 6, marginTop: 4 }}
            />
          </label>
        </div>

        {/* 전송 버튼들 */}
        <div
          style={{
            marginTop: 12,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <button
            onClick={sendTokenFromSCA}
            disabled={!client}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid #ccc",
              cursor: client ? "pointer" : "not-allowed",
              opacity: client ? 1 : 0.5,
              alignSelf: "flex-start",
            }}
          >
            3) [SCA 잔고] {TOKEN.symbol} 전송 (Gas Manager 스폰)
          </button>

          <button
            onClick={sendGaslessFromEOA}
            disabled={!client}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid #ccc",
              cursor: client ? "pointer" : "not-allowed",
              opacity: client ? 1 : 0.5,
              alignSelf: "flex-start",
            }}
          >
            4) [EOA 잔고] 가스리스 {TOKEN.symbol} 전송 (permit 사용)
          </button>

          <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
            · 3번: Smart Account 주소({scaAddress || "SCA 주소"})가 보유한{" "}
            {TOKEN.symbol}를 recipient로 전송합니다.{"\n"}· 4번: EOA 주소(
            {eoaAddress || "EOA 주소"})가 보유한 {TOKEN.symbol}를 recipient로
            전송하며, 온체인 가스는 Alchemy Gas Manager 정책으로 대납됩니다.
            EOA의 ETH 잔고는 변하지 않습니다.
          </div>
        </div>
      </div>

      {/* 로그 출력 */}
      <pre
        style={{
          marginTop: 16,
          width: "100%",
          maxWidth: 800,
          minHeight: 140,
          background: "#111",
          color: "#0f0",
          padding: 16,
          borderRadius: 8,
          whiteSpace: "pre-wrap",
          fontFamily: "monospace",
          fontSize: 13,
        }}
      >
        {log || "여기에 로그가 표시됩니다."}
      </pre>
    </main>
  );
}

export default App;
