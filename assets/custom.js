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
  var slider3 = new Swiper(".slider3", {
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