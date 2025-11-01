package tax.innovation.messaging;

import tax.innovation.config.RabbitMQConfig;
import org.springframework.amqp.core.AmqpTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class EmailMessageSender {

    @Autowired
    private AmqpTemplate rabbitTemplate;

    public void sendVerificationEmail(String email, String verificationLink) {
        String message = String.format("{\"email\":\"%s\", \"verificationLink\":\"%s\"}", email, verificationLink);
        rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE_NAME, RabbitMQConfig.ROUTING_KEY, message);
    }
}