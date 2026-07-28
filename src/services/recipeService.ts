import { Recipe } from '../types';
import { apiService } from './apiService';

export const getRecipes = async (companyId: string): Promise<Recipe[]> => {
  return await apiService.get(`production/recipes?companyId=${companyId}`);
};

export const addRecipe = async (recipe: Omit<Recipe, 'id'>) => {
  return await apiService.post('production/recipes', recipe);
};

export const updateRecipe = async (id: string, recipe: Partial<Recipe>) => {
  return await apiService.put(`production/recipes/${id}`, recipe);
};

export const deleteRecipe = async (id: string) => {
  return await apiService.delete(`production/recipes/${id}`);
};
