let weatherApp = function () {
  // declare some variables
  let cities = [], userSearches = [];
  const STORAGE_ID = 'searchCities', STORAGE_ID_US = 'userSearches';

  /***Internal Functions***/
  //stringify and save our entire cities array.
  let _saveToLocalStorage = function () {
    localStorage.setItem(STORAGE_ID, JSON.stringify(cities));
  };

  //get our cities array out of local storage and convert them back to JS objects
  let _getFromLocalStorage = function () {
    let storageCities = JSON.parse(localStorage.getItem(STORAGE_ID) || '[]');
    let userSearches = JSON.parse(localStorage.getItem(STORAGE_ID_US) || '[]');
    return {
      storageCities: storageCities,
      userSearches: userSearches
    };
  };

  let _saveToLocalStorageUserSearch = function () {
    localStorage.setItem(STORAGE_ID_US, JSON.stringify(userSearches));
  };

  // check if the city exsit in the array
  let _ifCityExist = function (city, temp) {
    for (let i = 0; i < cities.length; i++) {
      if (city == cities[i].city) {
        if (temp !== cities[i].currentWeather.temp.celsius) {
          return i; // city exsist already
        } else {
          return false;  // the current temp in the city has not changed
        }
      }
    }
    return true; // need to create new city post
  };

  // add new city to the array and page
  let _addPost = function (data) {
    // check if city exist
    const result = _ifCityExist(data.name.split(' ').join('-'), Math.round(data.main.temp));
    let timeInMs = new Date(Date.now());
    let currentWeather = {
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      temp: {
        celsius: Math.round(data.main.temp),
        fahrenheit: Math.round(data.main.temp * 1.8)
      },
      time: {
        timeInMs: timeInMs.getTime(),
        hour: timeInMs.toLocaleTimeString().substring(0, 5),
        date: timeInMs.toLocaleDateString().replace(/\./g, '/')
      },
      comments: [],
    };

    // create new city if not exist
    if (result === true) {
      let cityPost = {
        city: data.name.split(' ').join('-'),
        country: data.sys.country,
        isPinned: false,
        totalComments: 0,
        currentWeather: currentWeather,
        oldWeather: []
      };
      cities.push(cityPost);
      _addNewPostToPage(cities.length - 1, false);
    } else if (result === false) { // city already exist and updated on the page
      $('.invalid-city').show().text('There is already a post for the city you searched with the current weather.').fadeOut(8000);
    } else { // add new weather data to existing city in the array
      cities[result].oldWeather.push(cities[result].currentWeather);
      cities[result].currentWeather = currentWeather;
      _updateExistingCity(result, cities[result].isPinned, 0); // update old and current weather
      _updateExistingCity(result, cities[result].isPinned, 1);
      _renderAllComments();
    }
    _saveToLocalStorage();
  };

  // render all comments on the page
  let _renderAllComments = function () {
    $('.comments').empty();
    for (let i = 0; i < cities.length; i += 1) {
      let city = cities[i];
      let section = city.isPinned ? $('.pinnedPosts') : $('.posts');
      // finding the city element in the page
      let $post = section.find(`#${city.city}`);
      // iterate through each comment in the cuurent weather
      for (let j = 0; j < city.currentWeather.comments.length; j += 1) {
        let comment = city.currentWeather.comments[j];
        let output = `<p class="comment"><i class="far fa-comment"></i>${comment}</p>`;
        $post.find('.current-weather .comments').append(output);
      }
      // iterate through each comment in the old weather array
      for (let x = 0; x < city.oldWeather.length; x++) {
        for (let y = 0; y < city.oldWeather[x].comments.length; y++) {
          let commentText = city.oldWeather[x].comments[y];
          let comment = `<p class="comment"><i class="far fa-comment"></i>${commentText}</p>`;
          $post.find('.old-weather .data-api').eq(x).find('.comments').append(comment);
        }
      }
    }
  };

  // add the new post that was created to the page
  let _addNewPostToPage = function (index, isPinned) {
    let button = '<span class="input-group-btn"><button type="submit" class="btn btn-success add-comment">Comment</button></span>';
    let commentDiv = '<div class="comments"></div>';
    let trashIcon = '<i class="far fa-trash-alt remove-item"></i>';
    let pinIcon = '<i class="fas fa-thumbtack pin-item"></i>';

    const object = cities[index];
    let validId = object.city.split(' ').join('-'); // if city name contain more than one word
    let cityID = `id="${validId}"`;
    let pinnedClass = isPinned ? `<div class="city-post pinned" ${cityID}>` : `<div class="city-post" ${cityID}>`;
    // create the comment form
    let commentForm = `<form class="input-group comment-form"><input type="text" id="input-comment" placeholder="Comment about the weather in ${object.city} "class="form-control"> ${button} </form><div class="invalid-comment"></div>`;
    // create the post div
    let newPost = `${pinnedClass} <div class="header-post">
       <h4 class="city"> ${object.city}, ${object.country}</h4><div class="icons">${pinIcon} ${trashIcon}</div></div><div class="totalComments">Total Comments: <span class="numComment">${object.totalComments}</span></div>` + '<div class="old-weather"></div>' +
      `<div class="current-weather"><div class="data-api"><span class="temp"> ${object.currentWeather.temp.celsius} &#8451 / ${object.currentWeather.temp.fahrenheit} &#8457</span> at ${object.currentWeather.time.hour} on ${object.currentWeather.time.date} <img src="http://openweathermap.org/img/w/${object.currentWeather.icon}.png">
       <span class="temp">${object.currentWeather.description}</span>
       <img src="img/new-icon-blue.png">
       </div>${commentDiv}</div>${commentForm}</div></div>`;
    // update the page with the new post
    isPinned ? $('.pinnedPosts').prepend(newPost) : $('.posts').prepend(newPost);
  };

  // update exsit post on the page
  let _updateExistingCity = function (index, isPinned, status) {
    const city = cities[index].city;
    let PostSection = isPinned ? $('.pinnedPosts') : $('.posts');
    let $post = PostSection.find(`#${city}`);
    let newWeatherSection = '';

    if (!status) { // go through old weather
      $post.find('.old-weather').empty();
      for (let j = 0; j < cities[index].oldWeather.length; j++) {
        newWeatherSection = `<div class="data-api"><span class="temp"> ${cities[index].oldWeather[j].temp.celsius} &#8451 / ${cities[index].oldWeather[j].temp.fahrenheit} &#8457</span> at ${cities[index].oldWeather[j].time.hour} on ${cities[index].oldWeather[j].time.date} <img src="http://openweathermap.org/img/w/${cities[index].oldWeather[j].icon}.png">
        <span class="temp">${cities[index].oldWeather[j].description}</span><div class="comments"></div></div>`;

        $post.find('.old-weather').append(newWeatherSection);
      }
    } else { // update only currentWeather section
      newWeatherSection = `<div class="data-api"><span class="temp"> ${cities[index].currentWeather.temp.celsius} &#8451 / ${cities[index].currentWeather.temp.fahrenheit} &#8457</span> at ${cities[index].currentWeather.time.hour} on ${cities[index].currentWeather.time.date} <img src="http://openweathermap.org/img/w/${cities[index].currentWeather.icon}.png">
      <span class="temp">${cities[index].currentWeather.description}</span><img src="img/new-icon-blue.png"></div><div class="comments"></div>`;
      $post.find('.current-weather').empty();
      $post.find('.current-weather').append(newWeatherSection);
    }
  };

  // sorting functions
  function _sortByCityDES(a, b) {
    return (a.city > b.city) ? 1 : ((b.city > a.city) ? -1 : 0);
  }

  function _sortByTempDES(a, b) {
    return a.currentWeather.temp.celsius - b.currentWeather.temp.celsius;
  }

  function _sortByDateDES(a, b) {
    return b.currentWeather.time.timeInMs - a.currentWeather.time.timeInMs;
  }

  /****Return Functions*****/
  // add new search-city to the page
  let updateAllPosts = function () {
    $('.posts').empty();
    $('.pinnedPosts').empty();
    for (let i = 0; i < cities.length; i++) {
      let city = cities[i];
      _addNewPostToPage(i, city.isPinned);
      if (city.oldWeather.length !== 0) {
        _updateExistingCity(i, city.isPinned, 0);
      }
    }
    _renderAllComments();
  };

  //remove item from cities array
  let removePost = function (postID) {
    for (let i = 0; i < cities.length; i++) {
      if (cities[i].city === postID) {
        cities.splice(i, 1);
      }
      _saveToLocalStorage();
    }
  };

  // add comment to the array
  let addComment = function (comment, post) {
    const postID = post.attr('id');
    for (let i = 0; i < cities.length; i++) {
      if (postID == cities[i].city) {
        cities[i].currentWeather.comments.push(comment);
        post.find('.current-weather .comments').append(`<p class="comment"><i class="far fa-comment"></i>${comment}</p>`);
        cities[i].totalComments++; // add 1 to the total comments
        post.find('.totalComments .numComment').text(cities[i].totalComments); // update total on page
      }
    }
    _saveToLocalStorage();
  };

  // get data from the weather api
  let fetch = function (urlCity, city) {
    $.get(urlCity).then(function (data) {
      _addPost(data);
      // save the name of the searched city in local storage
      for (let i = 0; i < userSearches.length; i++) {
        if (userSearches[i] == city) {
          return;
        }
      }
      userSearches.push(city);
      _saveToLocalStorageUserSearch();
    }).catch(function () {
      $('.invalid-city').text('Sorry, we couldn\'t find any result matching your searched city').show().fadeOut(8000);
    });
  };

  // sorting the cities on the page
  let sortPage = function (sortChoice, clicks) {
    // check what option of sorting was selected
    cities = (sortChoice == 1) ? cities.sort(_sortByCityDES) : (sortChoice == 2 ? cities.sort(_sortByTempDES) : cities.sort(_sortByDateDES));
    $('.sort-icon').html('<i class="fas fa-arrow-down"></i>'); //show icon arrow down

    if (clicks % 2 == 0) {
      cities.reverse();
      $('.sort-icon').html('<i class="fas fa-arrow-up"></i>'); //show icon arrow up

    }
    updateAllPosts();
  };

  // Pin or unpin item to the top of the page
  let pinItem = function (postID, post) {
    for (let i = 0; i < cities.length; i++) {
      if (cities[i].city === postID) {
        var index = i;
      }
    }
    if (post.hasClass('pinned')) {
      // update the property pinned of the city object
      cities[index].isPinned = true;
      post.remove();
      $('.pinnedPosts').prepend(post);
    } else {
      cities[index].isPinned = false;
      post.remove();
      $('.posts').prepend(post);
    }
    _saveToLocalStorage();
    _renderAllComments();
  };

  //remove comment from array
  let removeComment = function (post, commentIndex) {
    let city = post.attr('id');
    for (let i = 0; i < cities.length; i++) {
      if (cities[i].city === city) {
        cities[i].currentWeather.comments.splice(commentIndex, 1);
        cities[i].totalComments--;
        post.find('.totalComments .numComment').text(cities[i].totalComments);
        _saveToLocalStorage();
        return;
      }
    }
  };

  // update the arrays as soon as the page loads
  cities = _getFromLocalStorage().storageCities;
  userSearches = _getFromLocalStorage().userSearches;
  // display all posts and comments when the page loads
  updateAllPosts();

  return {
    fetch,
    removePost,
    addComment,
    sortPage,
    pinItem,
    removeComment
  };
};

const app = weatherApp();

/****EVENT-LISTENERS****/
// click search city- Get-temp
$('.search-city-form').on('submit', function (e) {
  e.preventDefault();
  let city = $('#input-cityName').val();
  // check if input is empty
  if (city === '') {
    $('.invalid-city').show().text('Please enter a city name.').fadeOut(5000);
    return;
  }
  let url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&sunits=imperial&appid=d703871f861842b79c60988ccf3b17ec`;
  app.fetch(url, city);
  // empty input value
  $('#input-cityName').val('');
});

// Click on remove post
$('.posts, .pinnedPosts').on('click', '.remove-item', function () {
  let $post = $(this).closest('.city-post');
  let postID = $post.attr('id');
  // Check  if post is pinned and remove from array
  app.removePost(postID);
  // remove from page
  $post.remove();
});

// Click on add comment
$('.posts, .pinnedPosts').on('submit', '.comment-form', function (e) {
  e.preventDefault();
  let $post = $(this).closest('.city-post');
  let commentText = $(this).find('#input-comment').val();
  // check if input is empty
  if (commentText === '') {
    $(this).siblings('.invalid-comment').text('Please write some text in the comment.').show().fadeOut(5000);
    return;
  }
  app.addComment(commentText, $post);
  // empty input value
  $(this).find('#input-comment').val('');
});

// Click on the pin button
$('.posts, .pinnedPosts').on('click', '.pin-item', function () {
  let $post = $(this).closest('.city-post');
  // add or remove class pinned
  $post.toggleClass('pinned');
  let postID = $post.attr('id');
  app.pinItem(postID, $post);
});

// Click on remove comment
$('.posts, .pinnedPosts').on('click', '.current-weather .comment', function () {
  let $post = $(this).closest('.city-post');
  let commentIndex = $(this).index();
  $(this).remove();
  app.removeComment($post, commentIndex);
});

// Select sort page by..
let clicksNum = 0;

$('select').change(function () {
  let sortChoice = $(this).find('option:selected').val();
  clicksNum++;
  app.sortPage(sortChoice, clicksNum);
  // to enable the user to click again on an already selected option
  $('select option:selected').prop('selected', false);
  $('select option:first').prop('selected', 'selected');
});

// Event for showing the loading image when waiting for ajax response
$(document).ajaxSend(function () {
  $('#ajax-loader').show();
});

$(document).ajaxComplete(function () {
  $('#ajax-loader').hide();
});