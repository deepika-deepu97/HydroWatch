package com.waterleak.baseline.kafka;

import com.waterleak.baseline.event.NightFlowAnomalyDetected;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class AnomalyEventProducer {
    private static final Logger log = LoggerFactory.getLogger(AnomalyEventProducer.class);

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${app.kafka.topic:soa.s10.t02.events}")
    private String topicName;

    public AnomalyEventProducer(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publishAnomalyEvent(NightFlowAnomalyDetected event) {
        log.info("Publishing NightFlowAnomalyDetected event: {} for property: {} to topic: {}",
                event.getEventId(), event.getPropertyId(), topicName);
        kafkaTemplate.send(topicName, event.getPropertyId(), event);
    }
}
