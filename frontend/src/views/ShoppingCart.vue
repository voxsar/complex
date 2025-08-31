<template>
  <div class="shoppingcart">
    <div class="sptitle col-md-12">
      <h3>SHOPPING CART</h3>
      <h4 class="style">PROCEED TO CHECKOUT</h4>
    </div>
    <div class="content col-md-12">
      <ul class="title clearfix">
        <li class="text1"><a href="#">PRODUCT NAME</a></li>
        <li class="text2"><a href="#">UNIT PRICE</a></li>
        <li class="text2"><a href="#">QTY</a></li>
        <li class="text2"><a href="#">SUB TOTAL</a></li>
      </ul>

      <ul class="nav-mid clearfix">
        <li class="image"><a href="#"><img :src="placeholder" alt="" /></a></li>
        <li class="item-title"><a href="#">Modular Modern</a></li>
        <li class="icon1"><i class="btn-edit fa fa-edit"></i></li>
        <li class="price1">$659.00</li>
        <li class="number"><a href="#">1</a></li>
        <li class="price2">$659.00</li>
        <li class="icon2"><i class="btn-remove fa fa-remove"></i></li>
      </ul>
      <ul class="nav-mid clearfix">
        <li class="image"><a href="#"><img :src="placeholder" alt="" /></a></li>
        <li class="item-title"><a href="#">Modular Modern</a></li>
        <li class="icon1"><i class="btn-edit fa fa-edit"></i></li>
        <li class="price1">$659.00</li>
        <li class="number"><a href="#">1</a></li>
        <li class="price2">$659.00</li>
        <li class="icon2"><i class="btn-remove fa fa-remove"></i></li>
      </ul>
      <ul class="nav-mid clearfix">
        <li class="image"><a href="#"><img :src="placeholder" alt="" /></a></li>
        <li class="item-title"><a href="#">Modular Modern</a></li>
        <li class="icon1"><i class="btn-edit fa fa-edit"></i></li>
        <li class="price1">$659.00</li>
        <li class="number"><a href="#">1</a></li>
        <li class="price2">$659.00</li>
        <li class="icon2"><i class="btn-remove fa fa-remove"></i></li>
      </ul>
      <ul class="nav-bot clearfix">
        <li class="continue"><a href="#">Continue shopping</a></li>
        <li class="clear"><a href="#">clear shopping cart</a></li>
        <li class="update"><a href="#">update shopping cart</a></li>
      </ul>
      <div class="row">
        <form class="col-md-4">
          <div class="form-bd">
            <h3>ESTIMATE SHIPPING AND TAX</h3>
            <p class="text1">Enter your destination to get a shipping estimate.</p>
            <p class="country">
              <span class="color1">*</span>Country
            </p>
            <select id="country" class="validate-select" title="Country" name="country_id">
              <option value="AF">Afghanistan</option>
              <option value="AL">Albania</option>
              <option value="DZ">Algeria</option>
              <option value="AS">American Samoa</option>
              <option value="AD">Andorra</option>
              <option value="AO">Angola</option>
              <option value="AI">Anguilla</option>
            </select>

            <p>State/Province</p>

            <select id="region_id" class="required-entry validate-select" title="State/Province" name="region_id">
              <option value="">Please select region, state or province</option>
              <option value="1">Alabama</option>
              <option value="2">Alaska</option>
              <option value="3">American Samoa</option>
              <option value="4">Arizona</option>
              <option value="5">Arkansas</option>
              <option value="6">Armed Forces Africa</option>
              <option value="7">Armed Forces Americas</option>
              <option value="8">Armed Forces Canada</option>
              <option value="9">Armed Forces Europe</option>
              <option value="10">Armed Forces Middle East</option>
            </select>
            <p class="zip">Zip/Postal Code</p>
            <input class="style23" type="text" value="" size="30" />
            <span class="style-bd">Get a quote</span>
          </div>
        </form>
        <form class="col-md-4">
          <div class="form-bd">
            <h3>DISCOUNT CODES</h3>
            <p class="formbd2">Enter your coupon code if you have one.</p>
            <input class="styleip" type="text" value="" size="30" />
            <span class="style-bd">Apply coupon</span>
          </div>
        </form>
        <form class="form-right col-md-4">
          <div class="form-bd">
            <p class="subtotal">
              <span class="text1">SUBTOTAL:</span>
              <span class="text2">$1,794.00</span>
            </p>
            <h3>
              <span class="text3">GRAND TOTAL:</span>
              <span class="text4">$1,794.00</span>
            </h3>
            <span class="style-bd">Proceed to checkout</span>
            <p class="checkout">Checkout with Multiple Addresses</p>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
const placeholder = new URL('@/assets/images/placehoder.jpg', import.meta.url).href;
</script>

<style lang="less">
@import '../assets/less/variables.less';
@import '../assets/less/shopping-checkout.less';
</style>
