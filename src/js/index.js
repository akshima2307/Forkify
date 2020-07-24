import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';


import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likeView from './views/likeView';


import { elements, renderLoader, clearLoader } from './views/base';
/*** Global State of the aap
 * - Search object
 * - Current recipe object
 * - Shopping list object
 * - Liked object 
 */
const state = {};

/**
 * Search Controller
 */
const controlSearch = async () => {
    // 1) Get a query from a view
    const query = searchView.getInput();//ToDo

    console.log(query);
    if (query) {

        //2) New search object and add it to state 
        state.search = new Search(query);


        try {
            //3) Prepare UI for result 
            searchView.clearInput();
            searchView.clearResults();
            renderLoader(elements.searchRes);
            //4) Search for recipe
            await state.search.getResults();

            //5) Render results on UI
            clearLoader();
            searchView.renderResults(state.search.result);
        } catch (error) {
            alert('Something went wrong... ');
            clearLoader();
        }
    }
};

elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    controlSearch();
});




elements.serachResPages.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline');
    if (btn) {
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage);
    }
});


/**
 * Recipe controller
 */

const controlRecipe = async () => {
    //Set the Id from the url
    const id = window.location.hash.replace('#', '');
    
    if (id) {
        //Perpare the UI for the changes 
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        //Highlight selected search item
        if(state.search) searchView.highLightSelected(id);

        // Creating the new recipe object 
        state.recipe = new Recipe(id);
        



        try {
            //Getting the recipe data
            await state.recipe.getRecipe();
           
            state.recipe.parseIngredients();

            //Calculate time and serving 
            state.recipe.calcTime();
            state.recipe.calcServings();

            // render recipe
            clearLoader();
            recipeView.renderRecipe(
                state.recipe,
                state.likes.isLiked(id)
                
                );

        } catch (error) {
            console.log(error);
            alert('Error processing recipe');
        }


    }
};

//window.addEventListener('hashchange', controlRecipe);
//window.addEventListener('load',controlRecipe);

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));
/**
List Controller
 */
const controlList = () => {
    // Create a new list IF there in none yet
    if (!state.list) state.list = new List();

    // Add each ingredient to the list and UI
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    });
}









//Delete and update the list
elements.shopping.addEventListener('click' , e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    //Delete button
    if(e.target.matches('.shopping__delete , .shopping__delete *')) {
        //Delete from the state
        state.list.deleteItem(id);
        //Delete from the UI
        listView.deleteItem(id);
    } //
    else if(e.target.matches('shopping__count-value')){
        const val = parseFloat(e.target.value , 10);
        state.list.updateCount(id , val);
    }
});

/**
Like Controller
 */
//Testing

const controlLike = () =>{
    if(!state.likes) state.likes = new Likes();
    const currentId = state.recipe.id;
    //User has not liked current recipe
    if(!state.likes.isLiked(currentId)) {
        //Add like to the state
        const newLike = state.likes.addLike(
            currentId,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
        );
        //Toggle the button
        likeView.toggleLikeBtn(true);
        //Add like to the UI list
        likeView.renderLike(newLike);
       
        

      //User has liked the current recipe  
    } else {
        //Remove Like from the state
        state.likes.deleteLike(currentId);
        //Toglle the like button 
        likeView.toggleLikeBtn(false);
       
        //Remove the like from UI
        likeView.deleteLike(currentId);
    }
    likeView.toggleLikeMenu(state.likes.getNumLikes());
    
}








//Handling recipe button clicks
elements.recipe.addEventListener('click' , e => {
    if(e.target.matches('.btn-decrease , .btn-decrease *')) {
        //Decrease button is clicked 
        if (state.recipe.servings > 1) {
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredients(state.recipe);
        }
    }else if(e.target.matches('.btn-increase , .btn-increase *')) {
        //inrease button is clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);
    }else if (e.target.matches('.recipe__btn--add , .recipe__btn--add *')){
        // Addin ingreient to the shopping list
        controlList();
    } else if (e.target.matches('.recipe__love , .recipe__love *')) {
        controlLike();
    }

});



// Restore like object on the page 

window.addEventListener('load', ()=> {
    state.likes = new Likes();
    //Restore the like
    state.likes.readStorage();
    //Toggle the button
    likeView.toggleLikeMenu(state.likes.getNumLikes());
    //Render
    state.likes.likes.forEach(like => likeView.renderLike(like));
});
