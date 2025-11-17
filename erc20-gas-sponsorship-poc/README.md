# ERC-20 Gas Sponsorship PoC


## Overview

This repository contains PoC code and documentation for researching and validating
a **gas sponsorship (gasless transfer)** architecture for ERC-20 tokens.

### Structure

* `contracts/`

  * Solidity code for the test ERC-20 token `GasSponsorTest (GST)` deployed on Sepolia.

* `example/`

  * Gas sponsorship PoC example built with **React, Vite, viem, and Alchemy Account Kit**.
  * For detailed setup and usage, see [`example/README.md`](./example/README.md).

* `docs/`

  * `01-erc20-gas-sponsorship-env.md`

    * Environment setup and GST test token deployment.
  * `02-erc20-gas-sponsorship-poc.md`

    * Gas sponsorship PoC using Alchemy Smart Account and Gas Manager.

### Quick Start

```bash
cd example
npm install
npm run dev
```

Open the Vite dev server URL in your browser (default: `http://localhost:5173`).

---

## 개요

이 레포는 ERC-20 토큰에 대한 **가스비 스폰서십(gasless transfer)** 구조를  
연구·검증하기 위한 PoC 코드와 문서를 모아둔 저장소입니다.

### 구조

- `contracts/`  
  - Sepolia에 배포한 테스트용 ERC-20 토큰 `GasSponsorTest (GST)` Solidity 코드

- `example/`  
  - React + Vite + viem + Alchemy Account Kit 기반 **가스비 스폰서십 PoC 예제**  
  - 상세 실행 방법 / 설정은 [`example/README.md`](./example/README.md)를 참고하세요.

- `docs/`  
  - `01-erc20-gas-sponsorship-env.md`  
    - 환경 설정 및 테스트 토큰(GST) 배포 문서  
  - `02-erc20-gas-sponsorship-poc.md`  
    - Alchemy Smart Account + Gas Manager 기반 가스비 스폰서십 PoC 문서

### 빠른 실행

```bash
cd example
npm install
npm run dev
````

브라우저에서 Vite dev 서버 주소(기본값: `http://localhost:5173`)로 접속하면 됩니다.
