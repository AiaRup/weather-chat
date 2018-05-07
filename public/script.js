var weatherApp = function () {
  // declare some variables
  var cities = [];
  var pinnedCities = [];
  var STORAGE_ID = 'searchCities';
  var STORAGE_ID_PN = 'pinnedCities';

  /***Internal Functions***/
  //stringify and save our entire cities array.
  var _saveToLocalStorage = function () {
    localStorage.setItem(STORAGE_ID, JSON.stringify(cities));
    localStorage.setItem(STORAGE_ID_PN, JSON.stringify(pinnedCities));
  };

  //get our cities array out of local storage and convert them back to JS objects
  var _getFromLocalStorage = function () {
    var storageCities = JSON.parse(localStorage.getItem(STORAGE_ID) || '[]');
    var storagePinned = JSON.parse(localStorage.getItem(STORAGE_ID_PN) || '[]');
    return {
      storageCities: storageCities,
      storagePinned: storagePinned
    };
  };

  // add new city to the array
  var _addPost = function (data) {
    console.log(data);

    var timeInMs = new Date(Date.now());
    var cityPost = {
      city: data.name,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      country: data.sys.country,
      temp: {
        celsius: Math.round(data.main.temp),
        fahrenheit: Math.round(data.main.temp * 1.8)
      },
      time: {
        timeInMs: timeInMs.getTime(),
        hour: timeInMs.toLocaleTimeString().substring(0, 5),
        date: timeInMs.toLocaleDateString().replace(/\./g, '/')
      },
      comments: []
    };
    cities.unshift(cityPost);
    // update local storage
    _saveToLocalStorage();
  };

  // render all comments on the page
  var _renderAllComments = function () {
    $('.comments').empty();
    // go through the cities array
    for (let i = 0; i < cities.length; i += 1) {
      // the current post in the iteration
      var city = cities[i];
      // finding the city element in the page
      var $post = $('.posts').find('.new-city').eq(i);
      // iterate through each comment in our city comments
      var output = '';
      for (let j = 0; j < city.comments.length; j += 1) {
        var comment = city.comments[j];
        output += `<p class="comment"><i class="far fa-comment"></i>${comment}</p>`;
      }
      $post.find('.comments').append(output);
    }
    // go through the pinned array
    for (var i = 0; i < pinnedCities.length; i += 1) {
      // the current post in the iteration
      var pinnedCity = pinnedCities[i];
      // finding the city element in the page
      var $pinnedPost = $('.pinnedPosts').find('.new-city').eq(i);
      // iterate through each comment in our city comments
      var output2 = '';
      for (var j = 0; j < pinnedCity.comments.length; j += 1) {
        var pinnedComment = pinnedCity.comments[j];
        output2 += `<p class="comment"><i class="far fa-comment"></i>${pinnedComment}</p>`;
      }
      $pinnedPost.find('.comments').append(output2);
    }
  };

  // update comments of one post on the page
  var _updateComment = function (post, postIndex, array) {
    post.find('.comments').empty();
    var output = '';
    for (let i = 0; i < array[postIndex].comments.length; i++) {
      output += `<p class="comment"><i class="far fa-comment"></i>${array[postIndex].comments[i]}</p>`;
    }
    post.find('.comments').append(output);
  };

  // sorting functions
  function _sortByCity(a, b) {
    return (a.city > b.city) ? 1 : ((b.city > a.city) ? -1 : 0);
  }

  function _sortByTemp(a, b) {
    return a.temp.celsius - b.temp.celsius;
  }

  function _sortByDate(a, b) {
    return b.time.timeInMs - a.time.timeInMs;
  }

  /****Return Functions*****/
  // add new search-city to the page
  var updatePosts = function (codeForPostSection) {
    var $postSection = codeForPostSection === 0 ? $('.pinnedPosts') : $('.posts');
    var array = codeForPostSection === 0 ? pinnedCities : cities;
    var postClass = codeForPostSection === 0 ? 'class="new-city pinned"' : 'class="new-city"';
    // empty the corresponding post section in the page
    $postSection.empty();

    var newPost = '',
      commentForm = '';
    var button = '<span class="input-group-btn"><button type="submit" class="btn btn-success add-comment">Comment</button></span>';
    var commentDiv = '<div class="comments"></div>';
    var trash = '<i class="far fa-trash-alt remove-item"></i>';
    var pin = '<i class="fas fa-thumbtack pin-item"></i>';

    for (let i = 0; i < array.length; i++) {
      const object = array[i];
      // create the comment form
      commentForm = `<form class="input-group post-form"><input type="text" id="input-comment" placeholder="Comment about the weather in ${object.city} "class="form-control"> ${button} </form><div class="invalid-comment"></div>`;
      // create the post div
      newPost += `<div ${postClass}>` +
        `<div class="header-post">
       <h4 class="city"> ${object.city}, ${object.country}</h4><div class="icons">${pin} ${trash}</div></div>` +
        `<div class="data-api"><span class="temp"> ${object.temp.celsius} &#8451 / ${object.temp.fahrenheit} &#8457</span> at ${object.time.hour} on ${object.time.date} <img src="http://openweathermap.org/img/w/${object.icon}.png">
       <span class="temp">${object.description}</span>
       </div> ${commentDiv} ${commentForm}</div></div>`;
    }
    $postSection.append(newPost);
  };

  //remove item from cities cart
  var removePost = function (index, post) {
    var array = post.hasClass('pinned') ? pinnedCities : cities;
    for (let i = 0; i < array.length; i++) {
      if (i === index) {
        array.splice(index, 1);
      }
      _saveToLocalStorage();
    }
  };

  // add comment to the array
  var addComment = function (comment, post) {
    var array = post.hasClass('pinned') ? pinnedCities : cities;
    for (let i = 0; i < array.length; i++) {
      if (i === post.index()) {
        array[i].comments.push(comment);
        _updateComment(post, i, array);
      }
    }
    // update local storage
    _saveToLocalStorage();
  };

  // get data from the weather api
  var fetch = function (urlCity) {
    $.get(urlCity).then(function (data) {
      _addPost(data);
      updatePosts(1);
      _renderAllComments();
    }).catch(function () {
      $('.invalid-city').text('No city was found, try another search').show().fadeOut(5000);
    });
  };

  // sorting the cities on the page
  var sortPage = function (sortChoice) {
    // check what option of sorting was selected
    cities = (sortChoice == 1) ? cities.sort(_sortByCity) : (sortChoice == 2 ? cities.sort(_sortByTemp) : cities.sort(_sortByDate));
    updatePosts(1);
    _renderAllComments();
  };

  // Pin or unpin item to the top of the posts
  var pinItem = function (postIndex, post) {
    if (post.hasClass('pinned')) {
      //pin the post to the top of the page
      $('.pinnedPosts').prepend(post);
      // add the post to the pinned array and remove from cities array
      for (let i = 0; i < cities.length; i++) {
        if (postIndex === i) {
          pinnedCities.unshift(cities[i]);
          cities.splice(i, 1);
        }
      }
    } else {
      for (let i = 0; i < pinnedCities.length; i++) {
        if (postIndex === i) {
          // update the pinned post section
          $('.pinnedPosts').find('.new-city').eq(i).remove();
          cities.unshift(pinnedCities[i]);
          pinnedCities.splice(i, 1);
        }
      }
    }
    // save to local storage and update the cities post
    _saveToLocalStorage();
    // update the unpinned posts section
    updatePosts(1);
    _renderAllComments();
  };

  // update the arrays as soon as the page loads
  cities = _getFromLocalStorage().storageCities;
  pinnedCities = _getFromLocalStorage().storagePinned;
  // display all posts the page loads
  updatePosts(1);
  updatePosts(0);
  _renderAllComments();

  return {
    fetch: fetch,
    removePost: removePost,
    addComment: addComment,
    sortPage: sortPage,
    pinItem: pinItem,
  };
};

var app = weatherApp();

/****EVENT-LISTENERS****/

// click search city- Get-temp
$('#getTemp').on('click keypress', function (e) {
  e.preventDefault();
  var city = $('#input-temp').val();
  var url = 'http://api.openweathermap.org/data/2.5/weather?q=' + city + '&units=metric&sunits=imperial&appid=d703871f861842b79c60988ccf3b17ec';
  // check if input is empty
  if (city === '') {
    $('.invalid-city').show().text('Please enter city\'s name.').fadeOut(5000);
    return;
  }
  // check if enter was the key that was presssed
  if (e.which === 13 || e.type === 'click') {
    app.fetch(url);
    // empty input value
    $('#input-temp').val('');
  }
});

// Click on remove post
$('.posts, .pinnedPosts').on('click', '.remove-item', function () {
  var $post = $(this).closest('.new-city');
  var index = $post.index();
  // Check  if post is pinned or not and remove from the corresponding array
  app.removePost(index, $post);
  // remove from page
  $post.remove();
});

// Click on add comment
$('.posts, .pinnedPosts').on('click keypress', '.add-comment', function (e) {
  e.preventDefault();
  var $post = $(this).closest('.new-city');
  var commentText = $(this).parent().siblings('#input-comment').val();
  // check if input is empty
  if (commentText === '') {
    $(this).closest('.post-form').siblings('.invalid-comment').text('Please write some text in the comment.').show().fadeOut(5000);
    return;
  }
  // check if enter was the key that was presssed
  if (e.which === 13 || e.type === 'click') {
    app.addComment(commentText, $post);
    // empty input value
    $(this).parent().siblings('#input-comment').val('');
  }
});

// Click on the pin button
$('.posts, .pinnedPosts').on('click', '.pin-item', function () {
  var $post = $(this).closest('.new-city');
  // add or remove class pinned
  $post.toggleClass('pinned');
  var index = $post.index();
  app.pinItem(index, $post);
});

// Check select input - sort by
$('select').change(function () {
  var sortBy = $(this).find('option:selected').val();
  app.sortPage(sortBy);
});

// Event for showing the loading image when waiting for ajax response
$(document).ajaxSend(function () {
  $('#ajax-loader').show();
});

$(document).ajaxComplete(function () {
  $('#ajax-loader').hide();
});