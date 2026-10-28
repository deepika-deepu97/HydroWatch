import React, { useState } from 'react';
import { Server, Database, Radio, Layers, Code, Copy, Check, Terminal, Shield } from 'lucide-react';

export const ArchitectureTab: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<string>('BaselineEvaluationServiceTest.java');
  const [copied, setCopied] = useState<boolean>(false);

  const services = [
    {
      name: 'Eureka Server',
      port: 8761,
      role: 'Service Discovery Registry',
      db: 'In-Memory Registry',
      status: 'UP'
    },
    {
      name: 'API Gateway',
      port: 8080,
      role: 'Unified Gateway & JWT Perimeter Filter',
      db: 'Stateless / Netty',
      status: 'UP'
    },
    {
      name: 'Identity Service',
      port: 8081,
      role: 'JWT Issuance & Role Verification',
      db: 'identity_db (PostgreSQL)',
      status: 'UP'
    },
    {
      name: 'MeterSeries Service',
      port: 8082,
      role: 'Meter Readings & CSV Batch Ingestion',
      db: 'meter_series_db (PostgreSQL)',
      status: 'UP'
    },
    {
      name: 'Baseline Service',
      port: 8083,
      role: '01:00-05:00 Night Baseline & Kafka Publisher',
      db: 'baseline_db (PostgreSQL)',
      status: 'UP'
    },
    {
      name: 'LeakCase Service',
      port: 8084,
      role: 'Kafka Consumer & Case Lifecycle Management',
      db: 'leak_case_db (PostgreSQL)',
      status: 'UP'
    }
  ];

  const sourceFiles: Record<string, { path: string; language: string; content: string }> = {
    'BaselineEvaluationServiceTest.java': {
      path: 'backend/baseline-service/src/test/java/com/waterleak/baseline/service/BaselineEvaluationServiceTest.java',
      language: 'java',
      content: `package com.waterleak.baseline.service;

import com.waterleak.baseline.event.NightFlowAnomalyDetected;
import com.waterleak.baseline.kafka.AnomalyEventProducer;
import com.waterleak.baseline.model.BaselineEvaluationResult;
import com.waterleak.baseline.repository.PropertyBaselineRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

/**
 * CRITICAL BASELINE DOMAIN RULE TEST (Section 6)
 *
 * Configured threshold: 50% above baseline.
 * - Home A baseline: 10 units/hour.
 * - Home B baseline: 30 units/hour.
 * - Current flow for both homes: 35 units/hour.
 *
 * Expected result:
 * - Home A must be flagged because its flow exceeds its own baseline by 250%.
 * - Home B must not be flagged because its flow exceeds its own baseline by approximately 16.67%.
 *
 * Properties are NEVER compared against a single global baseline.
 */
class BaselineEvaluationServiceTest {

    private PropertyBaselineRepository baselineRepository;
    private AnomalyEventProducer anomalyEventProducer;
    private BaselineEvaluationService evaluationService;

    @BeforeEach
    void setUp() {
        baselineRepository = Mockito.mock(PropertyBaselineRepository.class);
        anomalyEventProducer = Mockito.mock(AnomalyEventProducer.class);
        evaluationService = new BaselineEvaluationService(baselineRepository, anomalyEventProducer);
    }

    @Test
    @DisplayName("Critical Domain Rule: Home A (Baseline 10, Flow 35) exceeds by 250% and is FLAGGED")
    void testHomeA_ShouldBeFlagged_WhenFlowIs35AndBaselineIs10() {
        String propertyId = "PROP-HOME-A";
        BigDecimal baselineFlow = new BigDecimal("10.00");
        BigDecimal observedFlow = new BigDecimal("35.00");
        BigDecimal thresholdPercent = new BigDecimal("50.00");

        BaselineEvaluationResult result = evaluationService.evaluateFlowWithBaseline(
                propertyId, observedFlow, baselineFlow, thresholdPercent
        );

        // Home A must be flagged because deviation is 250.00% >= 50.00%
        assertThat(result.isFlagged()).isTrue();
        assertThat(result.getDeviationPercent()).isEqualByComparingTo(new BigDecimal("250.00"));
        assertThat(result.getSeverity()).isEqualTo("CRITICAL");

        // Verify Kafka event published
        ArgumentCaptor<NightFlowAnomalyDetected> captor = ArgumentCaptor.forClass(NightFlowAnomalyDetected.class);
        verify(anomalyEventProducer, times(1)).publishAnomalyEvent(captor.capture());
        assertThat(captor.getValue().getPropertyId()).isEqualTo("PROP-HOME-A");
    }

    @Test
    @DisplayName("Critical Domain Rule: Home B (Baseline 30, Flow 35) exceeds by ~16.67% and is NOT FLAGGED")
    void testHomeB_ShouldNotBeFlagged_WhenFlowIs35AndBaselineIs30() {
        String propertyId = "PROP-HOME-B";
        BigDecimal baselineFlow = new BigDecimal("30.00");
        BigDecimal observedFlow = new BigDecimal("35.00");
        BigDecimal thresholdPercent = new BigDecimal("50.00");

        BaselineEvaluationResult result = evaluationService.evaluateFlowWithBaseline(
                propertyId, observedFlow, baselineFlow, thresholdPercent
        );

        // Home B must NOT be flagged because deviation is 16.67% < 50.00%
        assertThat(result.isFlagged()).isFalse();
        assertThat(result.getDeviationPercent()).isEqualByComparingTo(new BigDecimal("16.67"));
        assertThat(result.getSeverity()).isEqualTo("NORMAL");

        // Verify NO Kafka event published for Home B
        verify(anomalyEventProducer, never()).publishAnomalyEvent(any());
    }
}`
    },
    'BaselineEvaluationService.java': {
      path: 'backend/baseline-service/src/main/java/com/waterleak/baseline/service/BaselineEvaluationService.java',
      language: 'java',
      content: `package com.waterleak.baseline.service;

import com.waterleak.baseline.event.NightFlowAnomalyDetected;
import com.waterleak.baseline.kafka.AnomalyEventProducer;
import com.waterleak.baseline.model.BaselineEvaluationResult;
import com.waterleak.baseline.model.PropertyBaseline;
import com.waterleak.baseline.repository.PropertyBaselineRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.UUID;

@Service
public class BaselineEvaluationService {
    private final PropertyBaselineRepository baselineRepository;
    private final AnomalyEventProducer anomalyEventProducer;

    public BaselineEvaluationService(PropertyBaselineRepository baselineRepository,
                                    AnomalyEventProducer anomalyEventProducer) {
        this.baselineRepository = baselineRepository;
        this.anomalyEventProducer = anomalyEventProducer;
    }

    public BaselineEvaluationResult evaluateFlow(String propertyId, BigDecimal observedFlow) {
        PropertyBaseline baseline = baselineRepository.findByPropertyId(propertyId)
                .orElseThrow(() -> new IllegalArgumentException("No baseline found for property: " + propertyId));

        return evaluateFlowWithBaseline(propertyId, observedFlow,
                baseline.getBaselineFlowUnitsPerHour(), baseline.getDeviationThresholdPercent());
    }

    public BaselineEvaluationResult evaluateFlowWithBaseline(String propertyId, BigDecimal observedFlow,
                                                           BigDecimal baselineFlow, BigDecimal thresholdPercent) {
        BigDecimal difference = observedFlow.subtract(baselineFlow);
        BigDecimal deviationPercent = difference.divide(baselineFlow, 4, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100"))
                .setScale(2, RoundingMode.HALF_UP);

        boolean flagged = deviationPercent.compareTo(thresholdPercent) >= 0;

        String severity = flagged ? (deviationPercent.compareTo(new BigDecimal("200")) >= 0 ? "CRITICAL" : "HIGH") : "NORMAL";
        String reason = flagged
                ? String.format("Observed flow %.2f u/h exceeds baseline %.2f u/h by %.2f%% (threshold: %.2f%%)",
                observedFlow, baselineFlow, deviationPercent, thresholdPercent)
                : String.format("Observed flow %.2f u/h is normal (deviation: %.2f%%)", observedFlow, deviationPercent);

        if (flagged) {
            NightFlowAnomalyDetected event = new NightFlowAnomalyDetected(
                    "evt-" + UUID.randomUUID(),
                    Instant.now(),
                    propertyId,
                    baselineFlow,
                    observedFlow,
                    deviationPercent,
                    thresholdPercent,
                    severity,
                    reason
            );
            anomalyEventProducer.publishAnomalyEvent(event);
        }

        return new BaselineEvaluationResult(propertyId, baselineFlow, observedFlow, deviationPercent, thresholdPercent, flagged, severity, reason);
    }
}`
    },
    'AnomalyEventConsumer.java': {
      path: 'backend/leak-case-service/src/main/java/com/waterleak/leakcase/kafka/AnomalyEventConsumer.java',
      language: 'java',
      content: `package com.waterleak.leakcase.kafka;

import com.waterleak.leakcase.model.CaseStatus;
import com.waterleak.leakcase.model.InvestigationCase;
import com.waterleak.leakcase.model.ProcessProcessedEvent;
import com.waterleak.leakcase.model.Severity;
import com.waterleak.leakcase.repository.InvestigationCaseRepository;
import com.waterleak.leakcase.repository.ProcessedEventRepository;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Component
public class AnomalyEventConsumer {
    private final InvestigationCaseRepository caseRepository;
    private final ProcessedEventRepository eventRepository;

    public AnomalyEventConsumer(InvestigationCaseRepository caseRepository, ProcessedEventRepository eventRepository) {
        this.caseRepository = caseRepository;
        this.eventRepository = eventRepository;
    }

    @KafkaListener(topics = "\${app.kafka.topic:soa.s10.t02.events}", groupId = "leak-case-group")
    @Transactional
    public void consumeAnomalyEvent(Map<String, Object> event) {
        String eventId = (String) event.get("eventId");

        // Idempotency check: Guard against duplicate event processing
        if (eventId != null && eventRepository.existsByEventId(eventId)) {
            return; // Discard duplicate event
        }

        String propertyId = (String) event.get("propertyId");
        BigDecimal observedFlow = new BigDecimal(event.get("observedFlow").toString());
        BigDecimal baselineValue = new BigDecimal(event.get("baselineValue").toString());
        BigDecimal deviation = new BigDecimal(event.get("deviation").toString());
        String severityStr = (String) event.get("severity");
        String reason = (String) event.get("reason");

        InvestigationCase newCase = new InvestigationCase(
                "CASE-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(),
                propertyId,
                eventId != null ? eventId : "evt-unknown",
                CaseStatus.NEW,
                Severity.valueOf(severityStr != null ? severityStr.toUpperCase() : "MEDIUM"),
                observedFlow,
                baselineValue,
                deviation,
                Instant.now(),
                reason
        );

        caseRepository.save(newCase);
        if (eventId != null) {
            eventRepository.save(new ProcessProcessedEvent(eventId, "NightFlowAnomalyDetected"));
        }
    }
}`
    },
    'JwtAuthenticationFilter.java': {
      path: 'backend/api-gateway/src/main/java/com/waterleak/gateway/filter/JwtAuthenticationFilter.java',
      language: 'java',
      content: `package com.waterleak.gateway.filter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;

@Component
public class JwtAuthenticationFilter extends AbstractGatewayFilterFactory<JwtAuthenticationFilter.Config> {
    private final String jwtSecret = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";

    public JwtAuthenticationFilter() {
        super(Config.class);
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();
            String path = request.getURI().getPath();

            if (path.startsWith("/api/v1/auth/login") || path.startsWith("/actuator")) {
                return chain.filter(exchange);
            }

            String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }

            try {
                Claims claims = Jwts.parser()
                        .setSigningKey(Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8)))
                        .build()
                        .parseClaimsJws(authHeader.substring(7))
                        .getBody();

                ServerHttpRequest mutatedRequest = request.mutate()
                        .header("X-User-Id", claims.get("userId", String.class))
                        .header("X-User-Role", claims.get("role", String.class))
                        .header("X-User-Properties", claims.get("properties", String.class))
                        .build();

                return chain.filter(exchange.mutate().request(mutatedRequest).build());
            } catch (Exception ex) {
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }
        };
    }

    public static class Config {}
}`
    },
    'docker-compose.yml': {
      path: 'docker-compose.yml',
      language: 'yaml',
      content: `version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports: ["5432:5432"]
    volumes:
      - ./database/01-init-databases.sql:/docker-entrypoint-initdb.d/01-init-databases.sql:ro

  kafka:
    image: confluentinc/cp-kafka:7.6.0
    ports: ["9092:9092", "29092:29092"]
    environment:
      KAFKA_PROCESS_ROLES: 'broker,controller'
      KAFKA_ADVERTISED_LISTENERS: 'PLAINTEXT://kafka:29092,PLAINTEXT_HOST://localhost:9092'

  eureka-server:
    build: { context: ./backend, dockerfile: eureka-server/Dockerfile }
    ports: ["8761:8761"]

  api-gateway:
    build: { context: ./backend, dockerfile: api-gateway/Dockerfile }
    ports: ["8080:8080"]

  identity-service:
    build: { context: ./backend, dockerfile: identity-service/Dockerfile }
    ports: ["8081:8081"]

  meter-series-service:
    build: { context: ./backend, dockerfile: meter-series-service/Dockerfile }
    ports: ["8082:8082"]

  baseline-service:
    build: { context: ./backend, dockerfile: baseline-service/Dockerfile }
    ports: ["8083:8083"]

  leak-case-service:
    build: { context: ./backend, dockerfile: leak-case-service/Dockerfile }
    ports: ["8084:8084"]`
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(sourceFiles[selectedFile].content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Topology Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-sky-700" />
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Service-Oriented Architecture Topology
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Strict SOA isolation: Each domain microservice owns its PostgreSQL database and communicates through Apache Kafka event streaming.
            </p>
          </div>
        </div>

        {/* Microservices Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {services.map((s) => (
            <div key={s.name} className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-900 font-mono">{s.name}</span>
                <span className="font-mono text-sky-700 font-bold bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                  :{s.port}
                </span>
              </div>
              <div className="text-slate-600 font-sans text-[11px] mb-2">{s.role}</div>
              <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/80 text-[10px] text-slate-500 font-mono">
                <span>Persistence:</span>
                <span className="font-semibold text-slate-700">{s.db}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Code Browser */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-sky-700" />
            <h3 className="text-sm font-bold text-slate-900">
              Interactive Source Code Viewer
            </h3>
          </div>

          {/* File Picker */}
          <div className="flex items-center gap-2 flex-wrap">
            {Object.keys(sourceFiles).map((fileName) => (
              <button
                key={fileName}
                onClick={() => setSelectedFile(fileName)}
                className={`px-3 py-1.5 rounded-md text-xs font-mono transition-colors ${
                  selectedFile === fileName
                    ? 'bg-sky-700 text-white font-semibold'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {fileName}
              </button>
            ))}
          </div>
        </div>

        {/* File Path & Copy */}
        <div className="bg-slate-900 rounded-t-lg px-4 py-2.5 flex items-center justify-between text-xs font-mono text-slate-300 border-b border-slate-800">
          <span>{sourceFiles[selectedFile].path}</span>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>

        {/* Code Content */}
        <pre className="p-4 bg-slate-950 text-slate-200 rounded-b-lg text-xs font-mono overflow-x-auto max-h-[500px] leading-relaxed">
          {sourceFiles[selectedFile].content}
        </pre>
      </div>

      {/* Execution Instructions for Windows & Linux */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-sky-700" />
          <h3 className="text-base font-bold text-slate-900">
            How to Run in Windows (VS Code / PowerShell)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-4 bg-slate-950 text-emerald-300 rounded-lg space-y-2">
            <div className="text-slate-400 font-sans font-semibold">Option 1: Quickstart with Docker Compose</div>
            <div>git clone &lt;repo&gt;</div>
            <div>cd water-leak-night-flow-soa</div>
            <div className="text-white font-bold">docker-compose up --build -d</div>
            <div className="text-slate-400 font-sans pt-1">
              Launches Postgres (multi-db), Kafka KRaft, Eureka, Gateway, 4 microservices, and React frontend.
            </div>
          </div>

          <div className="p-4 bg-slate-950 text-sky-300 rounded-lg space-y-2">
            <div className="text-slate-400 font-sans font-semibold">Option 2: Windows Automated Batch Script</div>
            <div>cd water-leak-night-flow-soa</div>
            <div>.\\scripts\\setup.bat</div>
            <div className="text-white font-bold">.\\scripts\\start-all.bat</div>
            <div>.\\scripts\\run-tests.bat</div>
            <div className="text-slate-400 font-sans pt-1">
              Compiles Maven submodules with Java 21, installs node packages, and runs JUnit 5 tests.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
