package com.smartcanteen.repository;

import com.smartcanteen.model.Category;
import com.smartcanteen.model.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {
    List<MenuItem> findByCategory(Category category);
    List<MenuItem> findByIsAvailable(boolean isAvailable);
    List<MenuItem> findByNameContainingIgnoreCase(String keyword);
}
