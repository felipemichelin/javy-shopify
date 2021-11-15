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





var accordion = (function () {
  var $accordion = $(".js-accordion");
  var $accordion_header = $accordion.find(".js-accordion-header");
  var $accordion_item = $(".js-accordion-item");

  // default settings
  var settings = {
    // animation speed
    speed: 400,

    // close all other accordion items if true
    oneOpen: false,
  };

  return {
    // pass configurable object literal
    init: function ($settings) {
      $accordion_header.on("click", function () {
        accordion.toggle($(this));
      });

      $.extend(settings, $settings);

      // ensure only one accordion is active if oneOpen is true
      if (settings.oneOpen && $(".js-accordion-item.active").length > 1) {
        $(".js-accordion-item.active:not(:first)").removeClass("active");
      }

      // reveal the active accordion bodies
      $(".js-accordion-item.active").find("> .js-accordion-body").show();
    },
    toggle: function ($this) {
      if (
        settings.oneOpen &&
        $this[0] !=
          $this
            .closest(".js-accordion")
            .find("> .js-accordion-item.active > .js-accordion-header")[0]
      ) {
        $this
          .closest(".js-accordion")
          .find("> .js-accordion-item")
          .removeClass("active")
          .find(".js-accordion-body")
          .hide();
      }

      // show/hide the clicked accordion item
      $this.closest(".js-accordion-item").toggleClass("active");
      $this.next().stop().slideToggle(settings.speed);
    },
  };
})();

$(document).ready(function () {
  accordion.init({ speed: 0, oneOpen: true });
});

$(document).scroll(function () {
  var y = $(this).scrollTop();
  if (y > 800) {
    $(".sticky_bar").fadeIn().css('display', 'flex');
  } else {
    $(".sticky_bar").fadeOut();
  }
});



jQuery(document).ready(function($) {
	function changePeopleCnt(){
		setTimeout(function() {
			var d = new Date();
			var number = 23 + Math.floor(Math.random() * 7);
			$(".visit_people_cnt").text(number);
		}, 12000);
	};
	setInterval(changePeopleCnt, 4407);
	changePeopleCnt();
});




window.checkoutReadyCallbacks = window.checkoutReadyCallbacks || [];
window.checkoutReadyCallbacks.push(async () => {
  let updateRec = RTC.getVariantQuantities();
  Object.keys(updateRec).forEach((x) => (updateRec[x] = 0));
  await RTC.setVariantQuantities(updateRec);
  console.log("cleared");

});
