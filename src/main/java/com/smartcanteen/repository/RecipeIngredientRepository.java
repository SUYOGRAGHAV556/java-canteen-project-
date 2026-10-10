package com.smartcanteen.repository;

import com.smartcanteen.model.RecipeIngredient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface RecipeIngredientRepository extends JpaRepository<RecipeIngredient, Long> {

    @Query("SELECT r FROM RecipeIngredient r JOIN FETCH r.inventoryItem WHERE r.menuItem.id IN :menuItemIds")
    List<RecipeIngredient> findByMenuItemIds(@Param("menuItemIds") Collection<Long> menuItemIds);
}
