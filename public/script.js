var weatherApp = function () {
  // declare some variables
  var cities = [],
    userSearches = [];
  const STORAGE_ID = 'searchCities',
    STORAGE_ID_US = 'userSearches';

  /***Internal Functions***/
  //stringify and save our entire cities array.
  var _saveToLocalStorage = function () {
    localStorage.setItem(STORAGE_ID, JSON.stringify(cities));
  };

  //get our cities array out of local storage and convert them back to JS objects
  var _getFromLocalStorage = function () {
    var storageCities = JSON.parse(localStorage.getItem(STORAGE_ID) || '[]');
    var userSearches = JSON.parse(localStorage.getItem(STORAGE_ID_US) || '[]');
    return {
      storageCities: storageCities,
      userSearches: userSearches
    };
  };

  var _saveToLocalStorageUserSearch = function () {
    localStorage.setItem(STORAGE_ID_US, JSON.stringify(userSearches));
  };

  // check if the city exsit in the array
  var _ifCityExist = function (city, temp) {
    for (let i = 0; i < cities.length; i++) {
      if (city == cities[i].city) {
        if (temp !== cities[i].currentWeather.temp.celsius) {
          return i;
        } else {
          // the current temp in the city has not changed
          return false;
        }
      }
    }
    // new city
    return true;
  };

  // add new city to the array and page
  var _addPost = function (data) {
    // check if city exist
    const result = _ifCityExist(data.name, Math.round(data.main.temp));
    var timeInMs = new Date(Date.now());
    var currentWeather = {
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

    // create new city
    if (result === true) {
      var cityPost = {
        city: data.name,
        country: data.sys.country,
        isPinned: false,
        totalComments: 0,
        currentWeather: currentWeather,
        oldWeather: []
      };
      cities.push(cityPost);
      _addNewPostToPage(cities.length - 1, false); // update the page
    } else if (result === false) { // city already exist and updated on the page
      $('.invalid-city').show().text('There is already a post for the city you searched with the current weather.').fadeOut(5000);
    } else { // add new weather data to existing city in the array
      cities[result].oldWeather.push(cities[result].currentWeather);
      cities[result].currentWeather = currentWeather;
      _updateCity(result, cities[result].isPinned, 0); // update page - section old and section current
      _updateCity(result, cities[result].isPinned, 1);
      _renderAllComments();
    }
    _saveToLocalStorage();
  };

  // render all comments on the page
  var _renderAllComments = function () {
    $('.comments').empty();
    for (let i = 0; i < cities.length; i += 1) {
      // the current post in the iteration
      var city = cities[i];
      var section = city.isPinned ? $('.pinnedPosts') : $('.posts');
      // finding the city element in the page
      var $post = section.find(`#${city.city}`);
      // iterate through each comment in the cuurent weather
      for (let j = 0; j < city.currentWeather.comments.length; j += 1) {
        let comment = city.currentWeather.comments[j];
        let output = `<p class="comment"><i class="far fa-comment"></i>${comment}</p>`;
        $post.find('.current-weather .comments').append(output);
      }
      // iterate through each comment in the old weather array
      for (let x = 0; x < city.oldWeather.length; x++) {
        for (var y = 0; y < city.oldWeather[x].comments.length; y++) {
          let commentText = city.oldWeather[x].comments[y];
          let comment = `<p class="comment"><i class="far fa-comment"></i>${commentText}</p>`;
          $post.find('.old-weather .data-api').eq(x).find('.comments').append(comment);
        }
      }
    }
  };

  // add the new post that was created to the page
  var _addNewPostToPage = function (index, isPinned) {
    var button = '<span class="input-group-btn"><button type="submit" class="btn btn-success add-comment">Comment</button></span>';
    var commentDiv = '<div class="comments"></div>';
    var trash = '<i class="far fa-trash-alt remove-item"></i>';
    var pin = '<i class="fas fa-thumbtack pin-item"></i>';

    const object = cities[index];
    var cityID = `id="${object.city}"`;
    var pinnedClass = isPinned ? `<div class="new-city pinned" ${cityID}>` : `<div class="new-city" ${cityID}>`;
    // create the comment form
    var commentForm = `<form class="input-group post-form"><input type="text" id="input-comment" placeholder="Comment about the weather in ${object.city} "class="form-control"> ${button} </form><div class="invalid-comment"></div>`;
    // create the post div
    var newPost = `${pinnedClass} <div class="header-post">
       <h4 class="city"> ${object.city}, ${object.country}</h4><div class="icons">${pin} ${trash}</div></div><div class="totalComments">Total Comments: <span class="numComment">${object.totalComments}</span></div>` + '<div class="old-weather"></div>' +
      `<div class="current-weather"><div class="data-api"><span class="temp"> ${object.currentWeather.temp.celsius} &#8451 / ${object.currentWeather.temp.fahrenheit} &#8457</span> at ${object.currentWeather.time.hour} on ${object.currentWeather.time.date} <img src="http://openweathermap.org/img/w/${object.currentWeather.icon}.png">
       <span class="temp">${object.currentWeather.description}</span>
       </div>${commentDiv}</div>${commentForm}</div></div>`;
    // update the page with the new post
    isPinned ? $('.pinnedPosts').prepend(newPost) : $('.posts').prepend(newPost);
  };

  // update exsit post on the page
  var _updateCity = function (index, isPinned, status) {
    const city = cities[index].city;
    var section = isPinned ? $('.pinnedPosts') : $('.posts');
    var $post = section.find(`#${city}`);

    var newSection = '';
    if (!status) { // go through old weather
      $post.find('.old-weather').empty();
      for (var j = 0; j < cities[index].oldWeather.length; j++) {
        newSection = `<div class="data-api"><span class="temp"> ${cities[index].oldWeather[j].temp.celsius} &#8451 / ${cities[index].oldWeather[j].temp.fahrenheit} &#8457</span> at ${cities[index].oldWeather[j].time.hour} on ${cities[index].oldWeather[j].time.date} <img src="http://openweathermap.org/img/w/${cities[index].oldWeather[j].icon}.png">
       <span class="temp">${cities[index].oldWeather[j].description}</span><div class="comments"></div></div>`;

        $post.find('.old-weather').append(newSection);

      }
    } else { // update only currentWeather section
      newSection = `<div class="data-api"><span class="temp"> ${cities[index].currentWeather.temp.celsius} &#8451 / ${cities[index].currentWeather.temp.fahrenheit} &#8457</span> at ${cities[index].currentWeather.time.hour} on ${cities[index].currentWeather.time.date} <img src="http://openweathermap.org/img/w/${cities[index].currentWeather.icon}.png">
      <span class="temp">${cities[index].currentWeather.description}</span></div><div class="comments"></div>`;
      $post.find('.current-weather').empty();
      $post.find('.current-weather').append(newSection);
    }

    _renderAllComments();
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
  var updateAllPosts = function () {
    $('.posts').empty();
    $('.pinnedPosts').empty();
    for (let i = 0; i < cities.length; i++) {
      let city = cities[i];
      _addNewPostToPage(i, city.isPinned);
      if (city.oldWeather.length !== 0) {
        _updateCity(i, city.isPinned, 0);
      }
    }
  };

  //remove item from cities cart
  var removePost = function (postID) {
    for (let i = 0; i < cities.length; i++) {
      if (cities[i].city === postID) {
        cities.splice(i, 1);
      }
      _saveToLocalStorage();
    }
  };

  // add comment to the array
  var addComment = function (comment, post) {
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
  var fetch = function (urlCity, city) {
    $.get(urlCity).then(function (data) {
      _addPost(data);
      // save the name of the searched city in local storage
      for (var i = 0; i < userSearches.length; i++) {
        if (userSearches[i] == city) {
          return;
        }
      }
      userSearches.push(city);
      _saveToLocalStorageUserSearch();
    }).catch(function () {
      $('.invalid-city').text('No city was found, try another search').show().fadeOut(5000);
    });
  };

  // sorting the cities on the page
  var sortPage = function (sortChoice, clicks) {
    // check what option of sorting was selected
    cities = (sortChoice == 1) ? cities.sort(_sortByCityDES) : (sortChoice == 2 ? cities.sort(_sortByTempDES) : cities.sort(_sortByDateDES));
    //show icon arrow down
    $('.sort-icon').html('<i class="fas fa-arrow-down"></i>');

    if (clicks % 2 == 0) {
      cities.reverse();
      //show icon arrow up
      $('.sort-icon').html('<i class="fas fa-arrow-up"></i>');
    }
    updateAllPosts();
    _renderAllComments();
  };

  // Pin or unpin item to the top of the posts
  var pinItem = function (postID, post) {
    for (var i = 0; i < cities.length; i++) {
      if (cities[i].city === postID) {
        var index = i;
      }
    }
    if (post.hasClass('pinned')) {
      // update the property
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
  var removeComment = function (post, commentIndex) {
    var city = post.attr('id');
    for (var i = 0; i < cities.length; i++) {
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
  // display all posts when the page loads
  updateAllPosts();
  _renderAllComments();

  return {
    fetch: fetch,
    removePost: removePost,
    addComment: addComment,
    sortPage: sortPage,
    pinItem: pinItem,
    removeComment: removeComment
  };
};

var app = weatherApp();

/****EVENT-LISTENERS****/

// click search city- Get-temp
$('.search-city').on('submit', function (e) {
  e.preventDefault();
  var city = $('#input-temp').val();
  var url = 'http://api.openweathermap.org/data/2.5/weather?q=' + city + '&units=metric&sunits=imperial&appid=d703871f861842b79c60988ccf3b17ec';
  // check if input is empty
  if (city === '') {
    $('.invalid-city').show().text('Please enter city\'s name.').fadeOut(5000);
    return;
  }
  // check if enter was the key that was presssed
  app.fetch(url, city);
  // empty input value
  $('#input-temp').val('');
  // }
});

// Click on remove post
$('.posts, .pinnedPosts').on('click', '.remove-item', function () {
  var $post = $(this).closest('.new-city');
  var postID = $post.attr('id');
  // Check  if post is pinned and remove from array
  app.removePost(postID);
  // remove from page
  $post.remove();
});

// Click on add comment
$('.posts, .pinnedPosts').on('submit', '.post-form', function (e) {
  e.preventDefault();
  var $post = $(this).closest('.new-city');
  var commentText = $(this).find('#input-comment').val();
  // check if input is empty
  if (commentText === '') {
    $(this).siblings('.invalid-comment').text('Please write some text in the comment.').show().fadeOut(5000);
    return;
  }
  // check if enter was the key that was presssed
  app.addComment(commentText, $post);
  // empty input value
  $(this).find('#input-comment').val('');
});

// Click on the pin button
$('.posts, .pinnedPosts').on('click', '.pin-item', function () {
  var $post = $(this).closest('.new-city');
  // add or remove class pinned
  $post.toggleClass('pinned');
  var postID = $post.attr('id');
  app.pinItem(postID, $post);
});

// Click on comment to remove
$('.posts, .pinnedPosts').on('click', '.current-weather .comment', function () {
  var $post = $(this).closest('.new-city');
  var commentIndex = $(this).index();
  $(this).remove();
  app.removeComment($post, commentIndex);
});

// Check select input - sort by
var clicks = 0;

$('select').change(function () {
  var sortBy = $(this).find('option:selected').val();
  clicks++;
  app.sortPage(sortBy, clicks);
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