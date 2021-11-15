var slider1 = new Swiper(".slider1", {
  loop: true,
  // Enable lazy loading
  lazy: true,
  navigation: {
    nextEl: ".next-hero-slider",
    prevEl: ".previous-hero-slider",
  },
  pagination: {
    el: ".swiper-pagination",
  },
  keyboard: {
    enabled: true,
  },
  breakpoints: {
    0: {
      /* when window >=0px - webflow mobile landscape/portriat */
      slidesPerView: 1,
      centeredSlides: true,
      spaceBetween: 0,
    },
    767: {
      /* when window >= 767px - webflow tablet */ slidesPerView: 1,
      spaceBetween: 20,
    },
    988: {
      /* when window >= 988px - webflow desktop */ slidesPerView: 1,
      centeredSlides: false,
      spaceBetween: 0,
    },
  },
  /* uncomment if you want autoplay slider
      autoplay: {
        delay: 3000,
      },
      */
  scrollbar: {
    el: ".swiper-scrollbar",
    hide: true,
  },
});


var slider2 = new Swiper(".slider2", {
  centeredSlides: true,
  loop: true,
  // Enable lazy loading
  lazy: true,
  keyboard: {
    enabled: true,
  },
  breakpoints: {
    0: {
      /* when window >=0px - webflow mobile landscape/portriat */
      slidesPerView: 1.5,
      centeredSlides: true,
      spaceBetween: 10,
    },
    767: {
      /* when window >= 767px - webflow tablet */
      slidesPerView: 2,
      spaceBetween: 30,
      centeredSlides: true,
    },
    988: {
      /* when window >= 988px - webflow desktop */
      slidesPerView: 4,
      spaceBetween: 35,
      loop: false,
      centeredSlides: false,
    },
  },
  /* uncomment if you want autoplay slider
          autoplay: {
            delay: 3000,
          },
          */
});
if ($(window).width() < 990) {
  var slider_flavors = new Swiper(".slider_flavors", {
    centeredSlides: true,
    loop: true,
    // Enable lazy loading
    lazy: true,
    navigation: {
      nextEl: ".next-flavor",
      prevEl: ".previous-flavor",
    },
    keyboard: {
      enabled: true,
    },
    breakpoints: {
      0: {
        /* when window >=0px - webflow mobile landscape/portriat */
        slidesPerView: 1,
        centeredSlides: true,
        spaceBetween: 0,
      },
      767: {
        /* when window >= 767px - webflow tablet */
        slidesPerView: 2,
        spaceBetween: 30,
        centeredSlides: true,
      },
      988: {
        /* when window >= 988px - webflow desktop */
        slidesPerView: 5,
        spaceBetween: 15,
        loop: true,
        centeredSlides: false,
      },
    },
    on: {
      slideChangeTransitionEnd: function(e) {
        if (this.realIndex == 0) { //original
          document.querySelector(".r_flavors").style.background = "#fff6e7";
          console.log("0");
        } else if (this.realIndex == 4) { //mocha
          document.querySelector(".r_flavors").style.background = "#ffd8b3";
          console.log("1");
        } else if (this.realIndex == 2) { //vanilla
          document.querySelector(".r_flavors").style.background = "#cef6ff";
          console.log("2");
        } else if (this.realIndex == 5) { //decaf
          document.querySelector(".r_flavors").style.background = "#fff6e7";
          console.log("3");
        } else if (this.realIndex == 3) { //caramel
          document.querySelector(".r_flavors").style.background = "#ffedd0";
          console.log("4");
        } else if (this.realIndex == 1) { //pumpkin
          document.querySelector(".r_flavors").style.background = "#ffc7af";
          console.log("5");
        }
      },
    },
    /* uncomment if you want autoplay slider
            autoplay: {
              delay: 3000,
            },
            */
  });
} else {
  console.log("big_screen");
}

var slider_product = new Swiper(".slider_product", {
  loop: false,
  // Enable lazy loading
  lazy: true,
  navigation: {
    nextEl: ".swiper-button-next",
    prevEl: ".swiper-button-prev",
  },

  keyboard: {
    enabled: true,
  },
  breakpoints: {
    0: {
      /* when window >=0px - webflow mobile landscape/portriat */
      slidesPerView: 1.2,
      centeredSlides: false,
      spaceBetween: 10,
    },
    767: {
      /* when window >= 767px - webflow tablet */ slidesPerView: 2,
      spaceBetween: 30,
    },
    988: {
      /* when window >= 988px - webflow desktop */ slidesPerView: 3,
      spaceBetween: 35,
      loop: false,
    },
  },

  /* uncomment if you want autoplay slider
          autoplay: {
            delay: 3000,
          },
          */
  scrollbar: {
    el: ".swiper-scrollbar",
    hide: true,
  },
});


var slider3 = new Swiper(".slider3", {
  loop: true,
  // Enable lazy loading
  lazy: true,
  navigation: {
    nextEl: ".swiper-button-next",
    prevEl: ".swiper-button-prev",
  },
  pagination: {
    el: ".swiper-pagination-3",
  },
  keyboard: {
    enabled: true,
  },
  breakpoints: {
    0: {
      /* when window >=0px - webflow mobile landscape/portriat */
      slidesPerView: 1.3,
      centeredSlides: true,
      spaceBetween: 20,
    },
    767: {
      /* when window >= 767px - webflow tablet */ slidesPerView: 2,
      spaceBetween: 30,
    },
    988: {
      /* when window >= 988px - webflow desktop */ slidesPerView: 4,
      spaceBetween: 15,
      loop: false,
    },
  },

  /* uncomment if you want autoplay slider
    autoplay: {
      delay: 3000,
    },
    */
  scrollbar: {
    el: ".swiper-scrollbar",
    hide: true,
  },
});