package tax.innovation.messaging;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import tax.innovation.config.RabbitMQConfig;
import jakarta.mail.internet.MimeMessage;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Component
public class EmailConsumer {

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private TemplateEngine templateEngine;

    @Autowired
    private ObjectMapper objectMapper;

    @RabbitListener(queues = RabbitMQConfig.QUEUE_NAME)
    public void receiveMessage(String message) {
        try {
            JsonNode jsonNode = objectMapper.readTree(message);
            String email = jsonNode.get("email").asText();
            String verificationLink = jsonNode.get("verificationLink").asText();

            Context context = new Context();
            context.setVariable("verificationLink", verificationLink);

            String htmlContent = templateEngine.process("welcome-email", context);

            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom("175dollarsnow@gmail.com");
            helper.setTo(email);
            helper.setSubject("Welcome to Tax Dash! Please Verify Your Email");
            helper.setText(htmlContent, true);

            mailSender.send(mimeMessage);
            System.out.println("Email sent successfully to: " + email);
        } catch (Exception e) {
            System.err.println("Failed to send email: " + e.getMessage());
        }
    }
}