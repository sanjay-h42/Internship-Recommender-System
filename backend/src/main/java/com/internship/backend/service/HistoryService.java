package com.internship.backend.service;

import com.internship.backend.dto.SearchHistoryRequest;
import com.internship.backend.dto.SearchHistoryResponse;
import com.internship.backend.model.SearchHistory;
import com.internship.backend.model.User;
import com.internship.backend.repository.SearchHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HistoryService {

    private final SearchHistoryRepository historyRepository;

    /** Save a new search entry for the given user. */
    @Transactional
    public SearchHistoryResponse saveSearch(User user, SearchHistoryRequest req) {
        SearchHistory history = SearchHistory.builder()
                .user(user)
                .query(req.getQuery())
                .location(req.getLocation())
                .skills(req.getSkills())
                .sector(req.getSector())
                .searchMode(req.getSearchMode())
                .mode(req.getMode())
                .salaryMin(req.getSalaryMin())
                .timestamp(LocalDateTime.now())
                .build();
        history = historyRepository.save(history);
        return toResponse(history);
    }

    /** Get last 20 searches for user, newest first. */
    public List<SearchHistoryResponse> getHistory(User user) {
        return historyRepository.findByUserOrderByTimestampDesc(user)
                .stream()
                .limit(20)
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /** Delete a history entry — only if it belongs to the user. */
    @Transactional
    public void deleteEntry(User user, Long historyId) {
        historyRepository.deleteByIdAndUser(historyId, user);
    }

    private SearchHistoryResponse toResponse(SearchHistory h) {
        return SearchHistoryResponse.builder()
                .id(h.getId())
                .query(h.getQuery())
                .location(h.getLocation())
                .skills(h.getSkills())
                .sector(h.getSector())
                .searchMode(h.getSearchMode())
                .mode(h.getMode())
                .salaryMin(h.getSalaryMin())
                .timestamp(h.getTimestamp())
                .build();
    }
}
