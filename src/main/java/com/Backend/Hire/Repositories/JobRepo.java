package com.Backend.Hire.Repositories;
import com.Backend.Hire.Models.Job;
import com.Backend.Hire.Models.JobType;
import com.Backend.Hire.Models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobRepo extends JpaRepository<Job, Long> {

    // filter by domain — for home dashboard domain filter
    List<Job> findByDomainIgnoreCase(String domain);

    // filter by type — JOB or INTERNSHIP
    List<Job> findByType(JobType type);

    // filter by domain AND type together
    List<Job> findByDomainIgnoreCaseAndType(String domain, JobType type);

    // keyword search across title, company, description
    @Query("SELECT j FROM Job j WHERE " +
            "LOWER(j.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(j.company) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(j.description) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Job> searchByKeyword(@Param("keyword") String keyword);

    // get all jobs posted by a specific admin
    List<Job> findByPostedBy(User admin);

    // combined domain + keyword search
    @Query("SELECT j FROM Job j WHERE " +
            "LOWER(j.domain) = LOWER(:domain) AND (" +
            "LOWER(j.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(j.company) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<Job> findByDomainAndKeyword(@Param("domain") String domain,
                                     @Param("keyword") String keyword);
}