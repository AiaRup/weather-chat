var weatherApp = function () {
  // declare some variables
  var cities = [];
  var STORAGE_ID = 'searchCities';

  /***Internal Functions***/
  //stringify and save our entire cities array.
  var _saveToLocalStorage = function () {
    localStorage.setItem(STORAGE_ID, JSON.stringify(cities));
  };

  //get our cities array out of local storage and convert them back to JS objects
  var _getFromLocalStorage = function () {
    return JSON.parse(localStorage.getItem(STORAGE_ID) || '[]');
  };

  // add new city to the array
  var _addPost = function (data) {
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
        timeInMs:timeInMs.getTime(),
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

    for (var i = 0; i < cities.length; i += 1) {
      // the current post in the iteration
      var city = cities[i];
      // finding the city element in the page
      var $post = $('.posts').find('.new-city').eq(i);
      // iterate through each comment in our city comments
      var output = '';
      for (var j = 0; j < city.comments.length; j += 1) {
        var comment = city.comments[j];
        output += `<p class="comment"><i class="far fa-comment"></i>${comment}</p>`;
      }
      $post.find('.comments').append(output);
    }
  };

  // update comments of one post on the page
  var _updateComment = function (post, postIndex) {
    post.find('.comments').empty();
    var output = '';
    for (let i = 0; i < cities[postIndex].comments.length; i++) {
      output += `<p class="comment"><i class="far fa-comment"></i>${cities[postIndex].comments[i]}</p>`;
    }
    post.find('.comments').append(output);
  };

  // sorting functions
  function _sortByCity(a,b) {
    return (a.city > b.city) ? 1 : ((b.city > a.city) ? -1 : 0);
  }

  function _sortByTemp(a,b) {
    return a.temp.celsius - b.temp.celsius;
  }

  function _sortByDate(a,b) {
    return  b.time.timeInMs - a.time.timeInMs;
  }

  /****Return Functions*****/
  // add new search-city to the page
  var updatePosts = function () {
    $('.posts').empty();

    var newPost = '',
      commentForm = '';
    var button = '<span class="input-group-btn"><button type="submit" class="btn btn-success add-comment">Comment</button></span>';
    var commentDiv = '<div class="comments"></div>';
    var trash = '<a href="" title="delete this post" class="remove-item"><i class="far fa-trash-alt"></i></a>';
    var pin = '<a href="" title="pin this post" class="pin-item"><i class="fas fa-thumbtack"></i></a>';

    for (let i = 0; i < cities.length; i++) {
      const object = cities[i];
      // create the comment form
      commentForm = `<form class="input-group post-form"><input type="text" id="input-comment" placeholder="Comment about the weather in ${object.city} "class="form-control"> ${button} </form><div class="invalid-comment"></div>`;
      // create the post div
      newPost += '<div class="new-city">' +
       `<div class="header-post">
       <h4 class="city"> ${object.city}, ${object.country}</h4><div class="icons">${pin} ${trash}</div></div>` +
       `<div class="data-api"><span class="temp"> ${object.temp.celsius} &#8451 / ${object.temp.fahrenheit} &#8457</span> at ${object.time.hour} on ${object.time.date} <img src="http://openweathermap.org/img/w/${object.icon}.png">
       <span class="temp">${object.description}</span>
       </div> ${commentDiv} ${commentForm}</div></div>`;
    }
    $('.posts').append(newPost);

  };

  //remove item from cities cart
  var removePost = function (index) {
    for (let i = 0; i < cities.length; i++) {
      if (i === index) {
        cities.splice(index, 1);
      }
    }
    _saveToLocalStorage();
  };

  // add comment to the array
  var addComment = function (comment, post) {
    for (let i = 0; i < cities.length; i++) {
      if (i === post.index()) {
        cities[i].comments.push(comment);
        _updateComment(post, i);
      }
    }
    // update local storage
    _saveToLocalStorage();
  };

  // get data from the weather api
  var fetch = function (urlCity) {
    $.get(urlCity).then(function (data) {
      console.log(data);
      _addPost(data);
      updatePosts();
      _renderAllComments();
    }).catch(function (error) {
      $('.invalid-city').text('No city was found, try another search').show().fadeOut(5000);
      console.log(error);
    });
  };

  // sorting the cities on the page
  var sortPage = function(sortChoice) {
  // check what option of sorting was selected
    cities = (sortChoice == 1) ? cities.sort(_sortByCity) : (sortChoice == 2 ? cities.sort(_sortByTemp) : cities.sort(_sortByDate));
    updatePosts();
  };

  // update the array as soon as the page loads
  cities = _getFromLocalStorage();
  updatePosts();
  _renderAllComments();

  return {
    fetch: fetch,
    removePost: removePost,
    addComment: addComment,
    sortPage: sortPage
  };
};

var app = weatherApp();

/****EVENT-LISTENERS****/

// click get-temp in city from the api
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
$('.posts').on('click', '.remove-item', function () {
  var $post = $(this).closest('.new-city');
  var index = $post.index();
  // remove from the cities array
  app.removePost(index);
  // remove from the page
  $post.remove();
});

// Click on add comment
$('.posts').on('click keypress', '.add-comment', function (e) {
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

$('select').change(function() {
  var sortBy = $(this).find('option:selected').val();
  app.sortPage(sortBy);
  console.log(sortBy);
});



// Event for showing the loading image when waiting for ajax response
$(document).ajaxSend(function () {
  $('#ajax-loader').show();
});

$(document).ajaxComplete(function () {
  $('#ajax-loader').hide();
});