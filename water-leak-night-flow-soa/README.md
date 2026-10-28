# HydroWatch — Smart Water Leak Detection & Night-Flow Analytics (AquaSentinel)

**Detect Early. Save Water. Protect Every Drop.**

A complete, production-grade Service-Oriented Architecture (SOA) and event-driven microservices platform for water utilities and residential property owners.

---

## 1. System Overview
- **Eureka Server** (Port `8761`): Service discovery.
- **API Gateway** (Port `8080`): Gateway routing, JWT validation, forward headers (`X-User-Id`, `X-User-Role`, `X-User-Properties`).
- **Identity Service** (Port `8081`): JWT tokens, authentication, user profiles.
- **MeterSeries Service** (Port `8082`): Hourly telemetry, property management, CSV ingestion.
- **Baseline Service** (Port `8083`): 01:00-05:00 night window median baseline calculation, anomaly threshold evaluation, Kafka publisher.
- **LeakCase Service** (Port `8084`): Kafka consumer for `soa.s10.t02.events`, idempotent duplicate-event filter, case workflow management.
- **Frontend** (Port `3000`): React + Vite + Tailwind CSS + Recharts UI.

---

## 2. The Critical Baseline Domain Rule (JUnit 5 & AssertJ)
Configured Threshold: **50% above baseline**.
- **Home A**: Baseline = 10 units/hr, Flow = 35 units/hr -> Deviation = 250% -> **FLAGGED (Anomaly/Leak)**
- **Home B**: Baseline = 30 units/hr, Flow = 35 units/hr -> Deviation = 16.67% -> **NOT FLAGGED (Normal)**

Tested in `backend/baseline-service/src/test/java/com/waterleak/baseline/service/BaselineEvaluationServiceTest.java`.

---

## 3. Quick Start (Windows / Linux)
```bash
# Clone and enter directory
cd water-leak-night-flow-soa

# Start full stack via Docker
docker-compose up -d

# Or run locally:
# 1. Start Eureka: cd backend/eureka-server && mvn spring-boot:run
# 2. Start Gateway: cd backend/api-gateway && mvn spring-boot:run
# 3. Start Identity: cd backend/identity-service && mvn spring-boot:run
# 4. Start MeterSeries: cd backend/meter-series-service && mvn spring-boot:run
# 5. Start Baseline: cd backend/baseline-service && mvn spring-boot:run
# 6. Start LeakCase: cd backend/leak-case-service && mvn spring-boot:run
# 7. Start Frontend: cd frontend && npm install && npm run dev
```
