jQuery(document).ready(function($) {
  var sub_variants = {
    "3_Bottles": {
      "30_days": {
        id: "40460119179425",
        price: 47.85,
        reg_price: 74.85,
        freeshipping: true
      },
      "2_weeks": {
        id: "40460119179425",
        price: 47.85,
        reg_price: 74.85,
        freeshipping: true
      },
      "sub_unit_price": 15.95,
      "one_unit_price": 17.95
    },
    "2_Bottles": {
      "30_days": {
        id: "40460119146657",
        price: 33.90,
        reg_price: 49.90,
        freeshipping: true
      },
      "2_weeks": {
        id: "40460119146657",
        price: 33.90,
        reg_price: 49.90,
        freeshipping: true
      },
      "sub_unit_price": 16.95,
      "one_unit_price": 18.95
    },
    "1_Bottle": {
      "30_days": {
        id: "40460119113889",
        price: 17.95,
        reg_price: 24.95,
        freeshipping: false
      },
      "2_weeks": {
        id: "40460119113889",
        price: 17.95,
        reg_price: 24.95,
        freeshipping: false
      },
      "sub_unit_price": 17.95,
      "one_unit_price": 19.95
    }
  };
  
  function update_product_info(obj) {
    $(".checkout-compare-price").text("$" + obj.reg_price.toFixed(2));
    $(".checkout-price").text("$" + obj.price.toFixed(2));
    $(".checkout-compare-price-savings-pct").text("$" + (obj.reg_price - obj.price).toFixed(2));
      $(".youresaving").hide();

    console.log(obj.freeshipping);
    console.log(typeof obj.freeshipping);
    if(obj.freeshipping) {
      $(".freeshipping_text").show();
    }
    else {
      $(".freeshipping_text").hide();
    }
  }
  
  $(".es_frequency .es_variant-option").click(function(e) {
    $(this).parent().find(".es_variant-option").removeClass("active");
    $(this).addClass("active");
    
    var package = $(".variant-input-wrap input[type=radio]:checked").parent().attr("data-value");
    var frequency = $(".es_variant-options .es_variant-option.es_option-radio.active").attr("data-value");
    
    if(frequency == 'subscription') {    
      update_product_info(sub_variants[package][$(".es_frequency_cycle_selector").val()]);
      $(".es_frequency_cycle").show();
      $(".product__checkout_row").hide();
      $(".shopify-payment-button").hide();
      $(".payment_button-row-for_subscription").show();
      $(".shoppay").hide();
      $(".badge-freeshipping").show();
      
      $.each($(".variant-input"), function() {
        var pack = $(this).attr("data-value");        
        $(this).find(".unit_price").text("$" + sub_variants[pack]['sub_unit_price'] + "/each");
      });

      
    }
    else {
      update_product_info();
      $(".variant-input-wrap input[type=radio]:checked").trigger("change");
      $(".es_frequency_cycle").hide();
      $(".product__checkout_row").show();
      $(".shopify-payment-button").show();
      $(".payment_button-row-for_subscription").hide();
      $(".shoppay").show();
      $(".youresaving").hide();

      $(".badge-freeshipping").hide();
      


      
      $.each($(".variant-input"), function() {
        var pack = $(this).attr("data-value");        
        $(this).find(".unit_price").text("$" + sub_variants[pack]['one_unit_price'] + "/each");
        $(".youresaving").hide();

      });
    }
  });


  
  $(".shopify-payment-button__button-for_subscription").click(function(e) {
    e.preventDefault();
    
    window.location.href = "https://try.javycoffee.com/checkout/?utm_source=shopify&forceVariantId=" + sub_variants[$(".variant-input-wrap input[type=radio]:checked").parent().attr("data-value")][$(".es_frequency_cycle_selector").val()].id;
  });
});