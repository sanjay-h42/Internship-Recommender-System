package com.internship.backend.repository;

import com.internship.backend.model.SearchHistory;
import com.internship.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SearchHistoryRepository extends JpaRepository<SearchHistory, Long> {
    List<SearchHistory> findByUserOrderByTimestampDesc(User user);
    void deleteByIdAndUser(Long id, User user);
}
