package tax.innovation.repository;

import tax.innovation.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;


@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByKraPin(String kraPin);
    boolean existsByPhone(String phone);
    Optional<User> findByVerificationToken(String verificationToken);
}
