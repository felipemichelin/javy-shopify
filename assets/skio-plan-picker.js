/**
 * PARAMETERS
 *  - planPickerEl: (required) the element to be used as the plan picker
 *  - overrides: (optional) override certain values
 * 
 * OVERRIDES
 *  - getVariantId: function
 * 
 * EVENTS
 *  - skio:plan-picker:loaded - (window) when skio script is loaded
 *  - skio:plan-picker:init - (planPickerEl) when skio instance is initialized
 *  - skio:plan-picker:updated - (planPickerEl) when skio instance is updated
 */

(() => {
  if (window.SkioPlanPicker) return Error('Skio: Skio already loaded');

  // Skio Instances
  window.SkioPlanPickerInstances = [];

  window.SkioPlanPicker = ({ planPickerEl, overrides = {} } = {}) => {
    try {
      const skio = {};

      // Log level
      skio.logLevel = 'info'; // set to error after setup
      const logLevels = { info: 1, warn: 2, error: 3 };

      function assert(condition, message, { messageType = 'error', exit = false, docsLink }) {
        if (!condition) {
          const formattedMessage = 'Skio' + (skio.key ? `-${skio.key}` : '') + ': ' + message + 
            (docsLink ? `\n\nCheck out ${docsLink}` : ''); 
          if (exit) throw Error(formattedMessage);
          if (!console[messageType]) messageType = 'error';
          if (logLevels[messageType] >= logLevels[skio.logLevel])
            console[messageType](formattedMessage);
          return true;
        }
        return false;
      }

      assert(planPickerEl, 'No planPickerEl provided', { exit: true });
      skio.planPickerEl = planPickerEl;
  
      // KEY
      skio.key = planPickerEl.getAttribute('skio-plan-picker');
      const keyCount = document.querySelectorAll(`[skio-plan-picker="${skio.key}"]`).length;
      assert(
        keyCount === 1,
        `Key needs to be unique, key: '${skio.key}' used ${keyCount} times`,
        { exit: true }
      );

      // MAIN PRODUCT
      skio.mainProduct = planPickerEl.hasAttribute('skio-main-product');

      // DISCOUNT FORMAT	
      skio.discountFormat = planPickerEl.getAttribute('skio-discount-format');	
      assert(	
        skio.discountFormat === 'percent' || skio.discountFormat === 'absolute', 	
        'Invalid discount format', 	
        { exit: true }	
      );

      // SELECTORS
      skio.selectors = {
        sellingPlanId: 'input[name="selling_plan"]',
        variantId: '[name="id"]',
        productJson: '[skio-product-json]',
        onetime: '[skio-one-time]',
        groupContainer: '[skio-group-container]',
        sellingPlanGroup: (id) => `[skio-selling-plan-group${id ? `="${id}"` : ''}]`,
        groupInput: `input[name="skio-group-${skio.key}"]`,
        sellingPlans: (id) => `[skio-selling-plans${id ? `="${id}"` : ''}]`,
        onetimePrice: '[skio-onetime-price]',
        subscriptionPrice: '[skio-subscription-price]',
        discount: '[skio-discount]',
        discountProperty: '[name="properties[Discount]"]',
      };

      skio.currentSelection = planPickerEl.querySelector(skio.selectors.onetime).checked ? 'one-time' : 'subscription';
  
      // FORM
      const sellingPlanEls = planPickerEl.querySelectorAll(skio.selectors.sellingPlanId);
      assert(sellingPlanEls.length !== 0, 'No selling plan input element found', { exit: true });
      assert(sellingPlanEls.length === 1, 'More than 1 selling plan input element found', 
        { messageType: 'warn' });
      const sellingPlanEl = sellingPlanEls[0];
      skio.formAttr = sellingPlanEl.getAttribute('form');
  
      if (skio.formAttr) skio.form = document.getElementById(skio.formAttr);
      if (!skio.form) skio.form = planPickerEl.closest('form[action*="/cart/add"]');
      assert(
        skio.form, 'Couldn\'t find form, either connect to a form or submit using javascript', 
        { messageType: 'warn' }
      );
  
      // PRODUCT
      if (overrides.product) skio.product = overrides.product;
      else {
        const productJsonEls = planPickerEl.querySelectorAll(skio.selectors.productJson);
        assert(productJsonEls.length > 0, 'No product json element found', { exit: true });
        assert(productJsonEls.length === 1, 'Multiple product json elements found', 
          { messageType: 'warn' });
        skio.product = JSON.parse(productJsonEls[0].innerHTML);
      }
      assert(skio.product, 'Product is required', { exit: true });
  

      // VARIANT ID
      const validateVariantId = (variantId) => {
        try {
          const type = typeof variantId;
          const isNumber = type === 'number';
          assert(isNumber, `Variant id needs to be a number, got '${type}'`, { exit: true });
          const index = skio.product.variants.findIndex(variant => variant.id == variantId);
          const found = index !== -1;
          assert(found, `Variant with id '${variantId}' not found`, { exit: true });
          return true;
        } catch (err) {
          console.error(err);
          return false;
        }
      }
  
      const getVariantId = () => {
        try {
          // Override
          if (typeof overrides.getVariantId === 'function') {
            const variantId = overrides.getVariantId();
            assert(validateVariantId(variantId), `Invalid variant id '${variantId}'`, 
              { exit: true });
            skio.variantId = variantId;
            return variantId;
          }
          // Default
          if (skio.form) {
            const variantIdEl = skio.form.querySelector(skio.selectors.variantId);
            assert(
              variantIdEl, 
              `Can't find variant id element using selector '${skio.selectors.variantId}'`, 
              { exit: true }
            );
            const variantId = parseInt(variantIdEl.value);
            assert(validateVariantId(variantId), `Invalid variant id '${variantId}'`, 
              { exit: true });
            skio.variantId = variantId;
            return variantId;
          }
          assert(false, 'Failed to get variant id. No form and no getVariantId() override provided',
            { exit: true });
        } catch (err) {
          console.error(err);
          skio.variantId = null;
          return null;
        }
      }

      const getVariant = () => {
        const variantId = getVariantId();
        if (variantId === null) return null;
        const variant = skio.product.variants.find(variant => variant.id === variantId);
        skio.variant = variant;
        return variant;
      }

      // SELLING PLAN GROUPS
      const getAvailableSellingPlanGroupIds = () => {
        const variant = getVariant();
        const availableSellingPlanGroupIdsSet = new Set();
        variant.selling_plan_allocations.forEach(selling_plan_allocation => {
          const selling_plan_group_id = selling_plan_allocation.selling_plan_group_id;
          const selling_plan_group = skio.product.selling_plan_groups.find(
            selling_plan_group => selling_plan_group.id === selling_plan_group_id);
          if (selling_plan_group.name === 'Subscription' || selling_plan_group.name === 'Prepaid')
            availableSellingPlanGroupIdsSet.add(selling_plan_allocation.selling_plan_group_id);
        });
        const availableSellingPlanGroupIds = Array.from(availableSellingPlanGroupIdsSet);
        skio.availableSellingPlanGroupIds = availableSellingPlanGroupIds;
        return availableSellingPlanGroupIds;
      }
  
      skio.updateSellingPlanGroupAvailability = () => {
        try {
          const availableSellingPlanGroupIds = getAvailableSellingPlanGroupIds();
          assert(
            availableSellingPlanGroupIds !== null,
            'Issue getting available selling plan group ids',
            { exit: true }
          );
          const sellingPlanGroupEls = planPickerEl.querySelectorAll(skio.selectors.sellingPlanGroup());
          let checkedNoLongerAvailable = false;
          sellingPlanGroupEls.forEach(sellingPlanGroupEl => {
            const sellingPlanGroupId = sellingPlanGroupEl.getAttribute('skio-selling-plan-group');
            const isAvailable = availableSellingPlanGroupIds.includes(sellingPlanGroupId);
            sellingPlanGroupEl.disabled = !isAvailable;
            const groupContainerEl = sellingPlanGroupEl.closest(skio.selectors.groupContainer);
            if (isAvailable) groupContainerEl.classList.add('skio-group-container--available');
            else groupContainerEl.classList.remove('skio-group-container--available');

            if (sellingPlanGroupEl.checked && !isAvailable) {
              checkedNoLongerAvailable = true;
              sellingPlanGroupEl.checked = false;
            }
          });

          if (checkedNoLongerAvailable) {
            const onetimeEl = planPickerEl.querySelector(skio.selectors.onetime);
            if (onetimeEl && availableSellingPlanGroupIds.length === 0) 
              onetimeEl.checked = true;
            else {
              const firstAvailableSellingPlanGroupEl = 
                planPickerEl.querySelector(`${skio.selectors.sellingPlanGroup()}:not(:disabled)`);
              if (firstAvailableSellingPlanGroupEl) firstAvailableSellingPlanGroupEl.checked = true;
            }
          }

          skio.updateSellingPlan();
        } catch (err) {
          console.error(err);
        }
      }

      const getSelectedSellingPlanGroupId = () => {
        try {
          planPickerEl.querySelectorAll(skio.selectors.groupInput).forEach(el => 
            el.closest(skio.selectors.groupContainer).classList
            .remove('skio-group-container--selected'));

          let subscriptionContentEl = document.querySelector('[skio-subscription-content]')
          if(subscriptionContentEl) {
            subscriptionContentEl.style.display = 'none';
          }
            
          const onetimeEl = planPickerEl.querySelector(skio.selectors.onetime);
          if (onetimeEl?.checked) {
            onetimeEl.closest(skio.selectors.groupContainer).classList
              .add('skio-group-container--selected');
            skio.selectedSellingPlanGroupId = null;
            return null;
          }
          const selectedSellingPlanGroupEl = planPickerEl.querySelector(
            `${skio.selectors.sellingPlanGroup()}:checked`);
          if (
            assert(selectedSellingPlanGroupEl, 'No selected selling plan group', { messageType: 'warn' })
          ) return null;
          selectedSellingPlanGroupEl.closest(skio.selectors.groupContainer).classList
            .add('skio-group-container--selected');
            
          if(subscriptionContentEl) {
            subscriptionContentEl.style.display = 'block';
          }
          
          const selectedSellingPlanGroupId =
            selectedSellingPlanGroupEl.getAttribute('skio-selling-plan-group');
          assert(selectedSellingPlanGroupId, 'No selected selling plan group id', { exit: true });
          skio.selectedSellingPlanGroupId = selectedSellingPlanGroupId;
          return selectedSellingPlanGroupId;
        } catch (err) {
          console.error(err);
          skio.selectedSellingPlanGroupId = null;
          return null;
        }
      }

      // SELLING PLAN
      const validateSellingPlanId = (sellingPlanId) => {
        try {
          const type = typeof sellingPlanId;
          const isNumber = type === 'number'
          assert(isNumber, `Selling plan id needs to be a number, got '${type}'`, { exit: true });
          const variant = getVariant();
          const index = variant.selling_plan_allocations.findIndex(selling_plan_allocation => 
            selling_plan_allocation.selling_plan_id === sellingPlanId);
          const found = index !== -1;
          assert(found, `Selling plan with id ${sellingPlanId} not found`, { exit: true });
          return true;
        } catch (err) {
          console.error(err);
          return false;
        }
      };

      const updateUrlParam = (sellingPlanId) => {
        setTimeout(() => {
          if (sellingPlanId !== '' && !validateSellingPlanId(sellingPlanId)) sellingPlanId = '';
          const url = new URL(window.location.href);
          url.searchParams.set('selling_plan', sellingPlanId);
        
          window.history.replaceState({}, '', url.href);
        }, 100);
      }

      skio.updateSellingPlan = () => {
        try {
          const sellingPlanEl = planPickerEl.querySelector(skio.selectors.sellingPlanId);
          assert(sellingPlanEl, 'Couldn\'t find selling plan element', { exit: true });
          
          const sellingPlanGroupId = getSelectedSellingPlanGroupId();
          
          let sellingPlanId;
          let sellingPlanName;
          if (!sellingPlanGroupId) sellingPlanId = '', sellingPlanName = '';
          else {
            const sellingPlansEl = planPickerEl.querySelector(
              skio.selectors.sellingPlans(sellingPlanGroupId));
            assert(sellingPlansEl, 'Couldn\'t find selling plans element', { exit: true });
            sellingPlanId = parseInt(sellingPlansEl.value);
            sellingPlanName = sellingPlansEl.options[sellingPlansEl.selectedIndex].text
            assert(validateSellingPlanId(sellingPlanId), 'Invalid selling plan id', { exit: true });

            if (planPickerEl.querySelectorAll(skio.selectors.sellingPlans()).length > 1) {
              planPickerEl.querySelectorAll(skio.selectors.sellingPlans()).forEach((selector) => {
                let option = Array.from(selector.options).find(option => option.text == sellingPlanName);
                if (option) selector.value = option.value
              });
            }
            
          }
  
          skio.sellingPlanId = sellingPlanId;
          sellingPlanEl.value = sellingPlanId;
          if (skio.mainProduct) updateUrlParam(sellingPlanId);
          updateDiscounts();
          updatePrices();
          planPickerEl.dispatchEvent(new CustomEvent('skio:plan-picker:update', { detail: { skio } }));
        } catch (err) {
          console.error(err);
        }
      }

      // MONEY
      skio.moneyFormatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: window?.Shopify?.currency?.active || 'USD',
      });

      /**
       * Needs to run after updateSellingPlan()
       * The logic here should match the discount logic in skio-plan-picker.liquid
       */
      const updateDiscounts = () => {
        skio.availableSellingPlanGroupIds.forEach(availableSellingPlanGroupId => {	
          const sellingPlanGroupEl = planPickerEl.querySelector(	
            `${skio.selectors.sellingPlanGroup(availableSellingPlanGroupId)}`	
          );	
          if (assert(sellingPlanGroupEl, 
            `No selling group element found with id "${availableSellingPlanGroupId}"`, 	
            { messageType: 'info' })) return;	
          const sellingPlansEl = sellingPlanGroupEl.closest(skio.selectors.groupContainer)
            .querySelector(skio.selectors.sellingPlans());	
          if (assert(sellingPlansEl, 'No selling plans element found', 	
            { messageType: 'info' })) return;	
          const discountEls = sellingPlanGroupEl	
            .parentElement.querySelectorAll(skio.selectors.discount);	
          if (assert(discountEls.length > 0, 'No discount element', { messageType: 'info' })) return;	
          const selling_plan_group = skio.product.selling_plan_groups	
            .find(selling_plan_group => selling_plan_group.id === availableSellingPlanGroupId);	
          const selling_plan = selling_plan_group.selling_plans	
            .find(selling_plan => selling_plan.id === parseInt(sellingPlansEl.value));	
          const price_adjustment = selling_plan.price_adjustments[0];	
  	
          let current_discount_percent = 0;	
          let current_discount_absolute = 0;	
          switch (price_adjustment.value_type) {	
            case 'percentage':	
              current_discount_percent = price_adjustment.value;
              current_discount_absolute = Math.round(skio.variant.price * price_adjustment.value / 100.0);	
              break;	
            case 'fixed_amount':	
              current_discount_percent = Math.round(price_adjustment.value * 1.0 / skio.variant.price * 100.0);	
              current_discount_absolute = price_adjustment.value;	
              break;	
            case 'price':
              if(skio.variant.compare_at_price) {
                current_discount_percent = Math.round((skio.variant.compare_at_price - price_adjustment.value) * 1.0 / skio.variant.compare_at_price * 100.0);	
                current_discount_absolute = skio.variant.compare_at_price - price_adjustment.value;
              } else {
                current_discount_percent = Math.round((skio.variant.price - price_adjustment.value) * 1.0 / skio.variant.price * 100.0);	
                current_discount_absolute = skio.variant.price - price_adjustment.value;
              }
              break;	
          }	

          let current_discount_text;	
          if (current_discount_percent == 0) current_discount_text = '';	
          else if (skio.discountFormat === 'percent')	
            current_discount_text = `${current_discount_percent}%`;	
          else current_discount_text = skio.moneyFormatter.format(current_discount_absolute / 100);	
          
          discountEls.forEach(el => el.innerHTML = current_discount_text);
        });

        const discountPropertyEl = planPickerEl.querySelector(skio.selectors.discountProperty);	
        if (discountPropertyEl) {	
          const onetimeEl = planPickerEl.querySelector(skio.selectors.onetime);	
          if (onetimeEl?.checked) {	
            discountPropertyEl.disabled = true;	
            discountPropertyEl.value = '';	
          } else {	
            discountPropertyEl.disabled = false;	
            const selectedSellingPlanGroupEl = planPickerEl	
              .querySelector(skio.selectors.sellingPlanGroup(skio.selectedSellingPlanGroupId));	
            const discount = selectedSellingPlanGroupEl.parentElement	
              .querySelector(skio.selectors.discount).innerHTML;	
            discountPropertyEl.value = discount;	
          }	
        }
      }

      const updatePrices = () => {
        let subscriptionPrice;

        // Selling Plans	
        skio.availableSellingPlanGroupIds.forEach(availableSellingPlanGroupId => {	
          const sellingPlanGroupEl = planPickerEl.querySelector(	
            `${skio.selectors.sellingPlanGroup(availableSellingPlanGroupId)}`	
          );	
          if (assert(sellingPlanGroupEl, 
            `No selling group element found with id "${availableSellingPlanGroupId}"`, 	
            { messageType: 'info' })) return;	
          const sellingPlansEl = sellingPlanGroupEl.closest(skio.selectors.groupContainer)
            .querySelector(skio.selectors.sellingPlans());	
          if (assert(sellingPlansEl, 'No selling plans element found', 	
            { messageType: 'info' })) return;	
          const sellingPlan = skio.product.selling_plan_groups	
            .find(selling_plan_group => selling_plan_group.id === availableSellingPlanGroupId)	
            .selling_plans	
            .find(selling_plan => selling_plan.id === parseInt(sellingPlansEl.value));	
          const subscriptionPriceEl = sellingPlanGroupEl.parentElement
            .querySelector(skio.selectors.subscriptionPrice);	
          if (assert(subscriptionPriceEl, 'No price element found', 	
            { messageType: 'info' })) return;	
          const sellingPlanAllocation = skio.variant.selling_plan_allocations.find(
            selling_plan_allocation => selling_plan_allocation.selling_plan_id === sellingPlan.id)
          const price = sellingPlanAllocation.price / 100;
          subscriptionPriceEl.innerHTML = skio.moneyFormatter.format(price);

          subscriptionPrice = price;
        })	
        // One-time	
        const onetimePriceEl = planPickerEl.querySelector(skio.selectors.onetimePrice);

        if (onetimePriceEl) {
          const onetimePrice = skio.variant.price / 100;	
          const onetimePriceFormatted = skio.moneyFormatter.format(onetimePrice);	
          onetimePriceEl.innerHTML = onetimePriceFormatted;
        }

        if(skio.currentSelection == 'subscription') {
          document.querySelector('[data-price-wrapper]').style.display = 'none';
          document.querySelector('[skio-subscription-price-wrapper]').style.display = 'flex';
          document.querySelector('[skio-subscription-product-price]').innerHTML = skio.moneyFormatter.format(subscriptionPrice);

          if(skio.variant.compare_at_price) {
            document.querySelector('[skio-subscription-product-price-compare]').innerHTML = skio.moneyFormatter.format(skio.variant.compare_at_price / 100);
            document.querySelector('[skio-subscription-product-price-compare]').style.display = 'block';
            var saving_total = ((1 - subscriptionPrice / (skio.variant.compare_at_price / 100))*100).toFixed(0);
          } else {
            if(skio.variant.price > subscriptionPrice) {
              document.querySelector('[skio-subscription-product-price-compare]').innerHTML = skio.moneyFormatter.format(skio.variant.price / 100);
              document.querySelector('[skio-subscription-product-price-compare]').style.display = 'block';
            } else {
              document.querySelector('[skio-subscription-product-price-compare]').style.display = 'none';
            }
            
            var saving_total = ((1 - subscriptionPrice / (skio.variant.price / 100))*100).toFixed(0);
          }

          document.querySelector('[skio-subscription-price-savings]').innerHTML = saving_total + '%';
        } else {
          document.querySelector('[skio-subscription-price-wrapper]').style.display = 'none';
          document.querySelector('[data-price-wrapper]').style.display = 'flex';
        }
      }

      skio.update = () => skio.updateSellingPlanGroupAvailability();
      skio.update();

      // LISTENERS
      planPickerEl
        .querySelectorAll(skio.selectors.groupInput)
        .forEach(el => el.addEventListener('change', (event) => {
          if(event.target.hasAttribute('skio-one-time')) {
            skio.currentSelection = 'one-time';
          } else {
            skio.currentSelection = 'subscription';
          }
          
          skio.updateSellingPlanGroupAvailability();

          window.dispatchEvent(new CustomEvent('skio:plan-picker:group-update', {
            detail: {
              selection: skio.currentSelection
            }
          }));

          document.querySelectorAll('.variant-input').forEach((el) => {
            let numberOfBottles = el.querySelector('.variant-swatch').getAttribute('data-bottlecnt');

            let currentVariant = skio.product.variants.find(x => x.option1 == el.querySelector('input').value);

            if(skio.currentSelection == 'subscription') {
              let price = currentVariant.selling_plan_allocations[0].price / numberOfBottles;
              el.querySelector('.unit_price').innerText = skio.moneyFormatter.format(price / 100) + '/each';
            } else {
              let price = currentVariant.price / numberOfBottles;
              el.querySelector('.unit_price').innerText = skio.moneyFormatter.format(price / 100) + '/each';
            }
          });
        }));
      
      planPickerEl
        .querySelectorAll(skio.selectors.sellingPlans())
        .forEach(el => el.addEventListener('change', (e) => {
          const sellingPlanGroupEl = e.currentTarget.closest(skio.selectors.groupContainer)
            .querySelector(skio.selectors.groupInput);
          if (sellingPlanGroupEl.checked) skio.updateSellingPlan();
          else {
            sellingPlanGroupEl.checked = true;
            skio.updateSellingPlan();
          }
        }));
      
      skio.form
        .querySelector(skio.selectors.variantId)
        .addEventListener('change', skio.update);
        // .querySelectorAll(skio.selectors.variantId)
        // .forEach(el => el.addEventListener('DOMSubtreeModified', skio.update));

      // Create MutationObserver instance to watch for change of selected option value inside select element for variant IDs
      // skio.variantObserver = 
      //   new MutationObserver(function(mutationsList, observer) {
      //     for(const mutation of mutationsList) {
      //       if (mutation.type === 'attributes') skio.update();
      //     }
      //   }).observe(skio.form.querySelector(skio.selectors.variantId), { attributeFilter: ['selected'], subtree: true });
  
      // Fire init event
      planPickerEl.dispatchEvent(new CustomEvent('skio:plan-picker:init', { detail: { skio } }));
      // Add to instances
      window.SkioPlanPickerInstances.push(skio);
      // Attach to planPickerEl
      planPickerEl.skio = skio;

      return skio;
    } catch (err) {
      console.error(err);
    }
  };

  // Auto init
  const autoInitPlanPickerEls = document.querySelectorAll(
    '[skio-plan-picker][skio-auto-init]'
  );
  autoInitPlanPickerEls.forEach(autoInitPlanPickerEl => {
    window.SkioPlanPicker({ planPickerEl: autoInitPlanPickerEl });
  });

  window.dispatchEvent(new CustomEvent('skio:plan-picker:loaded'));
})()
