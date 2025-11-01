package tax.innovation.dto;

import lombok.Data;

@Data
public class SignUpDto {

    private String company;
    private String kraPin;
    private String phone;
    private String email;
    private String password;

}