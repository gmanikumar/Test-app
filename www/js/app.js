/*! 
 * Roots v 2.0.0
 * Follow me @adanarchila at Codecanyon.net
 * URL: http://codecanyon.net/item/roots-phonegapcordova-multipurpose-hybrid-app/9525999
 * Don't forget to rate Roots if you like it! :)
 */

// In this file we are goint to include all the Controllers our app it's going to need

(function(){
  'use strict';
  
  function initPushwoosh() {
      
      var pushNotification = cordova.require("com.pushwoosh.plugins.pushwoosh.PushNotification");
 
    //set push notification callback before we initialize the plugin
    document.addEventListener('push-notification', function(event) {
                                //get the notification payload
                                var notification = event.notification;
 
                                //display alert to the user for example
                                alert(notification.aps.alert);
                               
                                //clear the app badge
                                pushNotification.setApplicationIconBadgeNumber(0);
                                
                                var title = event.notification.title;
                                var userData = event.notification.userdata;
                                 
                                if(typeof(userData) != "undefined") {
                                console.warn('user data: ' + JSON.stringify(userData));
                                }
                                alert(title);
                            });
 
    //initialize the plugin
    pushNotification.onDeviceReady({ projectid: "1031348927230", pw_appid : "5B489-8041F" });
     
    //register for pushes
    pushNotification.registerDevice(
        function(status) {
            var deviceToken = status['deviceToken'];
            console.warn('registerDevice: ' + deviceToken);
            var pushToken = status;
            console.warn('push token: ' + pushToken);
        },
        function(status) {
            console.warn('failed to register : ' + JSON.stringify('failed to register ', status));
            alert(JSON.stringify(['failed to register ', status]));
        }
    );
     
    //reset badges on app start
    pushNotification.setApplicationIconBadgeNumber(0);

  }
  
  var app = angular.module('app', ['onsen', 'angular-images-loaded', 'ngMap', 'angular-carousel', 'ngAnimate', 'ngAria', 'ngMaterial', 'ngMessages', 'ui.router', 'ngSanitize']);
  // Filter to convert HTML content to string by removing all HTML tags
  app.filter('htmlToPlaintext', function() {
      return function(text) {
        return String(text).replace(/<[^>]+>/gm, '');
      }
    }
  );
  
  app.run(function() {
  ons.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleLightContent();
    }

    initPushwoosh();
  });
});

  app.directive('datePicker', function () {
      return {
          link: function postLink(scope, element, attrs) {
              scope.$watch(attrs.datePicker, function () {
                  if (attrs.datePicker === 'start') {
                      //element.pickadate();
                  }
              });
          }
      };
  });  

  app.controller('networkController', function($scope){

    // Check if is Offline
    document.addEventListener("offline", function(){

      offlineMessage.show();

      /* 
       * With this line of code you can hide the modal in 8 seconds but the user will be able to use your app
       * If you want to block the use of the app till the user gets internet again, please delete this line.       
       */

      setTimeout('offlineMessage.hide()', 8000);  

    }, false);

    document.addEventListener("online", function(){
      // If you remove the "setTimeout('offlineMessage.hide()', 8000);" you must remove the comment for the line above      
      // offlineMessage.hide();
    });

  });


  // This functions will help us save the JSON in the localStorage to read the website content offline

  Storage.prototype.setObject = function(key, value) {
      this.setItem(key, JSON.stringify(value));
  }

  Storage.prototype.getObject = function(key) {
      var value = this.getItem(key);
      return value && JSON.parse(value);
  }

  // This directive will allow us to cache all the images that have the img-cache attribute in the <img> tag
  app.directive('imgCache', ['$document', function ($document) {
    return {
      link: function (scope, ele, attrs) {
        var target = $(ele);

        scope.$on('ImgCacheReady', function () {

          ImgCache.isCached(attrs.src, function(path, success){
            if(success){
              ImgCache.useCachedFile(target);
            } else {
              ImgCache.cacheFile(attrs.src, function(){
                ImgCache.useCachedFile(target);
              });
            }
          });
        }, false);

      }
    };
  }]);    

  // News Controller / Show Latest Posts
  // This controller gets all the posts from our WordPress site and inserts them into a variable called $scope.items
  app.controller('newsController', [ '$http', '$scope', '$rootScope', function($http, $scope, $rootScope){

    $scope.yourAPI = 'http://dev.studio31.co/api/get_recent_posts';
    $scope.items = [];
    $scope.totalPages = 0;
    $scope.currentPage = 1;
    $scope.pageNumber = 1;
    $scope.isFetching = true;
    $scope.lastSavedPage = 0;

    // Let's initiate this on the first Controller that will be executed.
    ons.ready(function() {
      
      // Cache Images Setup
      // Set the debug to false before deploying your app
      ImgCache.options.debug = true;

      ImgCache.init(function(){

        //console.log('ImgCache init: success!');
        $rootScope.$broadcast('ImgCacheReady');
        // from within this function you're now able to call other ImgCache methods
        // or you can wait for the ImgCacheReady event

      }, function(){
        //console.log('ImgCache init: error! Check the log for errors');
      });

    });


    $scope.pullContent = function(){
      
      $http.jsonp($scope.yourAPI+'/?page='+$scope.pageNumber+'&callback=JSON_CALLBACK').success(function(response) {

        if($scope.pageNumber > response.pages){

          // hide the more news button
          $('#moreButton').fadeOut('fast');  

        } else {

          $scope.items = $scope.items.concat(response.posts);
          window.localStorage.setObject('rootsPosts', $scope.items); // we save the posts in localStorage
          window.localStorage.setItem('rootsDate', new Date());
          window.localStorage.setItem("rootsLastPage", $scope.currentPage);
          window.localStorage.setItem("rootsTotalPages", response.pages);

          // For dev purposes you can remove the comment for the line below to check on the console the size of your JSON in local Storage
          // for(var x in localStorage)console.log(x+"="+((localStorage[x].length * 2)/1024/1024).toFixed(2)+" MB");

          $scope.totalPages = response.pages;
          $scope.isFetching = false;

          if($scope.pageNumber == response.pages){

            // hide the more news button
            $('#moreButton').fadeOut('fast'); 

          }

        }

      });

    }

    $scope.getAllRecords = function(pageNumber){

      $scope.isFetching = true;    

      if (window.localStorage.getItem("rootsLastPage") == null ) {

        $scope.pullContent();

      } else {
        
        var now = new Date();
        var saved = new Date(window.localStorage.getItem("rootsDate"));

        var difference = Math.abs( now.getTime() - saved.getTime() ) / 3600000;

        // Lets compare the current dateTime with the one we saved when we got the posts.
        // If the difference between the dates is more than 24 hours I think is time to get fresh content
        // You can change the 24 to something shorter or longer

        if(difference > 24){
          // Let's reset everything and get new content from the site.
          $scope.currentPage = 1;
          $scope.pageNumber = 1;
          $scope.lastSavedPage = 0;
          window.localStorage.removeItem("rootsLastPage");
          window.localStorage.removeItem("rootsPosts");
          window.localStorage.removeItem("rootsTotalPages");
          window.localStorage.removeItem("rootsDate");

          $scope.pullContent();
        
        } else {
          
          $scope.lastSavedPage = window.localStorage.getItem("rootsLastPage");

          // If the page we want is greater than the last saved page, we need to pull content from the web
          if($scope.currentPage > $scope.lastSavedPage){

            $scope.pullContent();
          
          // else if the page we want is lower than the last saved page, we have it on local Storage, so just show it.
          } else {

            $scope.items = window.localStorage.getObject('rootsPosts');
            $scope.currentPage = $scope.lastSavedPage;
            $scope.totalPages = window.localStorage.getItem("rootsTotalPages");
            $scope.isFetching = false;

          }

        }

      }

    };

    $scope.imgLoadedEvents = {
        done: function(instance) {
            angular.element(instance.elements[0]).removeClass('is-loading').addClass('is-loaded');
        }
    };

    $scope.showPost = function(index){
        
      $rootScope.postContent = $scope.items[index];
      $scope.ons.navigator.pushPage('post.html');

    };

    $scope.nextPage = function(){

      $scope.currentPage++; 
      $scope.pageNumber = $scope.currentPage;                 
      $scope.getAllRecords($scope.pageNumber);        

    }

  }]);

  // This controller let us print the Post Content in the post.html template
  app.controller('postController', [ '$scope', '$rootScope', '$sce', function($scope, $rootScope, $sce){
    
    $scope.item = $rootScope.postContent;

    $scope.renderHtml = function (htmlCode) {
      return $sce.trustAsHtml(htmlCode);
    };

    $scope.imgLoadedEvents = {
        done: function(instance) {
            angular.element(instance.elements[0]).removeClass('is-loading').addClass('is-loaded');
        }
    };    

  }]);


  app.controller('restaurantController', function($http, $scope, $compile, $sce){
    

    $scope.getHours = function(){

      $scope.isFetching = true;

      $scope.shours1 = '';
      $scope.shours2 = '';
      $scope.shours3 = '';

      $http.jsonp('http://signsrestaurant.ca/api/get_posts/?post_type=restaurant&posts_per_page=-1&callback=JSON_CALLBACK').success(function(response) {

        // Get's the first restaurant
        
        $scope.restaurantJson = response.posts[0];
        $scope.isFetching = false;
        console.log( $scope.restaurantJson.custom_fields.shours1[0] );
        

        $scope.shours1 = $scope.restaurantJson.custom_fields.shours1[0];
        $scope.shours2 = $scope.restaurantJson.custom_fields.shours2[0];
        $scope.shours3 = $scope.restaurantJson.custom_fields.shours3[0];                                       
        
        
      });
     
    }

  });

  // Map Markers Controller
  var map;

  app.controller('branchesController', function($http, $scope, $compile, $sce){
    
    $scope.getAll = true;
    $scope.locationsType = 'map';
    $scope.centerMap = [43.664639, -79.384649]; // Start Position
    $scope.API = 'http://signsrestaurant.ca/api/get_posts/?post_type=restaurant&posts_per_page=-1';
    $scope.isFetching = true;
    $scope.locations = [];
    $scope.userLat = 0;
    $scope.userLng = 0;
    $scope.closestLocations = [];
    $scope.minDistance = 2000; // Km
    $scope.markers = [];
    $scope.infoWindow = {
      id: '',
      title: '',
      content: '',
      address: '',
      hours: '',
      phone: '',
      distance: ''
    };

    // true is to show ALL locations, false to show ONLY closests locations
    $scope.start = function(value, locationType){
        $scope.getAll = value;
        $scope.locationsType = locationType;
        
        if(locationType=='list'){
          $scope.init();
        }
    }

    $scope.$on('mapInitialized', function(event, evtMap) {
      map = evtMap;
      $scope.init();
      });

      $scope.init = function(){           

      navigator.geolocation.getCurrentPosition(function(position){
        $scope.drawMyLocation( position.coords.latitude, position.coords.longitude );
        $scope.userLat = position.coords.latitude;
        $scope.userLng = position.coords.longitude;
      }, function(error){
        console.log("Couldn't get the location of the user.");
        console.log(error);
      }, {
        maximumAge:60000,
        timeout:10000,
        enableHighAccuracy: true
      });

      }

      $scope.drawMyLocation = function( lat, lng){
        
        $scope.getAllRecords();

        if($scope.locationsType=='map'){
          var pinLayer;
        var swBound = new google.maps.LatLng(lat, lng);
        var neBound = new google.maps.LatLng(lat, lng);
        var bounds = new google.maps.LatLngBounds(swBound, neBound);  
         
        pinLayer = new PinLayer(bounds, map);
      }

      $scope.centerMap = [ lat, lng ];

      }

    $scope.getAllRecords = function(pageNumber){

      $scope.isFetching = true;

          $http.jsonp($scope.API+'&callback=JSON_CALLBACK').success(function(response) {

        $scope.locations = response.posts;
        $scope.isFetching = false;

        if($scope.getAll==true){
          // Get all locations
          $scope.allLocations();
        } else{
          // Get closest locations
          $scope.closestLocation();
        }
        

        });
     
    }

    $scope.allLocations = function(){
      
      $.each($scope.locations, function( index, value ) {

        var distance = Haversine( $scope.locations[ index ].custom_fields.location[0].lat, $scope.locations[ index ].custom_fields.location[0].lng, $scope.userLat, $scope.userLng );

        $scope.markers.push({
          'id'    : index,
          'title'   : $scope.locations[ index ].title,
          'content'   : $scope.locations[ index ].custom_fields.description[0],
          'address' : $scope.locations[ index ].custom_fields.address[0],
          'hours'   : $scope.locations[ index ].custom_fields.hours[0],
          'phone'   : $scope.locations[ index ].custom_fields.phone[0],
          'distance'  : (Math.round(distance * 100) / 100),
          'location'  : [$scope.locations[ index ].custom_fields.location[0].lat, $scope.locations[ index ].custom_fields.location[0].lng]
        });

      });

    }

    $scope.closestLocation = function(){    

      for(var i = 0; i < $scope.locations.length; i++){

        // Get lat and lon from each item
        var locationLat = $scope.locations[ i ].custom_fields.location[0].lat;
        var locationLng = $scope.locations[ i ].custom_fields.location[0].lng;

        // get the distance between user's location and this point
              var dist = Haversine( locationLat, locationLng, $scope.userLat, $scope.userLng );

              if ( dist < $scope.minDistance ){
                  $scope.closestLocations.push(i);
              }

      }

      $.each($scope.closestLocations, function( index, value ) {

        var distance = Haversine( $scope.locations[ value ].custom_fields.location[0].lat, $scope.locations[ value ].custom_fields.location[0].lng, $scope.userLat, $scope.userLng );

        $scope.markers.push({
          'id'    : index,
          'title'   : $scope.locations[ value ].title,
          'content'   : $scope.locations[ value ].custom_fields.description[0],
          'address' : $scope.locations[ value ].custom_fields.address[0],
          'hours'   : $scope.locations[ value ].custom_fields.hours[0],
          'phone'   : $scope.locations[ value ].custom_fields.phone[0],
          'distance'  : (Math.round(distance * 100) / 100),
          'location'  : [$scope.locations[ value ].custom_fields.location[0].lat, $scope.locations[ value ].custom_fields.location[0].lng]
        });

      });

    }

      $scope.showMarker = function(event){

      $scope.marker = $scope.markers[this.id];
        $scope.infoWindow = {
          id    : $scope.marker.id,
        title   : $scope.marker.title,
        content : $scope.marker.content,
        address : $scope.marker.address,
        hours : $scope.marker.hours,
        phone : $scope.marker.phone,
        distance: $scope.marker.distance
      };
      $scope.$apply();
      $scope.showInfoWindow(event, 'marker-info', this.getPosition());

      }

      $scope.renderHtml = function (htmlCode) {
          return $sce.trustAsHtml(htmlCode);
      }

      // Get Directions
    $(document).on('click', '.get-directions', function(e){
      e.preventDefault();

      var marker = $scope.markers[$(this).attr('data-marker')];

      // Apple
      window.location.href = 'maps://maps.apple.com/?q='+marker.location[0]+','+marker.location[1];
          
      // Google Maps (Android)
      var ref = window.open('http://maps.google.com/maps?q='+marker.location[0]+','+marker.location[1], '_system', 'location=yes');

    });
          
      // Call
    $(document).on('click', '.call-phone', function(e){

      e.preventDefault();

      var phone = $(this).attr('data-phone');
      phone = phone.replace(/\D+/g, "");

      window.open('tel:'+phone, '_system')

    });

  });

app.controller('bookingController', function($scope, $compile, $filter){

    $scope.bookdate = 'Pick Reservation Date';
    $scope.booktime = 'Pick Reservation Time';

    $scope.chooseDate = function(){
        
        var options = {
          date: new Date(),
          mode: 'date'
        };

        datePicker.show(options, function(date){
            
            var day     = date.getDate();
            var month     = date.getMonth() + 1;
            var year     = date.getFullYear();

            $scope.$apply(function(){
                $scope.bookdate = $filter('date')(date, 'MMMM d, yyyy');      
            });

        });

    }

    $scope.chooseTime = function(){
        
        var options = {
          date: new Date(),
          mode: 'time'
        };

        datePicker.show(options, function(time){
              $scope.$apply(function(){
                $scope.booktime = $filter('date')(time, 'hh:mm a');
            });
        });

    }


$scope.openEmail = function(){
        
        ons.ready(function() {
          console.log('opening email');
            window.plugin.email.open({
                to:      ['management@signsrestaurant.ca'],
                cc: [''],
                bcc: [''],
                attachments: [''],
                subject: 'Reservation',
                body:    'Name: '+$scope.fullname+'<br>Phone: '+$scope.phone+'<br>Email: '+$scope.email+'<br>Date: '+$scope.bookdate+'<br>Time: '+$scope.booktime+' <br>Message: '+$scope.message,
                isHtml:  true
            });
        });        

    }
        

});

  // Plugins Controller

  app.controller('pluginsController', function($scope, $compile){

    $scope.openWebsite = function(){
      var ref = window.open('http://signsrestaurant.ca/signs-store/', '_blank', 'location=yes');
    }

    $scope.openSocialSharing = function(){
      
      window.plugins.socialsharing.share('Message, image and link', null, 'https://www.google.com/images/srpr/logo4w.png', 'http://www.google.com');

      /*
       *  Social Sharing Examples
       *  For more examples check the documentation: https://github.com/EddyVerbruggen/SocialSharing-PhoneGap-Plugin
   
        window.plugins.socialsharing.share('Message only')
        window.plugins.socialsharing.share('Message and subject', 'The subject')
        window.plugins.socialsharing.share(null, null, null, 'http://www.google.com')
        window.plugins.socialsharing.share('Message and link', null, null, 'http://www.google.com')
        window.plugins.socialsharing.share(null, null, 'https://www.google.com/images/srpr/logo4w.png', null)
        window.plugins.socialsharing.share('Message and image', null, 'https://www.google.com/images/srpr/logo4w.png', null)
        window.plugins.socialsharing.share('Message, image and link', null, 'https://www.google.com/images/srpr/logo4w.png', 'http://www.google.com')
        window.plugins.socialsharing.share('Message, subject, image and link', 'The subject', 'https://www.google.com/images/srpr/logo4w.png', 'http://www.google.com')
      *
      */

    }


    $scope.openEmailClient = function(){

      ons.ready(function(){

        cordova.plugins.email.open({
          to:      'han@solo.com',
          subject: 'Hey!',
          body:    'May the <strong>force</strong> be with you',
          isHtml:  true
        });

      });
      
    }

    $scope.getDate = function(){
      
      var options = {
        date: new Date(),
        mode: 'date'
      };

      datePicker.show(options, function(date){
        alert("date result " + date);  
      });

    }

  });
  
    // Plugins Controller

  app.controller('pluginsController2', function($scope, $compile){

    $scope.openWebsite = function(){
      var ref = window.open('http://signsrestaurant.ca/my-account/', '_blank', 'location=yes');
    }

    $scope.openSocialSharing = function(){
      
      window.plugins.socialsharing.share('Message, image and link', null, 'https://www.google.com/images/srpr/logo4w.png', 'http://www.google.com');

      /*
       *  Social Sharing Examples
       *  For more examples check the documentation: https://github.com/EddyVerbruggen/SocialSharing-PhoneGap-Plugin
   
        window.plugins.socialsharing.share('Message only')
        window.plugins.socialsharing.share('Message and subject', 'The subject')
        window.plugins.socialsharing.share(null, null, null, 'http://www.google.com')
        window.plugins.socialsharing.share('Message and link', null, null, 'http://www.google.com')
        window.plugins.socialsharing.share(null, null, 'https://www.google.com/images/srpr/logo4w.png', null)
        window.plugins.socialsharing.share('Message and image', null, 'https://www.google.com/images/srpr/logo4w.png', null)
        window.plugins.socialsharing.share('Message, image and link', null, 'https://www.google.com/images/srpr/logo4w.png', 'http://www.google.com')
        window.plugins.socialsharing.share('Message, subject, image and link', 'The subject', 'https://www.google.com/images/srpr/logo4w.png', 'http://www.google.com')
      *
      */

    }


    $scope.openEmailClient = function(){

      ons.ready(function(){

        cordova.plugins.email.open({
          to:      'han@solo.com',
          subject: 'Hey!',
          body:    'May the <strong>force</strong> be with you',
          isHtml:  true
        });

      });
      
    }

    $scope.getDate = function(){
      
      var options = {
        date: new Date(),
        mode: 'date'
      };

      datePicker.show(options, function(date){
        alert("date result " + date);  
      });

    }

  });
  
    // Plugins Controller

  app.controller('pluginsController3', function($scope, $compile){

    $scope.openWebsite = function(){
      var ref = window.open('http://signsrestaurant.ca/cart/', '_blank', 'location=yes');
    }

    $scope.openSocialSharing = function(){
      
      window.plugins.socialsharing.share('Message, image and link', null, 'https://www.google.com/images/srpr/logo4w.png', 'http://www.google.com');

      /*
       *  Social Sharing Examples
       *  For more examples check the documentation: https://github.com/EddyVerbruggen/SocialSharing-PhoneGap-Plugin
   
        window.plugins.socialsharing.share('Message only')
        window.plugins.socialsharing.share('Message and subject', 'The subject')
        window.plugins.socialsharing.share(null, null, null, 'http://www.google.com')
        window.plugins.socialsharing.share('Message and link', null, null, 'http://www.google.com')
        window.plugins.socialsharing.share(null, null, 'https://www.google.com/images/srpr/logo4w.png', null)
        window.plugins.socialsharing.share('Message and image', null, 'https://www.google.com/images/srpr/logo4w.png', null)
        window.plugins.socialsharing.share('Message, image and link', null, 'https://www.google.com/images/srpr/logo4w.png', 'http://www.google.com')
        window.plugins.socialsharing.share('Message, subject, image and link', 'The subject', 'https://www.google.com/images/srpr/logo4w.png', 'http://www.google.com')
      *
      */

    }


    $scope.openEmailClient = function(){

      ons.ready(function(){

        cordova.plugins.email.open({
          to:      'han@solo.com',
          subject: 'Hey!',
          body:    'May the <strong>force</strong> be with you',
          isHtml:  true
        });

      });
      
    }

    $scope.getDate = function(){
      
      var options = {
        date: new Date(),
        mode: 'date'
      };

      datePicker.show(options, function(date){
        alert("date result " + date);  
      });

    }

  });
  
  
  
    // We create a new X2JS object, it will let us convert the XML to JSON
  var x2js = new X2JS();

  // XML Feed Controller
  app.controller('xmlFeedController', [ '$http', '$scope', '$rootScope', function($http, $scope, $rootScope){
   
    $scope.feedURL = 'http://paid.feed43.com/3274851365587308.xml';

    $scope.json ='';

    $scope.items = [];

    $http.get($scope.feedURL).success(function(response) {

      // We got the response in XML and we convert it to JSON
      $scope.json = x2js.xml_str2json( response );
      $scope.items = $scope.json.rss.channel.item;

    }).error(function(data, status, headers, config) {
      // called asynchronously if an error occurs
      // or server returns response with an error status.
      console.log(data);
    });

    $scope.openLink = function(index){
      // We are going to open the link in the system browser
      window.open($scope.items[index].link, '_system');
    };

  }]);
  
  app.controller('linksController', ['$scope', '$rootScope', function($scope, $rootScope){

    $scope.openSite = function(){
      ons.ready(function(){
        var ref = window.open('http://www.tripadvisor.ca/Restaurant_Review-g155019-d6954234-Reviews-Signs_Restaurant-Toronto_Ontario.html#REVIEWS', '_blank');
      });
    };

    $scope.openSiteNoLocation = function(){
      ons.ready(function(){
        var ref = window.open('http://www.tripadvisor.ca/Restaurant_Review-g155019-d6954234-Reviews-Signs_Restaurant-Toronto_Ontario.html#REVIEWS', '_blank', 'location=no');
      });
    };

    $scope.openSiteSystem = function(){
      ons.ready(function(){
        var ref = window.open('http://www.tripadvisor.ca/Restaurant_Review-g155019-d6954234-Reviews-Signs_Restaurant-Toronto_Ontario.html#REVIEWS', '_system');
      });
    };

  }]);
 
app.config(function($stateProvider, $urlRouterProvider){
      
      $urlRouterProvider.otherwise("/menu")
      
      $stateProvider
        .state('menu', {
            url: "/menu",
            templateUrl: "templates/menu.html",
            controller: "MenuController"
        })
          
        .state('options', {
            url: "/options",
            templateUrl: "templates/options.html",
            controller: "OptionsController"
        })
      
        .state('order', {
            url: "/order",
            templateUrl: "templates/order.html",
            controller: "OrderController"
        })
      
});

app.factory('PaypalService', ['$q', '$filter', '$timeout', function ($q, $filter, $timeout) {



        var init_defer;
        /**
         * Service object
         * @type object
         */
        var service = {
            initPaymentUI: initPaymentUI,
            createPayment: createPayment,
            configuration: configuration,
            onPayPalMobileInit: onPayPalMobileInit,
            makePayment: makePayment
        };


        /**
         * @ngdoc method
         * @name initPaymentUI
         * @methodOf app.PaypalService
         * @description
         * Inits the payapl ui with certain envs. 
         *
         * 
         * @returns {object} Promise paypal ui init done
         */
        function initPaymentUI() {

            init_defer = $q.defer();
            ons.ready(function() {

                var clientIDs = {
                    "PayPalEnvironmentProduction": "ATuDotshe1LHYLX_6zCyORY-PQFCng1Ds1oB3IJuzuPpsW8GALDSzco2N6znsrSFRqKuKye-9K2qYap5",
                    "PayPalEnvironmentSandbox": "Afyjkjnv8kuaVasUm2A9KaWPvnGBFsXvZwzLVKkBV6dH5apoBbd3wh8PcUUxFJoCQlHBA_7bjIvDf1sf"
                };
                PayPalMobile.init(clientIDs, onPayPalMobileInit);
            });

            return init_defer.promise;

        }


        /**
         * @ngdoc method
         * @name createPayment
         * @methodOf app.PaypalService
         * @param {string|number} total total sum. Pattern 12.23
         * @param {string} name name of the item in paypal
         * @description
         * Creates a paypal payment object 
         *
         * 
         * @returns {object} PayPalPaymentObject
         */
        function createPayment(total, name) {
                
            // "Sale  == >  immediate payment
            // "Auth" for payment authorization only, to be captured separately at a later time.
            // "Order" for taking an order, with authorization and capture to be done separately at a later time.
            var payment = new PayPalPayment("" + total, "CAD", "" + name, "Sale");
            return payment;
        }
        /**
         * @ngdoc method
         * @name configuration
         * @methodOf app.PaypalService
         * @description
         * Helper to create a paypal configuration object
         *
         * 
         * @returns {object} PayPal configuration
         */
        function configuration() {
            // for more options see `paypal-mobile-js-helper.js`
            var config = new PayPalConfiguration({merchantName: "SIGNS Store", merchantPrivacyPolicyURL: "https://mytestshop.com/policy", merchantUserAgreementURL: "https://mytestshop.com/agreement"});
            return config;
        }

        function onPayPalMobileInit() {
            ons.ready(function() {
                // must be called
                // use PayPalEnvironmentNoNetwork mode to get look and feel of the flow
                PayPalMobile.prepareToRender("PayPalEnvironmentSandbox", configuration(), function () {

                    $timeout(function () {
                        init_defer.resolve();
                    });

                });
            });
        }
        
        /**
         * @ngdoc method
         * @name makePayment
         * @methodOf app.PaypalService
         * @param {string|number} total total sum. Pattern 12.23
         * @param {string} name name of the item in paypal
         * @description
         * Performs a paypal single payment 
         *
         * 
         * @returns {object} Promise gets resolved on successful payment, rejected on error 
         */
        function makePayment(total, name) {


            var defer = $q.defer();
            total = $filter('number')(total, 2);
            ons.ready(function() {
                PayPalMobile.renderSinglePaymentUI(createPayment(total, name), function (result) {
                    $timeout(function () {
                        defer.resolve(result);
                    });
                }, function (error) {
                    $timeout(function () {
                        defer.reject(error);
                    });
                });
            });

            return defer.promise;
        }

        return service;
    }]);

//Change theme below. 
/*
app.config(function($mdThemingProvider) {
  $mdThemingProvider.theme('default')
    .primaryPalette('blue-grey')
    .accentPalette('indigo');
});
*/ 
  
  app.factory('ParseData', function($http) {
    var ParseFactory = {};

    ParseFactory.getItems = function() {

    return $http({method : 'GET',url : 'https://api.parse.com/1/classes/Menu/', headers: 
      { 'X-Parse-Application-Id':'CHKtazGT7CLRnK6n5jYAIwRF9le38wNQPm2c4muM',
        'X-Parse-REST-API-Key':'PdhNAZoMh6YpFcmXoq184D5HEw8UHf7dQMMHuLLV'}})
        .then(function(response) {
            return response.data;
        });
    };
    
    ParseFactory.getOptions = function() {

    return $http({method : 'GET',url : 'https://api.parse.com/1/classes/Options/', headers: 
      { 'X-Parse-Application-Id':'CHKtazGT7CLRnK6n5jYAIwRF9le38wNQPm2c4muM',
        'X-Parse-REST-API-Key':'PdhNAZoMh6YpFcmXoq184D5HEw8UHf7dQMMHuLLV'}})
        .then(function(response) {
            return response.data;
        });
    };
    
    ParseFactory.getApps = function() {

    return $http({method : 'GET',url : 'https://api.parse.com/1/classes/Apps/', headers: 
      { 'X-Parse-Application-Id':'CHKtazGT7CLRnK6n5jYAIwRF9le38wNQPm2c4muM',
        'X-Parse-REST-API-Key':'PdhNAZoMh6YpFcmXoq184D5HEw8UHf7dQMMHuLLV'}})
        .then(function(response) {
            return response.data;
        });
    };
    
    ParseFactory.getSalads = function() {

    return $http({method : 'GET',url : 'https://api.parse.com/1/classes/Salads/', headers: 
      { 'X-Parse-Application-Id':'CHKtazGT7CLRnK6n5jYAIwRF9le38wNQPm2c4muM',
        'X-Parse-REST-API-Key':'PdhNAZoMh6YpFcmXoq184D5HEw8UHf7dQMMHuLLV'}})
        .then(function(response) {
            return response.data;
        });
    };
    
    ParseFactory.getPoutines = function() {

    return $http({method : 'GET',url : 'https://api.parse.com/1/classes/Poutines/', headers: 
      { 'X-Parse-Application-Id':'CHKtazGT7CLRnK6n5jYAIwRF9le38wNQPm2c4muM',
        'X-Parse-REST-API-Key':'PdhNAZoMh6YpFcmXoq184D5HEw8UHf7dQMMHuLLV'}})
        .then(function(response) {
            return response.data;
        });
    };
    
    ParseFactory.getSandwiches = function() {

    return $http({method : 'GET',url : 'https://api.parse.com/1/classes/Sandwiches/', headers: 
      { 'X-Parse-Application-Id':'CHKtazGT7CLRnK6n5jYAIwRF9le38wNQPm2c4muM',
        'X-Parse-REST-API-Key':'PdhNAZoMh6YpFcmXoq184D5HEw8UHf7dQMMHuLLV'}})
        .then(function(response) {
            return response.data;
        });
    };
    
    ParseFactory.getMains = function() {

    return $http({method : 'GET',url : 'https://api.parse.com/1/classes/Mains/', headers: 
      { 'X-Parse-Application-Id':'CHKtazGT7CLRnK6n5jYAIwRF9le38wNQPm2c4muM',
        'X-Parse-REST-API-Key':'PdhNAZoMh6YpFcmXoq184D5HEw8UHf7dQMMHuLLV'}})
        .then(function(response) {
            return response.data;
        });
    };
    
    ParseFactory.getDesserts = function() {

    return $http({method : 'GET',url : 'https://api.parse.com/1/classes/Desserts/', headers: 
      { 'X-Parse-Application-Id':'CHKtazGT7CLRnK6n5jYAIwRF9le38wNQPm2c4muM',
        'X-Parse-REST-API-Key':'PdhNAZoMh6YpFcmXoq184D5HEw8UHf7dQMMHuLLV'}})
        .then(function(response) {
            return response.data;
        });
    };
    
    ParseFactory.getPromos = function() {

    return $http({method : 'GET',url : 'https://api.parse.com/1/classes/Promos/', headers: 
      { 'X-Parse-Application-Id':'CHKtazGT7CLRnK6n5jYAIwRF9le38wNQPm2c4muM',
        'X-Parse-REST-API-Key':'PdhNAZoMh6YpFcmXoq184D5HEw8UHf7dQMMHuLLV'}})
        .then(function(response) {
            return response.data;
        });
    };
    
    return ParseFactory;
    
});

app.factory('OrderFunctions', function() {
    var OrderFactory = {};

    OrderFactory.toggleActive = function(item){
        item.active = !item.active;
        //item.qty = 1;
    };
    
    OrderFactory.add = function(item){
        if (item.active){
            item.qty+= 1;
        }
    };
    
    OrderFactory.minus = function(item){
        if (item.qty != 1){
            item.qty-= 1;
        }
    };
    
    OrderFactory.total = function(items) {

        var itemTotal = 0;

        angular.forEach(items, function(item) {
          var sizeTotal = 0;
          var sizeTotal2 = 0;
          var sizeTotal3 = 0;
          var sizeTotal4 = 0;
          var sizeTotal5 = 0;
          if (item && item.active) {
            itemTotal += item.qty * item.price;
            angular.forEach(item.sizes, function(option) {
              if (option && option.active) {
                sizeTotal += option.price;
              }
              if (option && option.active2) {
                sizeTotal2 += option.price;
              }
              if (option && option.active3) {
                sizeTotal3 += option.price;
              }
              if (option && option.active4) {
                sizeTotal4 += option.price;
              }
              if (option && option.active5) {
                sizeTotal5 += option.price;
              }
            });
            itemTotal += sizeTotal + sizeTotal2 + sizeTotal3 + sizeTotal4 + sizeTotal5;
          }
        });

        return itemTotal;

      };
      
      OrderFactory.addon = function(items) {

        var itemAddon = 0;

        angular.forEach(items, function(item) {
          var sizeAddon = 0;
          var sizeAddon2 = 0;
          var sizeAddon3 = 0;
          var sizeAddon4 = 0;
          var sizeAddon5 = 0;
          if (item && item.active) {
            itemAddon += 0;
            angular.forEach(item.sizes, function(option) {
              if (option && option.active) {
                sizeAddon += option.price;
              }
              if (option && option.active2) {
                sizeAddon2 += option.price;
              }
              if (option && option.active3) {
                sizeAddon3 += option.price;
              }
              if (option && option.active4) {
                sizeAddon4 += option.price;
              }
              if (option && option.active5) {
                sizeAddon5 += option.price;
              }
            });
            itemAddon += sizeAddon + sizeAddon2 + sizeAddon3 + sizeAddon4 + sizeAddon5;
          }
        });

        return itemAddon;

      };
      
      OrderFactory.addonamt = function(items) {

        var itemAddonamt = 0;

        angular.forEach(items, function(item) {
          var sizeAddonamt = 0;
          var sizeAddonamt2 = 0;
          var sizeAddonamt3 = 0;
          var sizeAddonamt4 = 0;
          var sizeAddonamt5 = 0;
          if (item && item.active) {
            itemAddonamt += 0;
            angular.forEach(item.sizes, function(option) {
              if (option && option.active) {
                sizeAddonamt += 1;
              }
              if (option && option.active2) {
                sizeAddonamt2 += 1;
              }
              if (option && option.active3) {
                sizeAddonamt3 += 1;
              }
              if (option && option.active4) {
                sizeAddonamt4 += 1;
              }
              if (option && option.active5) {
                sizeAddonamt5 += 1;
              }
            });
            itemAddonamt += sizeAddonamt + sizeAddonamt2 + sizeAddonamt3 + sizeAddonamt4 + sizeAddonamt5;
          }
        });

        return itemAddonamt;

      };
    
    OrderFactory.clearOrder = function(item){
    
        angular.forEach(item, function(item){
            if (item.active){
                item.active = false;
                item.qty = 1;
            }
        });
    
    };
    
OrderFactory.totalOrder = function(items) {

        var totalOrder = " ";
        var menusizeTotal = " ";

        angular.forEach(items, function(item) {
          var sizeTotal = " ";
          var sizeTotal2 = " ";
          var sizeTotal3 = " ";
          var sizeTotal4 = " ";
          var sizeTotal5 = " ";
          if (item && item.active) {
            totalOrder += item.name + " $" + item.price + ".00 Qty: " + item.qty + ", Modifiers: " + item.modifier + ".<br/>Add-ons: ";
            angular.forEach(item.sizes, function(option) {
              if (option && option.active) {
                sizeTotal += option.name + " for #1, ";
              }
              if (option && option.active2) {
                sizeTotal2 += "#2, ";
              }
              if (option && option.active3) {
                sizeTotal3 += "#3, ";
              }
              if (option && option.active4) {
                sizeTotal4 += "#4, ";
              }
              if (option && option.active5) {
                sizeTotal5 += "#5.";
              }
              menusizeTotal += sizeTotal + sizeTotal2 + sizeTotal3 + sizeTotal4 + sizeTotal5;
            });
            totalOrder += menusizeTotal;
          }
        });

        return totalOrder;

      };
    
    //this function is extra but could come in handy 
    /*
    OrderFactory.checkActive = function(item){
    $scope.show = true; //default to true
    angular.forEach(item, function(item){
        if (item.active){  //only change value if found an active item
            $scope.show = false;
            break;
        } 
    });
};
    */
    
    return OrderFactory;
    
});  
app.controller('AppController', function($scope, $mdBottomSheet, ParseData){
  
  $scope.showListBottomSheet = function() {
    $mdBottomSheet.show({
      templateUrl: 'templates/details.html',
      controller: 'BottomSheetController'
    });
  };
  
  
  ParseData.getItems().then(function(data) {
        $scope.items = data;
        }).catch(function() {
        alert('error');
  });
    
  ParseData.getOptions().then(function(data) {
        $scope.options = data;
        }).catch(function() {
        alert('error');
  });
  
  ParseData.getApps().then(function(data) {
        $scope.apps = data;
        }).catch(function() {
        alert('error');
  });
  
    ParseData.getSalads().then(function(data) {
        $scope.salads = data;
        }).catch(function() {
        alert('error');
  });
  
    ParseData.getPoutines().then(function(data) {
        $scope.poutines = data;
        }).catch(function() {
        alert('error');
  });
  
    ParseData.getSandwiches().then(function(data) {
        $scope.sandwiches = data;
        }).catch(function() {
        alert('error');
  });
  
    ParseData.getMains().then(function(data) {
        $scope.mains = data;
        }).catch(function() {
        alert('error');
  });
  
    ParseData.getDesserts().then(function(data) {
        $scope.desserts = data;
        }).catch(function() {
        alert('error');
  });
      ParseData.getPromos().then(function(data) {
        $scope.promos = data;
        }).catch(function() {
        alert('error');
  });
  
      $scope.type = {};
      angular.forEach($scope.items, function(value) {
        $scope.type = value;
      });   
});

app.controller('BottomSheetController', function($scope) {
  
  //Add your social urls to the href tags below
  $scope.items = [
    { name: 'Phone', icon: 'img/icons/phone.svg', href: ''},
    { name: 'Email', icon: 'img/icons/email.svg', href: '' },
    { name: 'Facebook', icon: 'img/icons/post-facebook.svg', href: '' },
    { name: 'Twitter', icon: 'img/icons/post-twitter.svg', href: '' },
  ];
});

app.controller('MenuController', function($scope, OrderFunctions, $mdToast) {

    $scope.toggle = OrderFunctions.toggleActive;
    
    $scope.showAddedToast = function() {
        $mdToast.show({
          position: "top",
          template: "<md-toast style='background-color:#b3bf35;'>Added to your order. Please proceed to 'Order'.</md-toast>"
        });
    };
    $scope.showRemovedToast = function() {
        $mdToast.show({
          position: "top",
          template: "<md-toast style='background-color:#b3bf35;'>Removed from your order.</md-toast>"
        });
    };
    
});

app.controller('OptionsController', function($scope, OrderFunctions, $mdToast) {

    $scope.remove = OrderFunctions.toggleActive;
    $scope.clear = OrderFunctions.clearOrder;
    $scope.showRemovedToast = function() {
        $mdToast.show({
          position: "top",
          template: "<md-toast style='background-color:#b3bf35;'>Removed from your order.</md-toast>"
        });
    };

});

app.controller('OrderController', function($scope, OrderFunctions) {

    $scope.total = OrderFunctions.total;
    $scope.totalOrder = OrderFunctions.totalOrder;
    $scope.addon = OrderFunctions.addon;
    $scope.addonOrder = OrderFunctions.addonOrder;
    $scope.addonamt = OrderFunctions.addonamt;
    $scope.addonamtOrder = OrderFunctions.addonamtOrder;

});

app.controller('EmailController', function($scope, $http, $mdToast, OrderFunctions, PaypalService){
    
  $scope.showSuccessToast = function() {
        $mdToast.show({
          position: "top",
          template: "<md-toast style='background-color:#b3bf35;'>Your order has been sent. Thank you!</md-toast>"
        });
  };
  $scope.showErrorToast = function() {
        $mdToast.show({
          position: "top",
          template: "<md-toast style='background-color:#b3bf35;'>Order not sent. Please check your internet connection.</md-toast>"
        });
  };
      var output = function() {
        var menuorder = '';
        angular.forEach($scope.filtereditem, function(item) {
          var size = " ";
          var size2 = " ";
          var size3 = " ";
          var size4 = " ";
          var size5 = " ";
          angular.forEach(item.sizes, function(option) {
            if (option && option.active) {
              size += option.name + " in #1<br>";
            }
            if (option && option.active2) {
              size2 += option.name + " in #2<br>";
            }
            if (option && option.active3) {
              size3 += option.name + " in #3<br>";
            }
            if (option && option.active4) {
              size4 += option.name + " in #4<br>";
            }
            if (option && option.active5) {
              size5 += option.name + " in #5<br>";
            }
          });
          menuorder += item.name + "<br/>Side: " + item.type + ", Qty: " + item.qty + ", Modifiers: " + item.modifier + "<br/><br/>Add-Ons:<br/>" + size + size2 + size3 + size4 + size5 + "<br/><br/>";
        });
        return menuorder;
      }
      $scope.filteredmenu = output();
      var output = function() {
        var paypalmenuorder = '';
        var paypalmenu = '';
        angular.forEach($scope.filtereditem, function(item) {
          paypalmenu += item.name + ", Qty: " + item.qty + ", ";
        });
        paypalmenuorder += paypalmenu + "Add-Ons: " + $scope.paypaladdon
        return paypalmenuorder;
      }
      $scope.paypalfilteredmenu = output();
      $scope.total = OrderFunctions.total;
      $scope.totalOrder = OrderFunctions.totalOrder;
      $scope.addon = OrderFunctions.addon;
      $scope.addonOrder = OrderFunctions.addonOrder;
      $scope.addonamt = OrderFunctions.addonamt;
      $scope.addonamtOrder = OrderFunctions.addonamtOrder;
      
      $scope.sendMail = function() {
        var mailJSON = {
          "key": "64jQkjjvhN1JI9H666QGbw", //your mandrill key goes here
          "message": {
            "html": "<h1>New Order</h1><p>You have received a new order from:</p><p>Name: *|NAME|*<br>Phone: *|PHONE|*<br>Address: *|ADDRESS|*<br>Email: *|EMAIL|*<br>Special Requests: *|REQUESTS|*</p><p>They would like:</p><p>*|ITEMS|*</p><br><p>Order Total is: *|TOTAL|*</p><br><p>Payment Method: *|PAYMENT|*</p>",
            "merge_vars": [{
              "rcpt": "management@signsrestaurant.ca", //your email addy here
              "vars": [{
                "name": "NAME",
                "content": $scope.name
              }, {
                "name": "PHONE",
                "content": $scope.phone
              }, {
                "name": "ADDRESS",
                "content": $scope.address
              }, {
                "name": "EMAIL",
                "content": $scope.email
              }, {
                "name": "REQUESTS",
                "content": $scope.requests
              }, {
                "name": "ITEMS",
                "content": $scope.filteredmenu
              }, {
                "name": "TOTAL",
                "content": "$"+$scope.pricetotal+".00"
              }, {
                "name": "PAYMENT",
                "content": $scope.payment
              }]
            }],
          "text": "",
          "subject": "New Order Received",// change subject here
          "from_email": $scope.email,//change from email here
          "from_name": $scope.name,//change from name here
          "to": [
            {
              "email": "management@signsrestaurant.ca",//your email here
              "name": "Signs Restaurant",//subject here
              "type": "to"
            }
          ],
          "merge": true,
          "important": false,
          "track_opens": null,
          "track_clicks": null,
          "auto_text": null,
          "auto_html": null,
          "inline_css": null,
          "url_strip_qs": null,
          "preserve_recipients": null,
          "view_content_link": null,
          "tracking_domain": null,
          "signing_domain": null,
          "return_path_domain": null
        },
        "async": false,
        "ip_pool": "Main Pool"
    };
    var apiURL = "https://mandrillapp.com/api/1.0/messages/send.json";
    $http.post(apiURL, mailJSON).
      success(function(data, status, headers, config) {
        $scope.showSuccessToast();
        $scope.form={};//this clears the form after success
        console.log('successful email send.');
        console.log('status: ' + status);
        console.log('data: ' + data);
        console.log('headers: ' + headers);
        console.log('config: ' + config);
      }).error(function(data, status, headers, config) {
        $scope.showErrorToast();
        console.log('error sending email.');
        console.log('status: ' + status);
      });
    //use these to only clear certain fields  
    /*
    $scope.name = "";
    $scope.phone = "";
    $scope.address = "";
    $scope.email = "";
    $scope.clearCart();
    */
    };
    $scope.pay = function() {
         PaypalService.initPaymentUI().then(function () {
                    PaypalService.makePayment($scope.pricetotal, $scope.paypalfilteredmenu).then(function(data){
                        if (data.response.state === "approved")
                        return $scope.sendMail();                        
                    });
 });
    };       
});
app.controller('ContactController', function ($scope, $http) {
    $scope.result = 'hidden'
    $scope.resultMessage;
    $scope.formData; //formData is an object holding the name, email, subject, and message
    $scope.submitButtonDisabled = false;
    $scope.submitted = false; //used so that form errors are shown only after the form has been submitted
    $scope.submit = function(contactform, e) {
        $scope.submitted = true;
        $scope.submitButtonDisabled = true;
        if (contactform.$valid) {
            $http({
                method  : 'POST',
                url     : 'https://signsrestaurant.ca/contact-form.php',
                data    : $.param($scope.formData),  //param method from jQuery
                headers : { 'Content-Type': 'application/x-www-form-urlencoded' }  //set the headers so angular passing info as form data (not request payload)
            }).success(function(data){
                console.log(data);
                if (data.success) { //success comes from the return json object
                    $scope.submitButtonDisabled = true;
                    $scope.resultMessage = data.message;
                    $scope.result='bg-success';
                } else {
                    $scope.submitButtonDisabled = false;
                    $scope.resultMessage = data.message;
                    $scope.result='bg-danger';
                }
            });
        } else {
            $scope.submitButtonDisabled = false;
            $scope.resultMessage = 'Failed.';
            $scope.result='bg-danger';
        }
        e.preventDefault();
        e.stopPropagation();
    }
}); 
})();