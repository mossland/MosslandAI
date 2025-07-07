# 대형 상업·사무용 빌딩 공조 시스템 입문 가이드북

**대상**: 디지털트윈 솔루션을 개발하지만 HVAC(Heating, Ventilation & Air‑Conditioning) 지식이 전무한 소프트웨어 엔지니어

---

## 목차

1. 공조 시스템이란?
2. 빠른 Glossary (한‑영 병기)
3. 공조 기본 원리
4. 건물 규모별 주요 시스템 아키텍처
5. 핵심 설비 & 부속 장치
6. 제어 계층 & BAS/BMS 통신
7. 센서·데이터 포인트 목록
8. 성능 지표 & 분석 KPI
9. 디지털트윈 통합 전략
10. 국내·국제 표준 및 규정
11. 추천 학습 경로 & 자료

---

## 1. 공조 시스템이란?

* **정의**: 실내 열·습도·공기질(IAQ)을 관리해 쾌적성과 에너지 효율을 동시에 달성하는 빌딩 설비 총칭.
* **3대 기능**: 난방(Heating), 냉방(Cooling), 환기(Ventilation) + 가습/제습(Steam Humidification, DX Dehumidification).
* **에너지 소비**: 상업용 빌딩 전체 사용량의 40–60%를 차지 → 최적화 잠재력이 큰 영역.

## 2. 빠른 Glossary (가나다순)

| 한글 용어          | 영어(약어)                                 | 한줄 설명                                   |
| -------------- | -------------------------------------- | --------------------------------------- |
| 가변 풍량 박스       | VAV Box (Variable Air Volume Terminal) | 구역별 풍량을 제어해 부하 대응, 덕트·댐퍼·재열코일 포함        |
| 급·배기 팬         | Supply/Exhaust Fan                     | 환기용 공기를 실내로 공급·배출하는 팬                   |
| 냉동기            | Chiller                                | 물을 4–7 °C로 냉각, CHW Loop 공급              |
| 냉각탑            | Cooling Tower                          | 응축수 열을 외기로 방출                           |
| 덕트             | Duct                                   | 공기를 운반하는 통로, 가로(mm)×높이(mm) or Ø(mm)로 표기 |
| 배관             | Piping                                 | CHW, HW, CW 등 유체 운반, Schedule/인치로 규격    |
| 보일러            | Boiler                                 | 온수/증기를 생성해 난방 Loop 공급                   |
| AHU            | Air Handling Unit                      | 외기+순환공기를 혼합·필터링·가열/냉각·가습 후 공급           |
| BAS/BMS        | Building Automation/System             | 설비 제어·모니터링 중앙 플랫폼                       |
| COP            | Coefficient of Performance             | 냉방 효율 지표 (냉방능력 ÷ 소비전력)                  |
| EUI            | Energy Use Intensity                   | kWh/m²·yr, 건물 에너지 효율 지표                 |
| Psychrometrics | 공기선도                                   | 온도·습도·엔탈피 관계를 시각화한 차트                   |

*(표는 핵심만 수록. 본문 각 장에서 추가 설명)*

## 3. 공조 기본 원리

### 3‑1. 열역학 & 열전달

* **전도·대류·복사** 기본 공식 요약
* 냉동 사이클: 압축 → 응축 → 팽창 → 증발

### 3‑2. 공기선도(Psychrometric Chart)

* 건구/습구온도, 상대습도, 엔탈피 좌표 읽는 법
* 가열·가습·냉각·제습 과정 선도 이동 예시

## 4. 건물 규모별 주요 시스템 아키텍처

### 4‑1. Central Plant (대형 업무·복합)

* **냉동기 + 냉각탑 + 보일러** → CHW/HW Loop
* **AHU + VAV** Zone

### 4‑2. All‑Air vs Air‑Water vs Water 시스템 비교

| 구분        | All‑Air (VAV) | Air‑Water (FCU+DOAS) | Water (VRF) |
| --------- | ------------- | -------------------- | ----------- |
| 설비 집중도    | 고             | 중                    | 분산          |
| 제어 복잡도    | 중             | 높음                   | 높음          |
| 디지털트윈 포인트 | 10 k–50 k     | 5 k–20 k             | 1 k–10 k    |

(수치는 매우 러프한 감 잡기용)

### 4‑3. 특수: Dedicated Outdoor Air System(DOAS), Heat Recovery, 지열원

## 5. 핵심 설비 & 부속 장치

1. **Chiller**: 흡수식 vs 전자식, 부분 부하 효율(IPLV/NPLV)
2. **Cooling Tower**: Fan Speed VFD 제어, ΔT 5–7 K
3. **Boiler**: 콘덴싱/비콘덴싱, 고온수·저온수 구분
4. **AHU**: 코일, 팬, 혼합댐퍼, 필터(MERV 등급)
5. **VAV Box**: 댐퍼 구동기, 재열코일(전기/온수)
6. **Pump**: 가변유량, Differential Pressure 센서 제어

### 부속 장치 요약

* 밸브(2‑Way/3‑Way), 댐퍼, 센서류(Temp, RH, ΔP, Flow), Expansion Tank, VFD

## 6. 제어 계층 & BAS/BMS 통신

```
Field Layer   : 센서·액추에이터 (Analog 4–20 mA, Digital)
Controller    : DDC (Direct Digital Controller) – 로컬 PID, Schedules
Supervisory   : BMS 서버 (Trend, Alarm, Graphic, Logic)
Enterprise IT : Cloud Analytics, Digital Twin, FDD, AI Optimizer
```

### Protocols

* **BACnet/IP MSTP**, **Modbus RTU/TCP**, **LonWorks**, OPC UA, **MQTT** (신규 IoT)
* 포인트 네이밍 규칙 샘플: `BLDG1_AHU03.SUPPLY_AIR_TEMP`

## 7. 센서·데이터 포인트 목록 (실무 예시)

| 분류       | 대표 태그               | 취득 주기  | 비고                  |
| -------- | ------------------- | ------ | ------------------- |
| 공기온도     | SAT, RAT, MAT       | 1 min  | Supply/Return/Mixed |
| 습도       | SA\_RH, Z\_RH       | 5 min  | %RH                 |
| 압력       | Duct ΔP, Pump ΔP    | 15 sec | Pa 또는 kPa           |
| 유량       | CHW\_FLOW, CW\_FLOW | 1 min  | m³/h                |
| 밸브/댐퍼 위치 | Vlv\_Pos, Dmpr\_Pos | event  | 0–100 %             |
| 전력       | CHLR\_kW, FAN\_kW   | 1 min  | kW, 에너지 적산 가능       |
| CO₂/TVOC | Z\_CO2              | 5 min  | ppm                 |

> **팁**: 디지털트윈에는 *정적 자산 정보*와 *시계열 센서 데이터* 두 레이어를 분리해 모델링하세요.

## 8. 성능 지표 & 분석 KPI

* **Energy Use Intensity(EUI)**, kWh/m²·yr
* **Chiller kW/RT** (Refrigeration Ton), 목표 0.55–0.7 이하
* **COP/NPLV/IPLV**
* **ΔT Performance**: 설계 6 K vs 실제 4 K → 효율 저하 시그널
* **Comfort Index**: PMV/PPD (ASHRAE 55)
* **Ventilation Effectiveness**: Outdoor Air Ratio

### 분석 예시

* 부하‑COP 상관 모델 회귀 → 이상 감지
* VAV 최소풍량 재조정 → 팬 전력 20 % 절감

## 9. 디지털트윈 통합 전략

### 9‑1. 자산 계층화

`Building → System(HVAC) → Equipment(AHU) → Component(Coils) → Point(SAT)`

### 9‑2. 데이터 플로우

1. **수집**: BMS ↔ Gateway ↔ Time‑Series DB
2. **모델 매핑**: IFC/BIM GUID <→> 센서 태그 키 맵핑
3. **시뮬레이션 연동**: EnergyPlus, Modelica cosimulation
4. **서비스**: FDD, Predictive Maintenance, Optimal Control

### 9‑3. 단계별 로드맵

| 단계 | 목표              | 난이도   | 필요 작업                  |
| -- | --------------- | ----- | ---------------------- |
| 1  | 실시간 모니터링        | ★★    | 태그 정리, Trend 구축        |
| 2  | FDD 룰베이스        | ★★★   | KPI 정의, Rule Authoring |
| 3  | 머신러닝 예측         | ★★★★  | 데이터 정제, 모델 학습          |
| 4  | Closed‑Loop 최적화 | ★★★★★ | API Control, 안전 검사     |

## 10. 국내·국제 표준 및 규정

* **ASHRAE 55** (Thermal Comfort)
* **ASHRAE 62.1** (Ventilation)
* **ASHRAE 90.1** (Energy Standard) – 국내 ‘건축물에너지절약설계기준’ 참조
* **ISO 52120‑1:2021** (BACS 효율), **ISO 16739** (IFC)
* **한국기계설비설치기준** (국가법령정보)

## 11. 추천 학습 경로 & 자료

1. **ASHRAE Handbook – HVAC Fundamentals** (무료 Student Member 가능)
2. **Coursera “Introduction to Building Systems” (UIUC)**
3. **국내 건축설비학회 세미나**
4. **NREL OpenStudio/EnergyPlus 튜토리얼**
5. 사내/프로젝트 **BMS Point List** 실제 분석 → 가장 빠른 실전 학습

---

### 끝내며

* 디지털트윈 개발자는 **데이터 구조**와 **실제 물리 시스템 행동**을 동시에 이해해야 합니다.
