package com.Backend.Hire.Repositories;

import com.Backend.Hire.Models.ApplicationStatus;
import com.Backend.Hire.Models.Applications;
import com.Backend.Hire.Models.Job;
import com.Backend.Hire.Models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApplicationRepo extends JpaRepository<Applications, Long> {

    List<Applications> findByUser(User user);
    List<Applications> findByJob(Job job);
    List<Applications> findByUserAndJob(User user, Job job);
    List<Applications> findByJobAndStatus(Job job, ApplicationStatus status);
    List<Applications> findByStatus(ApplicationStatus status);
    Boolean existsByUserAndJob(User user, Job job);


}
