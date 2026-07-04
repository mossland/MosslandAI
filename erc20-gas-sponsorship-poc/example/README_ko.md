# Gasless ERC-20 Transfer · Sepolia · Alchemy Account Kit

[English](./README.md) | **한국어**

MetaMask EOA 지갑만으로 **가스비를 직접 지불하지 않고** ERC-20 토큰을 전송하는 PoC 프로젝트입니다.
Alchemy Account Kit(모듈러 Smart Account) + Gas Manager(Paymaster) + ERC-20 `permit & transferFrom` 조합을 통해 **가스리스 토큰 전송 UX**를 구현·검증합니다.

---

## 1. 개요

- **네트워크:** Sepolia Testnet
- **지갑 구성**

  - EOA: MetaMask 계정
  - SCA: Alchemy Modular Smart Account

- **토큰:** ERC-20 GasSponsorTest(GST) — EIP-2612 Permit 지원
- **가스비 구조**

  - 모든 UserOperation 가스비는 **Alchemy Gas Manager 정책**(`policyId`)에 의해 전액 대납
  - EOA의 ETH 잔고는 변화 없음

> 본 프로젝트는 실제 서비스의 가스리스 UX 도입을 위한 연구·프로토타입 구현(PoC)입니다.

---

## 2. 주요 기능

### MetaMask EOA 기반 Smart Account 생성

- `@account-kit/smart-contracts` 사용
- Alchemy Bundler + Gas Manager 연동
- EOA 기반 deterministic SCA 주소 생성 및 자동 배포

### Smart Account 배포 및 기본 UserOperation

- 배포 여부 확인 후 필요 시 **no-op UO**로 자동 배포
- 기본 end-to-end 경로 테스트용 UO 실행

### SCA 잔고에서 GST 전송

- Smart Account가 보유한 GST를 recipient에게 전송
- 모든 가스비는 Gas Manager가 스폰

### EOA 잔고에서 가스리스 GST 전송 (핵심 기능)

- EOA는 permit 서명만 수행 (**오프체인**)
- Smart Account가 UO 2개로 처리:

  - UO #1: `permit(owner, SCA, amount)`
  - UO #2: `transferFrom(owner → recipient)`

- **EOA의 ETH 잔고 변화 없음**, 토큰만 이동

### Alchemy Dashboard 연동

- no-op / permit / transferFrom UO 3개 모두
  **Sponsored** 상태로 Dashboard에서 확인 가능

---

## 3. 아키텍처 개요 (Mermaid)

```mermaid
graph TD
    subgraph Client["Client Side"]
        User["User"]
        DApp["React dApp<br/>Vite + viem"]
        MetaMask["MetaMask<br/>Ethereum Provider"]
    end

    subgraph OnChain["On-chain Contracts"]
        SCA["Smart Account<br/>(Modular Account)"]
        EntryPoint["EIP-4337<br/>EntryPoint"]
        Token["ERC20 + Permit<br/>GST"]
    end

    subgraph Alchemy["Alchemy Infra"]
        Bundler["Bundler<br/>(UserOp Aggregator)"]
        GM["Gas Manager<br/>(Paymaster)"]
        RPC["RPC Endpoint<br/>eth-sepolia.g.alchemy.com"]
    end

    User --> DApp
    DApp --> MetaMask
    DApp --> RPC

    DApp --> Bundler
    Bundler --> EntryPoint
    EntryPoint --> SCA
    SCA --> Token

    EntryPoint --> GM
    GM --> EntryPoint

    DApp --> Token
    DApp --> SCA
```

---

## 4. 사전 준비 사항

1. **Node.js 20.19+ 또는 22.12+** (Vite 7 요구 사항. Vite 7은 Node.js 18 EOL(2025년 4월 말) 이후 Node 18 지원을 중단함)
2. **MetaMask 브라우저 확장 프로그램**
3. **Alchemy Account Kit / Gas Manager 설정**

   - Alchemy 계정 및 App
   - API Key
   - Gas Policy ID

4. **Permit 지원 ERC-20 토큰(GST) Sepolia 배포**
5. **테스트넷 ETH (Sepolia faucet)**

---

## 5. 환경 변수 설정 (.env)

```bash
# Alchemy Keys
VITE_ALCHEMY_API_KEY=your_alchemy_api_key
VITE_ALCHEMY_GAS_POLICY_ID=your_policy_id

# Network
VITE_NETWORK=sepolia

# ERC-20 Token Metadata
VITE_TOKEN_ADDRESS=0xYourTokenAddress
VITE_TOKEN_NAME=GasSponsorTest
VITE_TOKEN_SYMBOL=GST
```

---

## 6. 프로젝트 실행 방법

```bash
# Install dependencies
npm install
# or
yarn install
# or
pnpm install

# Run dev server
npm run dev
# or
yarn dev
# or
pnpm dev
```

브라우저에서:
👉 [http://localhost:5173](http://localhost:5173)

---

## 7. UI 사용 방법

### 7.1 「① MetaMask 연결 + Smart Account 생성」

- MetaMask 팝업 → 계정 연결
- React dApp이 Smart Account 주소 생성
- EOA / SCA 주소 표시

### 7.2 「② no-op UserOperation 테스트」

- Smart Account 미배포 시 자동 배포
- Bundler → EntryPoint → GM(Paymaster) 순으로 UO 실행
- 가스비는 Paymaster가 대납

### 7.3 「③ [SCA 잔고] GST 전송」

- SCA가 보유한 GST 전송
- 가스비는 Gas Manager 스폰

### 7.4 「④ [EOA 잔고] 가스리스 GST 전송」(핵심)

1. EOA에 충분한 GST 잔고가 있는지 확인합니다.

2. **recipient(수신자)** 주소와 **amount(수량)** 를 입력합니다.

3. **「4) [EOA 잔고] 가스리스 GST 전송 (permit 사용)」** 버튼을 클릭합니다.

4. 내부적으로 앱은 다음을 수행합니다.

   1. 토큰의 `nonces(owner)` 를 조회합니다.
   2. MetaMask에 오프체인 EIP-712 **Permit 서명**을 요청합니다 (가스비 0).
   3. **UserOperation #1:** Smart Account가 `token.permit(...)` 을 호출합니다.
   4. **UserOperation #2:** Smart Account가 `token.transferFrom(EOA, recipient, amount)` 을 호출합니다.
   5. 두 UserOperation 모두 Gas Manager가 스폰합니다.

5. 결과:

   - recipient는 GST를 수령합니다.
   - EOA의 GST 잔고는 감소합니다.
   - **EOA의 ETH 잔고는 변화 없습니다.**
   - 최종 트랜잭션은 Etherscan에서 확인할 수 있습니다.
   - Alchemy Dashboard에는 `no-op / permit / transferFrom` UO가 모두 **Sponsored** 로 표시됩니다.

---

## 8. 내부 동작 플로우 (시퀀스 다이어그램)

```mermaid
sequenceDiagram
    autonumber
    participant User
    participant DApp
    participant MetaMask
    participant EOA
    participant SCA
    participant Bundler
    participant EntryPoint
    participant GM as Gas Manager
    participant Token as GST Token

    User->>DApp: ① Connect & Create Smart Account
    DApp->>MetaMask: eth_requestAccounts
    MetaMask-->>DApp: EOA address
    DApp-->>SCA: Smart Account address 계산

    User->>DApp: ② Gasless Transfer 클릭
    DApp->>Token: nonces(EOA)
    DApp->>MetaMask: signTypedData(Permit)
    MetaMask->>EOA: 서명 요청
    EOA-->>MetaMask: 서명 완료
    MetaMask-->>DApp: signature

    DApp->>Bundler: UO #1 (필요 시) no-op 배포
    Bundler->>EntryPoint: handleOps
    EntryPoint->>GM: Paymaster 검증
    GM-->>EntryPoint: 승인

    DApp->>Bundler: UO #2: permit 실행
    Bundler->>EntryPoint: handleOps
    EntryPoint->>GM: 검증
    GM-->>EntryPoint: 승인
    EntryPoint->>Token: permit 실행

    DApp->>Bundler: UO #3: transferFrom 실행
    Bundler->>EntryPoint: handleOps
    EntryPoint->>GM: 검증
    GM-->>EntryPoint: 승인
    EntryPoint->>Token: transferFrom 실행

    Token-->>EntryPoint: 성공
    EntryPoint-->>Bundler: txHash
    Bundler-->>DApp: txHash
    DApp-->>User: 최종 txHash 출력
```

---

## 9. 가스비 절감을 위한 향후 개선

### Permit + Transfer 헬퍼 컨트랙트 도입

현재 permit → transferFrom은 **서로 다른 UserOperation 2개**로 실행됩니다.
이 때문에 EntryPoint·Paymaster 고정 오버헤드가 2번 발생합니다.

### 개선 아이디어

별도의 헬퍼 컨트랙트로 두 동작을 **하나의 UserOperation**으로 묶기:

```solidity
contract PermitAndTransferHelper {
    function permitAndTransfer(
        IERC20Permit token,
        address owner,
        address spender,
        address to,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        token.permit(owner, spender, value, deadline, v, r, s);
        IERC20(address(token)).transferFrom(owner, to, value);
    }
}
```

### 기대 효과

- **UserOperation 2개 → 1개**
- Paymaster/EntryPoint 처리 오버헤드 절반 감소
- Gas Manager 비용 절감
- Dashboard에서도 단일 “Sponsored Operation”으로 단순화

---

## 10. 한계 및 주의 사항

- 본 프로젝트는 PoC이며,

  - 보안 감사
  - 쿼터/리밋 정책
  - 악의적 호출 방지
  - 프로덕션 수준 예외 처리
    등이 포함되어 있지 않습니다.

- Gas Manager 정책 설정은 서비스 정책에 맞게 별도 구성해야 합니다.
