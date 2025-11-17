# ERC-20 가스비 스폰서십 연구 (1) – Sepolia 환경 설정 및 GST 배포

## 1. 문서 개요

### 1.1 목적

본 문서는 **ERC-20 기반 서비스에서 사용자가 ETH를 직접 보유하지 않아도 온체인 참여가 가능하도록 하는
가스비 스폰서십(Gas Sponsorship) 구조**를 연구·검증하기 위한**기본 환경 설정 절차**를 정리한다.

이후 문서 전반에서는 아래와 같이 용어를 사용한다.

> 가스비 스폰서십 / 가스비 지원:
사용자가 ETH를 직접 지불하지 않고, Paymaster/플랫폼이
트랜잭션 실행에 필요한 가스비를 대신 부담하는 구조
> 

본 1편 문서의 목표는 **Ethereum Sepolia 테스트넷**에서 다음 항목을 완료하는 것이다.

1. MetaMask 테스트 지갑 생성 및 Sepolia 네트워크 구성
2. Sepolia 테스트 ETH 확보 (faucet 사용)
3. OpenZeppelin Wizard + Remix를 이용한 테스트용 ERC-20 토큰
    
    **GasSponsorTest (심볼: GST)** 배포
    
4. Alchemy에서 Sepolia용 App 및 Gas Manager Policy 생성

이 문서는 **환경 설정(1단계)** 까지만을 다루며,

이후 단계(스마트 계정/AA 코드 구현, 실제 가스비 스폰서십 PoC)는

별도 문서(2편)에서 설명한다.

---

## 2. 배경 및 연구 목적

### 2.1 배경

일반적인 ERC-20 기반 서비스(토큰 전송, 투표, 스테이킹, 리워드 클레임 등)는

모두 이더리움 네트워크 상에서 **가스비(ETH)** 를 필요로 한다.

대표적인 문제점은 다음과 같다.

- 사용자는 **토큰만 보유하고 있어도**, 실제 트랜잭션 실행을 위해
    
    **별도의 ETH를 추가로 충전해야 한다.**
    
- 특히 신규 유입 사용자나, 단순 참여(투표, 한 번의 클레임 등)만 원하는 사용자 입장에서는
    
    “토큰 구매 + ETH 충전” 이중 허들이 발생한다.
    
- 결과적으로 온체인 참여율 저하, UX 악화, 이탈 증가로 이어질 수 있다.

이 문제를 완화하기 위해 등장한 개념이 **가스비 스폰서십(Gas Sponsorship)** 이다.

플랫폼 또는 별도 Paymaster가 가스비를 부담하고,

사용자는 **메시지 서명만으로 온체인 활동을 수행**할 수 있게 만드는 구조다.

### 2.2 연구 목적

본 연구의 1차 목표는 다음과 같다.

1. **ERC-20 기반 가스비 스폰서십 구조를 설계·검증하기 위한 테스트 환경**을
    
    Sepolia 상에 구축한다.
    
2. OpenZeppelin, Remix, Alchemy 등 범용 도구를 활용하여
    
    테스트용 ERC-20 토큰 **GasSponsorTest(GST)** 를 배포하고,
    
    향후 서비스 컨트랙트 및 가스비 스폰서(Alchemy Gas Manager)와
    
    연동 가능한 상태로 만든다.
    
3. 이를 기반으로 추후 다음과 같은 시나리오를 실험한다.
    - 사용자는 **가스비를 내지 않고 ERC-20 기반 서비스에 참여**
    - 서비스 측(플랫폼)이 **가스비를 일부 또는 전부 지원(스폰서)**

결과적으로, 실제 서비스에 적용 가능한

**가스비 스폰서십 아키텍처와 운영 시나리오**를 도출하는 것이

궁극적인 목표다.

---

## 3. 시스템 구성 개요 (1단계)

본 문서에서 구축하는 1단계 환경은 다음 구성 요소로 이루어진다.

1. **MetaMask 테스트 지갑**
    - Sepolia 테스트넷에 연결된 EOA(Externally Owned Account)
    - GST 토큰 및 테스트 ETH 보유
2. **Sepolia 테스트넷**
    - 이더리움 테스트 네트워크
    - 컨트랙트 배포 및 트랜잭션 실행에 사용
3. **테스트용 ERC-20 토큰 – GasSponsorTest (GST)**
    - OpenZeppelin Wizard로 생성
    - Remix를 통해 Sepolia에 배포
    - 이후 서비스 컨트랙트 및 가스비 스폰서십 실험에 사용
4. **Alchemy App (Sepolia용)**
    - Sepolia RPC 엔드포인트 제공
    - Account Abstraction 및 Gas Manager와 연동
5. **Alchemy Gas Manager Policy**
    - ERC-4337 기반 UserOperation의 **가스를 스폰서하기 위한 정책 단위**
    - 향후 스마트 계정/AA 코드에서 `policyId`로 참조

---

## 4. MetaMask 및 Sepolia 환경 설정

### 4.1 MetaMask 지갑 생성

1. 브라우저(Chrome 등)에 MetaMask 확장 프로그램 설치
2. 설치 후 MetaMask 실행 → **Create a new wallet** 선택
3. 지갑 비밀번호 설정
4. 제공되는 **Secret Recovery Phrase(시드 문구)** 를
    - 종이 등 **오프라인 매체에 안전하게 보관**
    - 제3자와 공유 금지
    - 메신저, 이메일, 클라우드 등에 평문 저장 금지

> 테스트넷용 지갑이더라도,
> 
> 
> 실수로 메인넷에 자산을 보낼 가능성을 고려해
> 
> **기본적인 보안 수칙은 반드시 준수**하는 것을 권장한다.
> 

---

### 4.2 MetaMask에서 Sepolia 테스트넷 활성화

1. MetaMask 상단 네트워크 드롭다운 클릭
2. **Show test networks / 테스트 네트워크 표시** 메뉴 또는
    
    `Settings → Advanced` 에서 테스트넷 표시 옵션을 **ON**
    
 <img width="1189" height="597" alt="image" src="https://github.com/user-attachments/assets/c3a27d8c-50d4-4e3e-95d6-456c1c5ee814" />

3. 네트워크 리스트에서 **Sepolia** 선택

<img width="789" height="597" alt="image" src="https://github.com/user-attachments/assets/5666934b-0723-4d3f-a08e-4cc86697407a" />


정상 설정 시:

- MetaMask 상단에 `Sepolia` 가 표시되고
- 계정 주소 아래 잔고 단위가 **Sepolia ETH** 로 보이게 된다.

---

### 4.3 Sepolia 테스트 ETH 획득 (Faucet)

1. Sepolia faucet 서비스 접속 (예: **Alchemy Sepolia Faucet** 등)
2. MetaMask에서 현재 계정 주소(0x…) 복사

<img width="389" height="597" alt="image" src="https://github.com/user-attachments/assets/24d00a5e-e508-465b-8f2f-b9bb74ed8c26" />


3. faucet 페이지에 주소 입력 후 요청 버튼 클릭

<img width="1028" height="1059" alt="image" src="https://github.com/user-attachments/assets/0ce4f97e-1357-478a-a480-80a3afbb949a" />


4. 수 분 내로 MetaMask에서 Sepolia 잔고 증가 여부 확인

<img width="389" height="597" alt="image" src="https://github.com/user-attachments/assets/01bbcca1-213a-4c91-b27d-1c9b89c306c0" />


권장량: **0.05 ~ 0.5 Sepolia ETH**

(테스트 토큰 배포 및 여러 차례 트랜잭션 진행에 충분한 수준)

---

## 5. ERC-20 테스트 토큰 GasSponsorTest (GST) 생성 및 배포

본 절에서는 **OpenZeppelin Wizard + Remix**를 사용하여

테스트용 ERC-20 토큰 **GasSponsorTest(GST)** 를 생성하고

Sepolia에 배포하는 절차를 기술한다.

### 5.1 OpenZeppelin Wizard 설정

1. 브라우저에서 **OpenZeppelin Contracts Wizard** 접속
2. 초기 화면에서:
    - Language: **Solidity**
    - 왼쪽 메뉴에서 **ERC20** 선택
3. ERC-20 옵션을 아래와 같이 설정
- **Name**: `GasSponsorTest`
- **Symbol**: `GST`
- **Premint**: `1000000000` (예: 10억 GST, Decimals 18 가정)

기능 옵션(권장):

- `Mintable` : **활성화** (테스트용 추가 발행 가능)
- `Burnable` : 필요 시 활성화 (선택)
- `Pausable` : 필요 시 활성화 (선택)
- `Ownable` : **활성화 권장** (관리 주체 명시)
- `Permit (EIP-2612)` : **반드시 활성화**

> Permit 기능은 EOA가 온체인 트랜잭션을 직접 보내지 않고
> 
> 
> **메시지 서명만으로 토큰 사용 권한(allowance)을 위임**할 수 있게 해준다.
> 
> 이후 dApp/스마트 계정이 이 서명을 이용해 `permit + transferFrom` 트랜잭션을 보내면서
> 
> **가스비를 대신 부담하는 스폰서십 구조**를 구현할 수 있으므로,
> 
> 이번 **EOA 가스비 지원 실험의 핵심 전제 조건**이다.
> 

<img width="1082" height="1145" alt="image" src="https://github.com/user-attachments/assets/94d5178b-c2c8-492d-bf8e-95e3ac323993" />

설정이 완료되면 우측 코드 영역에 `GasSponsorTest.sol` 컨트랙트 코드가 자동 생성된다.

---

### 5.2 Wizard에서 Remix로 코드 전송

1. Wizard 하단의 **Open in Remix** 버튼 클릭
2. Remix IDE가 새 탭으로 열리고, 프로젝트 트리에 `GasSponsorTest.sol` 파일 생성
3. 파일 트리에서 `GasSponsorTest.sol` 선택 후 코드가 정상 로드되었는지 확인

<img width="954" height="1267" alt="image" src="https://github.com/user-attachments/assets/aa28fad0-4542-4cf5-b68b-7134ddb09fe9" />

> 만약 “Open in Remix” 기능을 사용할 수 없는 환경이라면,
> 
> 
> Wizard에서
> 
> **Copy**
> 
> 버튼으로 코드를 복사한 뒤,
> 
> Remix에서 새 Solidity 파일을 생성하여 붙여넣으면 동일하게 진행 가능하다.
> 

---

### 5.3 Remix에서 GST 컨트랙트 컴파일

1. Remix 좌측 메뉴에서 **Solidity Compiler** 탭 선택
2. Compiler 버전을 `GasSponsorTest.sol` 상단의 `pragma solidity ^0.8.xx;` 와 동일하게 설정
3. 대상 파일로 `GasSponsorTest.sol` 선택 후
    
    **Compile GasSponsorTest.sol** 버튼 클릭
    
4. 컴파일 로그에서 에러가 없는지 확인

<img width="954" height="1267" alt="image" src="https://github.com/user-attachments/assets/40e20ac3-4fb5-4946-9a03-29bb86c9784a" />


---

### 5.4 Remix에서 MetaMask(Sepolia) 연결

1. Remix 좌측 메뉴에서 **Deploy & Run Transactions** 탭 선택
2. `ENVIRONMENT` 드롭다운에서 **Injected Provider – MetaMask** 선택

<img width="1027" height="589" alt="image" src="https://github.com/user-attachments/assets/9b1d38ab-893d-4221-8222-c4e06505e803" />


3. 브라우저 우측 MetaMask 팝업에서 Remix에 지갑 접근 권한 **Connect**
4. Remix 상단에서 아래 항목 확인
    - Environment: `Injected Provider – MetaMask`
    - Account: 현재 Sepolia 계정 주소 및 잔고 정상 표시

<img width="954" height="1267" alt="image" src="https://github.com/user-attachments/assets/634c4d1a-8fce-42b9-8996-58b94c69545d" />

---

### 5.5 GST 컨트랙트 Sepolia 배포

1. Deploy & Run 탭에서 `CONTRACT` 드롭다운 → **GasSponsorTest** 선택

<img width="954" height="1267" alt="image" src="https://github.com/user-attachments/assets/e1ef44f8-7f47-4e0e-bced-d8788d8c6468" />

2. constructor 인자 확인
    - Wizard 옵션에 따라 `constructor(address initialOwner)` 와 같이
        
        **배포 시 owner 주소를 받는 경우**가 있음
        
    - 이 경우 `initialOwner` 에 현재 MetaMask 계정 주소(0x…) 입력

<img width="324" height="888" alt="image" src="https://github.com/user-attachments/assets/21f44cff-c45b-4322-9db0-592e576bda38" />

3. **transact** 버튼 클릭

4. MetaMask 트랜잭션 확인 창에서
    - 네트워크: **Sepolia** 인지 확인
    - 가스비 및 내용을 확인 후 **Confirm**

<img width="372" height="574" alt="image" src="https://github.com/user-attachments/assets/fbfb2ee3-59ab-47cb-b3a0-aa1cf9f5c29a" />

5. 트랜잭션이 블록에 포함되면:
    - Remix 하단 로그에 배포 성공 메시지 출력
    - `Deployed Contracts` 섹션에 `GasSponsorTest` 인스턴스 표시

<img width="576" height="259" alt="image" src="https://github.com/user-attachments/assets/715dea88-a875-4a4e-8a5c-cfa9af527b99" />

6. `Deployed Contracts` 영역에서 `GasSponsorTest` 인스턴스 옆 주소(0x…)를 복사하여 기록
    - 예: `GST(GasSponsorTest) @ 0x...` (Sepolia 주소)

<img width="1116" height="693" alt="image" src="https://github.com/user-attachments/assets/027e6b2d-c1d3-4baa-bfb5-f059008fa7ec" />

---

### 5.6 MetaMask에 GST 토큰 추가

MetaMask에서 GST 잔고를 직관적으로 확인하기 위해 토큰을 추가한다.

1. MetaMask 열기 → **Tokens(토큰)** 탭 선택
2. **Import tokens / 토큰 가져오기** 버튼 클릭
3. `Token contract address` 에 앞에서 복사한 `GasSponsorTest` 컨트랙트 주소 입력

<img width="388" height="589" alt="image" src="https://github.com/user-attachments/assets/88270b6c-7e68-4c60-b86a-5f340c5de052" />

4. Symbol / Decimals 자동 인식이 안 될 경우:
    - Token Symbol: `GST`
    - Decimals: `18`
5. 토큰 추가 완료 후, Wizard에서 설정한 Premint 양
    
    (예: `1,000,000,000 GST`)이 지갑에 표시되는지 확인

<img width="388" height="589" alt="image" src="https://github.com/user-attachments/assets/b7411016-889c-485b-bcbe-b577481448a7" />

---

## 6. Alchemy 설정 – Sepolia App 및 Gas Manager Policy

본 절에서는 **가스비 스폰서십 연구에 사용할 Alchemy 인프라**를 설정한다.

이 단계에서는 코드를 작성하지 않고,

**이후 PoC에서 사용할 키/ID를 확보**하는 것이 목적이다.

### 6.1 Alchemy Sepolia App 생성

1. 브라우저에서 **Alchemy Dashboard** 접속 후 로그인
2. 좌측 메뉴에서 `Apps → Create App` 선택
3. 다음과 같이 설정
    - Name: `gst-sepolia-demo` (예시)
    - Chain: `Ethereum`
    - Network: `Sepolia`
<img width="2425" height="1846" alt="image" src="https://github.com/user-attachments/assets/5fc38ec5-c2e1-4450-b013-b86622e1eb74" />

4. App 생성 후 상세 페이지에서:
    - HTTP RPC URL 또는 **API Key** 확인 및 기록
    - 예) `https://eth-sepolia.g.alchemy.com/v2/ALCHEMY_KEY`

<img width="1182" height="660" alt="image" src="https://github.com/user-attachments/assets/f4ab0fba-edba-4a4d-8eb1-77f931cb4988" />

이 App은 이후

- dApp 및 스마트 계정에서 사용하는 **RPC 엔드포인트**가 되며
- **Gas Manager Policy와 연결되는 기준 애플리케이션**이 된다.

---

### 6.2 Gas Manager Policy 생성

1. Alchemy Dashboard에서 **Gas Manager / Gas Policies** 관련 메뉴로 이동
2. **Create Policy** 버튼 클릭
3. Policy 기본 설정
    - Policy Name: `GST Sepolia Policy` (예시)
    - App: 앞서 생성한 `gst-sepolia-demo`
    - Network: `Ethereum Sepolia`
4. Sponsorship Rule
    - 초기 연구 단계에서는 넓게 허용(테스트 목적)해도 무방
    - 실제 서비스 단계에서는 **특정 컨트랙트 주소 및 메서드 기준으로 제한** 예정
5. Limit 설정
    - 일일 또는 월간 사용량 한도를 기본값으로 설정
        (테스트넷 환경에서는 기본값으로 충분한 경우가 많음)

<img width="1197" height="908" alt="image" src="https://github.com/user-attachments/assets/c5e9e24b-c5bf-4177-aebc-4fd7b47a9eeb" />

6. Policy 생성 후:
    - Policy 상세 화면 상단에서 **Policy ID** 발급
    - 예: `gsp_XXXXXXXXXXXX` 형태

<img width="1195" height="774" alt="image" src="https://github.com/user-attachments/assets/79d4e001-0d0c-4894-8975-885269e79cc6" />

해당 Policy ID는 이후 **스마트 계정/AA SDK에서 `policyId` 파라미터**로 전달되어,

어떤 가스 스폰서십 정책을 사용할지 지정하는 데 사용된다.

---

### 6.3 환경 변수(.env) 정리 (다음 단계 대비)

향후 코드 구현(스마트 계정/AA, 가스비 스폰서십 트랜잭션) 단계에서 재사용하기 위해,

로컬 프로젝트 기준 `.env` 파일을 다음과 같이 준비한다.

```
ALCHEMY_API_KEY_SEPOLIA=your_alchemy_app_key_here
ALCHEMY_GAS_POLICY_ID=your_gas_manager_policy_id_here

```

- `ALCHEMY_API_KEY_SEPOLIA` : 6.1에서 생성한 App의 API Key
- `ALCHEMY_GAS_POLICY_ID` : 6.2에서 생성한 Gas Manager Policy ID

앞으로 작성할 dApp/스마트 계정 코드에서 이 값을 불러와

**RPC 엔드포인트 및 정책 ID를 중앙집중적으로 관리**

할 수 있다.

---

## 7. 결론 및 다음 단계

본 문서에서는

**「ERC-20 가스비 스폰서십 연구 (1)」** 에 해당하는

**“1단계: 환경 설정”** 을 완료하였다.

정리하면 다음 항목들을 수행했다.

1. MetaMask 테스트 지갑 생성 및 Sepolia 네트워크 활성화
2. Sepolia 테스트 ETH 수급 (faucet 사용)
3. OpenZeppelin Wizard + Remix를 이용한
    
    **GasSponsorTest(GST) ERC-20 토큰** 의 Sepolia 배포
    
4. Alchemy에서
    - Sepolia용 App 생성
    - Gas Manager Policy 생성 및 Policy ID 확보
5. 향후 코드 구현 단계에서 사용할 **환경 변수(.env)** 정의

### 다음 단계(2편, 별도 문서)

다음 문서(2편)에서는 위 환경을 기반으로

실제 **가스비 스폰서십 트랜잭션 PoC** 를 진행한다.

- Alchemy Account Abstraction / AA SDK를 사용하여
    
    **MetaMask EOA 기반 스마트 계정(Smart Account) 생성**
    
- 앞서 생성한 `policyId` 를 사용하는 **가스 스폰서 클라이언트 구성**
- GST 또는 서비스 컨트랙트(예: `participate()` 등)에 대한 트랜잭션을
    
    **Gas Manager를 통해 가스비 지원(스폰서십) 형태로 실행**
    
- Etherscan 및 Alchemy Dashboard를 통해
    
    **UserOperation / 가스비 스폰서십 동작을 정량적으로 검증**
